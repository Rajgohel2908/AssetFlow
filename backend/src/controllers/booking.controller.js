import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { checkBookingOverlap } from '../utils/overlapChecker.js';
import { activityLogService } from '../services/activityLog.service.js';

const createSchema = z.object({
  resourceId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  purpose: z.string().optional(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

const rescheduleSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

const querySchema = z.object({
  resourceId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  userId: z.string().optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'CONFIRMED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const bookingInclude = {
  resource: { select: { id: true, assetTag: true, name: true, location: true, status: true } },
  bookedBy: { select: { id: true, name: true, email: true } },
};

export const createBooking = async (req, res) => {
  const data = createSchema.parse(req.body);
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  const resource = await prisma.asset.findUnique({ where: { id: data.resourceId } });
  if (!resource || !resource.isBookable) throw new ApiError(404, 'Bookable resource not found');
  if (!['AVAILABLE', 'RESERVED'].includes(resource.status)) {
    throw new ApiError(409, `Resource is not available for booking. Current status: ${resource.status}`);
  }

  const { conflict, booking: conflictingBooking } = await checkBookingOverlap(data.resourceId, startTime, endTime);
  if (conflict) {
    throw new ApiError(409, 'Booking time conflicts with an existing reservation', [
      {
        code: 'BOOKING_OVERLAP',
        conflictingBooking: {
          id: conflictingBooking.id,
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
          bookedBy: conflictingBooking.bookedBy?.name ?? 'Unknown',
        },
      },
    ]);
  }

  const booking = await prisma.booking.create({
    data: {
      resourceId: data.resourceId,
      bookedById: req.user.userId,
      startTime,
      endTime,
      status: startTime <= new Date() ? 'ONGOING' : 'UPCOMING',
    },
    include: bookingInclude,
  });

  await activityLogService.log(req.user.userId, 'BOOKING_CREATED', 'Booking', booking.id, {
    resourceId: data.resourceId,
    startTime,
    endTime,
    purpose: data.purpose,
  });

  res.status(201).json({ success: true, data: booking });
};

export const getBookings = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  let dateFilter = {};
  if (query.date) {
    const dayStart = new Date(`${query.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${query.date}T23:59:59.999Z`);
    dateFilter = {
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    };
  }

  const status = query.status === 'CONFIRMED' ? undefined : query.status;
  const userFilter =
    req.user.role === 'EMPLOYEE'
      ? { bookedById: req.user.userId }
      : query.userId
        ? { bookedById: query.userId }
        : {};

  const where = {
    ...userFilter,
    ...dateFilter,
    ...(query.resourceId && { resourceId: query.resourceId }),
    ...(status && { status }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { startTime: 'asc' },
      skip,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    success: true,
    data: bookings,
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

  const isOwner = booking.bookedById === req.user.userId;
  const isManager = ['ASSET_MANAGER', 'ADMIN'].includes(req.user.role);
  if (!isOwner && !isManager) throw new ApiError(403, 'You can only cancel your own bookings');

  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

  await activityLogService.log(req.user.userId, 'BOOKING_CANCELLED', 'Booking', booking.id, {
    resourceId: booking.resourceId,
    startTime: booking.startTime,
    endTime: booking.endTime,
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

  const isOwner = booking.bookedById === req.user.userId;
  const isManager = ['ASSET_MANAGER', 'ADMIN'].includes(req.user.role);
  if (!isOwner && !isManager) throw new ApiError(403, 'You can only reschedule your own bookings');

  const { conflict, booking: conflictingBooking } = await checkBookingOverlap(
    booking.resourceId,
    startTime,
    endTime,
    booking.id
  );

  if (conflict) {
    throw new ApiError(409, 'New time slot conflicts with an existing reservation', [
      {
        code: 'BOOKING_OVERLAP',
        conflictingBooking: {
          id: conflictingBooking.id,
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
          bookedBy: conflictingBooking.bookedBy?.name ?? 'Unknown',
        },
      },
    ]);
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { startTime, endTime, status: startTime <= new Date() ? 'ONGOING' : 'UPCOMING' },
    include: bookingInclude,
  });

  await activityLogService.log(req.user.userId, 'BOOKING_RESCHEDULED', 'Booking', booking.id, {
    before: { startTime: booking.startTime, endTime: booking.endTime },
    after: { startTime, endTime },
  });

  res.json({ success: true, data: updated });
};
