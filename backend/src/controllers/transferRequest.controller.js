import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

const createSchema = z.object({
  allocationId: z.string().cuid().optional(),
  assetId: z.string().cuid().optional(),
  toUserId: z.string().cuid().optional(),
  toHolderUserId: z.string().cuid().optional(),
  toHolderDepartmentId: z.string().cuid().optional(),
  reason: z.string().optional(),
}).refine((data) => data.allocationId || data.assetId, {
  message: 'allocationId or assetId is required',
}).refine((data) => Boolean(data.toUserId || data.toHolderUserId) !== Boolean(data.toHolderDepartmentId), {
  message: 'Transfer target must be exactly one employee or department',
});

const querySchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'REALLOCATED', 'PENDING']).optional(),
  assetId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const transferInclude = {
  asset: { select: { id: true, assetTag: true, name: true } },
  fromHolderUser: { select: { id: true, name: true, email: true } },
  fromHolderDept: { select: { id: true, name: true } },
  toHolderUser: { select: { id: true, name: true, email: true } },
  toHolderDept: { select: { id: true, name: true } },
  requestedBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
};

export const createTransferRequest = async (req, res) => {
  const data = createSchema.parse(req.body);
  const toHolderUserId = data.toHolderUserId ?? data.toUserId ?? null;
  const toHolderDepartmentId = data.toHolderDepartmentId ?? null;

  const allocation = data.allocationId
    ? await prisma.allocation.findUnique({
        where: { id: data.allocationId },
        include: {
          asset: { select: { id: true, assetTag: true, name: true, status: true } },
          holderUser: { select: { id: true, name: true } },
          holderDepartment: { select: { id: true, name: true } },
        },
      })
    : await prisma.allocation.findFirst({
        where: { assetId: data.assetId, status: { in: ['ACTIVE', 'OVERDUE'] } },
        include: {
          asset: { select: { id: true, assetTag: true, name: true, status: true } },
          holderUser: { select: { id: true, name: true } },
          holderDepartment: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

  if (!allocation) throw new ApiError(404, 'Active allocation not found for this transfer');
  if (!['ACTIVE', 'OVERDUE'].includes(allocation.status)) {
    throw new ApiError(409, 'Can only transfer from an active allocation');
  }

  const [toUser, toDepartment] = await Promise.all([
    toHolderUserId ? prisma.user.findUnique({ where: { id: toHolderUserId } }) : null,
    toHolderDepartmentId ? prisma.department.findUnique({ where: { id: toHolderDepartmentId } }) : null,
  ]);
  if (toHolderUserId && !toUser) throw new ApiError(404, 'Target employee not found');
  if (toHolderDepartmentId && !toDepartment) throw new ApiError(404, 'Target department not found');

  const existing = await prisma.transferRequest.findFirst({
    where: { assetId: allocation.assetId, status: 'REQUESTED' },
  });
  if (existing) throw new ApiError(409, 'A pending transfer request already exists for this asset');

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId: allocation.assetId,
      fromHolderUserId: allocation.holderUserId,
      fromHolderDepartmentId: allocation.holderDepartmentId,
      toHolderUserId,
      toHolderDepartmentId,
      requestedById: req.user.userId,
      status: 'REQUESTED',
    },
    include: transferInclude,
  });

  const fromName = allocation.holderUser?.name ?? allocation.holderDepartment?.name ?? 'current holder';
  const toName = toUser?.name ?? toDepartment?.name ?? 'new holder';
  await notifyService.notifyManagers(
    'TRANSFER_REQUESTED',
    `Transfer request: ${allocation.asset.name} from ${fromName} to ${toName}`,
    { entityType: 'TransferRequest', entityId: transfer.id }
  );

  await activityLogService.log(req.user.userId, 'TRANSFER_REQUESTED', 'TransferRequest', transfer.id, {
    assetId: allocation.assetId,
    fromHolderUserId: allocation.holderUserId,
    fromHolderDepartmentId: allocation.holderDepartmentId,
    toHolderUserId,
    toHolderDepartmentId,
    reason: data.reason,
  });

  res.status(201).json({ success: true, data: transfer });
};

