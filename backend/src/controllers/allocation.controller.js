import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

const createSchema = z.object({
  assetId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  holderUserId: z.string().cuid().optional(),
  holderDepartmentId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
}).refine((data) => Boolean(data.userId || data.holderUserId) !== Boolean(data.holderDepartmentId), {
  message: 'Allocate to exactly one employee or department',
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

export const createAllocation = async (req, res) => {
  const data = createSchema.parse(req.body);
  const holderUserId = data.holderUserId ?? data.userId ?? null;
  const holderDepartmentId = data.holderDepartmentId ?? null;

  const [asset, recipient, department] = await Promise.all([
    prisma.asset.findUnique({
      where: { id: data.assetId },
      include: {
        allocations: {
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
          include: {
            holderUser: { select: { id: true, name: true, email: true, department: { select: { name: true } } } },
            holderDepartment: { select: { id: true, name: true } },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    holderUserId
      ? prisma.user.findUnique({ where: { id: holderUserId }, select: { id: true, name: true, email: true } })
      : null,
    holderDepartmentId
      ? prisma.department.findUnique({ where: { id: holderDepartmentId }, select: { id: true, name: true } })
      : null,
  ]);

  if (!asset) throw new ApiError(404, 'Asset not found');
  if (holderUserId && !recipient) throw new ApiError(404, 'Employee not found');
  if (holderDepartmentId && !department) throw new ApiError(404, 'Department not found');
  if (asset.isBookable) throw new ApiError(409, 'Bookable shared resources must be booked, not allocated');

  if (asset.status !== 'AVAILABLE') {
    const activeAllocation = asset.allocations[0] ?? null;
    const currentHolder = activeAllocation?.holderUser ?? activeAllocation?.holderDepartment ?? null;
    throw new ApiError(409, `Asset is not available for allocation. Current status: ${asset.status}`, [
      {
        code: 'ASSET_NOT_AVAILABLE',
        currentStatus: asset.status,
        currentHolder: currentHolder
          ? {
              id: currentHolder.id,
              name: currentHolder.name,
              email: currentHolder.email ?? null,
              department: currentHolder.department?.name ?? activeAllocation?.holderDepartment?.name ?? null,
            }
          : null,
      },
    ]);
  }

  const [allocation] = await prisma.$transaction([
    prisma.allocation.create({
      data: {
        assetId: data.assetId,
        holderUserId,
        holderDepartmentId,
        allocatedDate: new Date(),
        expectedReturnDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'ACTIVE',
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        holderUser: { select: { id: true, name: true, email: true } },
        holderDepartment: { select: { id: true, name: true } },
      },
    }),
    prisma.asset.update({
      where: { id: data.assetId },
      data: { status: 'ALLOCATED', holderUserId, holderDepartmentId },
    }),
  ]);

  if (holderUserId) {
    await notifyService.trigger(
      'ASSET_ALLOCATED',
      `${asset.name} (${asset.assetTag}) has been allocated to you`,
      [holderUserId],
      { entityType: 'Allocation', entityId: allocation.id }
    );
  }

  await activityLogService.log(req.user.userId, 'ASSET_ALLOCATED', 'Allocation', allocation.id, {
    assetId: data.assetId,
    holderUserId,
    holderDepartmentId,
    dueDate: data.dueDate,
  });

  res.status(201).json({ success: true, data: allocation });
};

export const returnAllocation = async (req, res) => {
  const { conditionNotes } = returnSchema.parse(req.body);

  const allocation = await prisma.allocation.findUnique({
    where: { id: req.params.id },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      holderUser: { select: { id: true, name: true } },
      holderDepartment: { select: { id: true, name: true } },
    },
  });

  if (!allocation) throw new ApiError(404, 'Allocation not found');
  if (allocation.status === 'RETURNED') throw new ApiError(409, 'This allocation has already been returned');

  const isOwner = allocation.holderUserId === req.user.userId;
  const isManager = ['ASSET_MANAGER', 'ADMIN'].includes(req.user.role);
  if (!isOwner && !isManager) throw new ApiError(403, 'You can only return your own allocations');

  await prisma.$transaction([
    prisma.allocation.update({
      where: { id: req.params.id },
      data: {
        status: 'RETURNED',
        returnedDate: new Date(),
        conditionCheckinNotes: conditionNotes ?? null,
      },
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE', holderUserId: null, holderDepartmentId: null },
    }),
  ]);

  await activityLogService.log(req.user.userId, 'ASSET_RETURNED', 'Allocation', allocation.id, {
    assetId: allocation.assetId,
    conditionNotes,
  });

  res.json({ success: true, message: 'Asset returned successfully', data: { allocationId: allocation.id } });
};

export const getAllocations = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const userFilter =
    req.user.role === 'EMPLOYEE'
      ? { holderUserId: req.user.userId }
      : query.userId
        ? { holderUserId: query.userId }
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
        holderUser: { select: { id: true, name: true, email: true, department: { select: { name: true } } } },
        holderDepartment: { select: { id: true, name: true } },
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
      holderUser: { select: { id: true, name: true, email: true } },
      holderDepartment: { select: { id: true, name: true } },
    },
  });
  if (!allocation) throw new ApiError(404, 'Allocation not found');
  res.json({ success: true, data: allocation });
};
