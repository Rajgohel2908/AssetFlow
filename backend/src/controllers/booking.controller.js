import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { checkBookingOverlap } from '../utils/overlapChecker.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  resourceId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  purpose: z.string().optional(),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

const rescheduleSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

const querySchema = z.object({
  resourceId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  userId: z.string().optional(),
  status: z.enum(['CONFIRMED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /bookings
 * BUSINESS RULE 5: Overlap check uses strict < / > — back-to-back slots are ALLOWED.
 */
export const createBooking = async (req, res) => {
  const data = createSchema.parse(req.body);
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  const resource = await prisma.resource.findUnique({ where: { id: data.resourceId } });
  if (!resource) throw new ApiError(404, 'Resource not found');
  if (!resource.isActive) throw new ApiError(409, 'Resource is not available for booking');

  // BUSINESS RULE 5: Strict overlap check (back-to-back allowed)
  const { conflict, booking: conflictingBooking } = await checkBookingOverlap(
    data.resourceId, startTime, endTime
  );

  if (conflict) {
    throw new ApiError(409, 'Booking time conflicts with an existing reservation', [
      {
        code: 'BOOKING_OVERLAP',
        conflictingBooking: {
          id: conflictingBooking.id,
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
          bookedBy: conflictingBooking.user?.name ?? 'Unknown',
          purpose: conflictingBooking.purpose,
        },
      },
    ]);
  }

  const booking = await prisma.booking.create({
    data: {
      resourceId: data.resourceId,
      userId: req.user.userId,
      startTime,
      endTime,
      purpose: data.purpose ?? null,
      status: 'CONFIRMED',
    },
    include: {
      resource: { select: { id: true, name: true, type: true, location: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  await activityLogService.log(req.user.userId, 'BOOKING_CREATED', 'Booking', booking.id, {
    resourceId: data.resourceId, startTime, endTime,
  });

  res.status(201).json({ success: true, data: booking });
};

export const getBookings = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  // Build date filter
  let dateFilter = {};
  if (query.date) {
    const dayStart = new Date(`${query.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${query.date}T23:59:59.999Z`);
    dateFilter = { startTime: { gte: dayStart, lte: dayEnd } };
  }

  const userFilter =
    req.user.role === 'EMPLOYEE' ? { userId: req.user.userId } : query.userId ? { userId: query.userId } : {};

  const where = {
    ...userFilter,
    ...dateFilter,
    ...(query.resourceId && { resourceId: query.resourceId }),
    ...(query.status && { status: query.status }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        resource: { select: { id: true, name: true, type: true, location: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
      skip,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    success: true, data: bookings,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
};

export const cancelBooking = async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { resource: { select: { name: true } } },
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'CANCELLED') throw new ApiError(409, 'Booking is already cancelled');

  const isOwner = booking.userId === req.user.userId;
  const isManager = ['ASSET_MANAGER', 'ADMIN'].includes(req.user.role);
  if (!isOwner && !isManager) throw new ApiError(403, 'You can only cancel your own bookings');

  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

  await activityLogService.log(req.user.userId, 'BOOKING_CANCELLED', 'Booking', booking.id, {
    resourceId: booking.resourceId, startTime: booking.startTime, endTime: booking.endTime,
  });

  res.json({ success: true, message: 'Booking cancelled successfully' });
};

export const rescheduleBooking = async (req, res) => {
  const data = rescheduleSchema.parse(req.body);
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'CANCELLED') throw new ApiError(409, 'Cannot reschedule a cancelled booking');

  const isOwner = booking.userId === req.user.userId;
  const isManager = ['ASSET_MANAGER', 'ADMIN'].includes(req.user.role);
  if (!isOwner && !isManager) throw new ApiError(403, 'You can only reschedule your own bookings');

  // Overlap check excluding this booking itself
  const { conflict, booking: conflictingBooking } = await checkBookingOverlap(
    booking.resourceId, startTime, endTime, booking.id
  );

  if (conflict) {
    throw new ApiError(409, 'New time slot conflicts with an existing reservation', [
      {
        code: 'BOOKING_OVERLAP',
        conflictingBooking: {
          id: conflictingBooking.id,
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
          bookedBy: conflictingBooking.user?.name ?? 'Unknown',
        },
      },
    ]);
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { startTime, endTime },
    include: {
      resource: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  });

  await activityLogService.log(req.user.userId, 'BOOKING_RESCHEDULED', 'Booking', booking.id, {
    before: { startTime: booking.startTime, endTime: booking.endTime },
    after: { startTime, endTime },
  });

  res.json({ success: true, data: updated });
};