export const approveTransfer = async (req, res) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
    include: transferInclude,
  });

  if (!transfer) throw new ApiError(404, 'Transfer request not found');
  if (transfer.status !== 'REQUESTED') throw new ApiError(409, `Transfer is already ${transfer.status}`);

  const activeAllocation = await prisma.allocation.findFirst({
    where: { assetId: transfer.assetId, status: { in: ['ACTIVE', 'OVERDUE'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (!activeAllocation) throw new ApiError(409, 'No active allocation exists for this asset');

  await prisma.$transaction([
    prisma.transferRequest.update({
      where: { id: transfer.id },
      data: { status: 'REALLOCATED', approvedById: req.user.userId },
    }),
    prisma.allocation.update({
      where: { id: activeAllocation.id },
      data: {
        status: 'RETURNED',
        returnedDate: new Date(),
        conditionCheckinNotes: 'Transferred to another holder',
      },
    }),
    prisma.allocation.create({
      data: {
        assetId: transfer.assetId,
        holderUserId: transfer.toHolderUserId,
        holderDepartmentId: transfer.toHolderDepartmentId,
        allocatedDate: new Date(),
        status: 'ACTIVE',
      },
    }),
    prisma.asset.update({
      where: { id: transfer.assetId },
      data: {
        status: 'ALLOCATED',
        holderUserId: transfer.toHolderUserId,
        holderDepartmentId: transfer.toHolderDepartmentId,
      },
    }),
  ]);

  if (transfer.toHolderUserId) {
    await notifyService.trigger(
      'TRANSFER_APPROVED',
      `Transfer approved: ${transfer.asset.name} (${transfer.asset.assetTag}) is now assigned to you`,
      [transfer.toHolderUserId],
      { entityType: 'TransferRequest', entityId: transfer.id }
    );
  }
  if (transfer.fromHolderUserId) {
    await notifyService.trigger(
      'TRANSFER_APPROVED',
      `Your ${transfer.asset.name} has been transferred`,
      [transfer.fromHolderUserId],
      { entityType: 'TransferRequest', entityId: transfer.id }
    );
  }

  await activityLogService.log(req.user.userId, 'TRANSFER_APPROVED', 'TransferRequest', transfer.id, {
    assetId: transfer.assetId,
    fromHolderUserId: transfer.fromHolderUserId,
    toHolderUserId: transfer.toHolderUserId,
  });

  res.json({ success: true, message: 'Transfer approved and asset reallocated successfully' });
};

export const rejectTransfer = async (req, res) => {
  const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
    include: transferInclude,
  });

  if (!transfer) throw new ApiError(404, 'Transfer request not found');
  if (transfer.status !== 'REQUESTED') throw new ApiError(409, `Transfer is already ${transfer.status}`);

  await prisma.transferRequest.update({
    where: { id: transfer.id },
    data: { status: 'REJECTED', approvedById: req.user.userId },
  });

  await notifyService.trigger(
    'TRANSFER_REJECTED',
    `Transfer request for ${transfer.asset.name} was rejected`,
    [transfer.requestedById],
    { entityType: 'TransferRequest', entityId: transfer.id }
  );

  await activityLogService.log(req.user.userId, 'TRANSFER_REJECTED', 'TransferRequest', transfer.id, { reason });

  res.json({ success: true, message: 'Transfer request rejected' });
};

export const getTransferRequests = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;
  const status = query.status === 'PENDING' ? 'REQUESTED' : query.status;

  const where = {
    ...(status && { status }),
    ...(query.assetId && { assetId: query.assetId }),
    ...(req.user.role === 'EMPLOYEE' && {
      OR: [
        { fromHolderUserId: req.user.userId },
        { toHolderUserId: req.user.userId },
        { requestedById: req.user.userId },
      ],
    }),
  };

  const [transfers, total] = await Promise.all([
    prisma.transferRequest.findMany({
      where,
      include: transferInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.transferRequest.count({ where }),
  ]);

  res.json({
    success: true,
    data: transfers,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
};
