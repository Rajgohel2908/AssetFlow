import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.string().min(2).max(50),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createResource = async (req, res) => {
  const data = createSchema.parse(req.body);
  const resource = await prisma.resource.create({ data });
  await activityLogService.log(req.user.userId, 'RESOURCE_CREATED', 'Resource', resource.id, { name: resource.name });
  res.status(201).json({ success: true, data: resource });
};

export const getResources = async (req, res) => {
  const { type, isActive } = req.query;
  const resources = await prisma.resource.findMany({
    where: {
      ...(type && { type: { contains: type, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    },
    include: { _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } } },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: resources });
};

export const getResource = async (req, res) => {
  const resource = await prisma.resource.findUnique({
    where: { id: req.params.id },
    include: {
      bookings: {
        where: { status: 'CONFIRMED', endTime: { gte: new Date() } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { startTime: 'asc' },
        take: 20,
      },
    },
  });
  if (!resource) throw new ApiError(404, 'Resource not found');
  res.json({ success: true, data: resource });
};

export const updateResource = async (req, res) => {
  const data = updateSchema.parse(req.body);
  const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Resource not found');
  const resource = await prisma.resource.update({ where: { id: req.params.id }, data });
  await activityLogService.log(req.user.userId, 'RESOURCE_UPDATED', 'Resource', resource.id, { before: existing, after: data });
  res.json({ success: true, data: resource });
};

export const deleteResource = async (req, res) => {
  const existing = await prisma.resource.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { bookings: { where: { status: 'CONFIRMED', endTime: { gte: new Date() } } } } } },
  });
  if (!existing) throw new ApiError(404, 'Resource not found');
  if (existing._count.bookings > 0) {
    throw new ApiError(409, 'Cannot delete resource — it has upcoming confirmed bookings');
  }
  await prisma.resource.delete({ where: { id: req.params.id } });
  await activityLogService.log(req.user.userId, 'RESOURCE_DELETED', 'Resource', req.params.id, { name: existing.name });
  res.json({ success: true, message: 'Resource deleted successfully' });
};
