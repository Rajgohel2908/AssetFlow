import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { assertTransition } from '../utils/stateTransitions.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  assetId: z.string().cuid(),
  userId: z.string().cuid(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

const returnSchema = z.object({
  conditionNotes: z.string().optional(),
});

const querySchema = z.object({
  userId: z.string().optional(),
  assetId: z.string().optional(),
  status: z.enum(['ACTIVE', 'RETURNED', 'OVERDUE']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /allocations
 * BUSINESS RULE 4: Reject with 409 + currentHolder info if asset isn't AVAILABLE.
 */
export const createAllocation = async (req, res) => {
  const data = createSchema.parse(req.body);

  const [asset, recipient] = await Promise.all([
    prisma.asset.findUnique({
      where: { id: data.assetId },
      include: {
        allocations: {
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
          include: { user: { select: { id: true, name: true, email: true, department: { select: { name: true } } } } },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: data.userId }, select: { id: true, name: true, email: true } }),
  ]);

  if (!asset) throw new ApiError(404, 'Asset not found');
  if (!recipient) throw new ApiError(404, 'Employee not found');

  // BUSINESS RULE 4: Must be AVAILABLE — return 409 with currentHolder
  if (asset.status !== 'AVAILABLE') {
    const currentHolder = asset.allocations[0]?.user ?? null;
    throw new ApiError(409, `Asset is not available for allocation. Current status: ${asset.status}`, [
      {
        code: 'ASSET_NOT_AVAILABLE',
        currentStatus: asset.status,
        currentHolder: currentHolder
          ? {
              id: currentHolder.id,
              name: currentHolder.name,
              email: currentHolder.email,
              department: currentHolder.department?.name ?? null,
            }
          : null,
      },
    ]);
  }

  // Use a transaction to ensure atomicity
  const [allocation] = await prisma.$transaction([
    prisma.allocation.create({
      data: {
        assetId: data.assetId,
        userId: data.userId,
        allocatedById: req.user.userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'ACTIVE',
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        allocatedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.asset.update({
      where: { id: data.assetId },
      data: { status: 'ALLOCATED' },
    }),
  ]);

  await notifyService.trigger(
    'ASSET_ALLOCATED',
    `${asset.name} (${asset.assetTag}) has been allocated to you`,
    [data.userId],
    { entityType: 'Allocation', entityId: allocation.id }
  );

  await activityLogService.log(req.user.userId, 'ASSET_ALLOCATED', 'Allocation', allocation.id, {
    assetId: data.assetId, userId: data.userId, dueDate: data.dueDate,
  });

  res.status(201).json({ success: true, data: allocation });
};

/**
 * POST /allocations/:id/return
 * Captures condition notes, reverts asset to AVAILABLE.
 */
export const returnAllocation = async (req, res) => {
  const { conditionNotes } = returnSchema.parse(req.body);

  const allocation = await prisma.allocation.findUnique({
    where: { id: req.params.id },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      user: { select: { id: true, name: true } },
    },
  });

  if (!allocation) throw new ApiError(404, 'Allocation not found');
  if (allocation.status === 'RETURNED') throw new ApiError(409, 'This allocation has already been returned');

  // Employee can only return their own allocation; Asset Managers/Admins can return any
  const isOwner = allocation.userId === req.user.userId;
  const isManager = ['ASSET_MANAGER', 'ADMIN'].includes(req.user.role);
  if (!isOwner && !isManager) {
    throw new ApiError(403, 'You can only return your own allocations');
  }

  await prisma.$transaction([
    prisma.allocation.update({
      where: { id: req.params.id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        conditionNotes: conditionNotes ?? null,
      },
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE' },
    }),
  ]);

  await activityLogService.log(req.user.userId, 'ASSET_RETURNED', 'Allocation', allocation.id, {
    assetId: allocation.assetId, conditionNotes,
  });

  res.json({ success: true, message: 'Asset returned successfully', data: { allocationId: allocation.id } });
};

export const getAllocations = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  // Employees can only see their own allocations
  const userFilter =
    req.user.role === 'EMPLOYEE'
      ? { userId: req.user.userId }
      : query.userId
      ? { userId: query.userId }
      : {};

  const where = {
    ...userFilter,
    ...(query.assetId && { assetId: query.assetId }),
    ...(query.status && { status: query.status }),
  };

  const [allocations, total] = await Promise.all([
    prisma.allocation.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true, category: { select: { name: true } } } },
        user: { select: { id: true, name: true, email: true } },
        allocatedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.allocation.count({ where }),
  ]);

  res.json({
    success: true,
    data: allocations,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
};

export const getAllocation = async (req, res) => {
  const allocation = await prisma.allocation.findUnique({
    where: { id: req.params.id },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      user: { select: { id: true, name: true, email: true } },
      allocatedBy: { select: { id: true, name: true } },
      transferRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!allocation) throw new ApiError(404, 'Allocation not found');
  res.json({ success: true, data: allocation });
};
