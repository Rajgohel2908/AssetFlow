import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  allocationId: z.string().cuid(),
  toUserId: z.string().cuid(),
  reason: z.string().optional(),
});

const querySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  assetId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createTransferRequest = async (req, res) => {
  const data = createSchema.parse(req.body);

  const allocation = await prisma.allocation.findUnique({
    where: { id: data.allocationId },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  });

  if (!allocation) throw new ApiError(404, 'Allocation not found');
  if (allocation.status !== 'ACTIVE' && allocation.status !== 'OVERDUE') {
    throw new ApiError(409, 'Can only transfer from an active allocation');
  }

  const toUser = await prisma.user.findUnique({ where: { id: data.toUserId } });
  if (!toUser) throw new ApiError(404, 'Target employee not found');

  // Ensure no pending transfer already exists for this allocation
  const existing = await prisma.transferRequest.findFirst({
    where: { allocationId: data.allocationId, status: 'PENDING' },
  });
  if (existing) throw new ApiError(409, 'A pending transfer request already exists for this allocation');

  const transfer = await prisma.transferRequest.create({
    data: {
      allocationId: data.allocationId,
      assetId: allocation.assetId,
      fromUserId: allocation.userId,
      toUserId: data.toUserId,
      requestedById: req.user.userId,
      reason: data.reason ?? null,
      status: 'PENDING',
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true, email: true } },
      requestedBy: { select: { id: true, name: true } },
    },
  });

  // Notify Asset Managers of pending transfer
  await notifyService.notifyManagers(
    'TRANSFER_REQUESTED',
    `Transfer request: ${allocation.asset.name} from ${allocation.user.name} to ${toUser.name}`,
    { entityType: 'TransferRequest', entityId: transfer.id }
  );

  await activityLogService.log(req.user.userId, 'TRANSFER_REQUESTED', 'TransferRequest', transfer.id, {
    assetId: allocation.assetId, fromUserId: allocation.userId, toUserId: data.toUserId,
  });

  res.status(201).json({ success: true, data: transfer });
};

export const approveTransfer = async (req, res) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
    include: {
      allocation: true,
      asset: { select: { id: true, assetTag: true, name: true } },
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!transfer) throw new ApiError(404, 'Transfer request not found');
  if (transfer.status !== 'PENDING') throw new ApiError(409, `Transfer is already ${transfer.status}`);

  // Execute transfer in a transaction
  await prisma.$transaction([
    // Update transfer request status
    prisma.transferRequest.update({
      where: { id: transfer.id },
      data: { status: 'APPROVED', approvedById: req.user.userId },
    }),
    // Close old allocation
    prisma.allocation.update({
      where: { id: transfer.allocationId },
      data: { status: 'RETURNED', returnedAt: new Date(), conditionNotes: 'Transferred to another employee' },
    }),
    // Create new allocation for the recipient
    prisma.allocation.create({
      data: {
        assetId: transfer.assetId,
        userId: transfer.toUserId,
        allocatedById: req.user.userId,
        status: 'ACTIVE',
      },
    }),
  ]);

  // Notify both parties
  await notifyService.trigger(
    'TRANSFER_APPROVED',
    `Transfer approved: ${transfer.asset.name} (${transfer.asset.assetTag}) is now assigned to you`,
    [transfer.toUserId],
    { entityType: 'TransferRequest', entityId: transfer.id }
  );
  await notifyService.trigger(
    'TRANSFER_APPROVED',
    `Your ${transfer.asset.name} has been transferred to ${transfer.toUser.name}`,
    [transfer.fromUserId],
    { entityType: 'TransferRequest', entityId: transfer.id }
  );

  await activityLogService.log(req.user.userId, 'TRANSFER_APPROVED', 'TransferRequest', transfer.id, {
    assetId: transfer.assetId, fromUserId: transfer.fromUserId, toUserId: transfer.toUserId,
  });

  res.json({ success: true, message: 'Transfer approved successfully' });
};

export const rejectTransfer = async (req, res) => {
  const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: req.params.id },
    include: {
      fromUser: { select: { id: true, name: true } },
      asset: { select: { id: true, assetTag: true, name: true } },
    },
  });

  if (!transfer) throw new ApiError(404, 'Transfer request not found');
  if (transfer.status !== 'PENDING') throw new ApiError(409, `Transfer is already ${transfer.status}`);

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

  const where = {
    ...(query.status && { status: query.status }),
    ...(query.assetId && { assetId: query.assetId }),
    // Employees only see their own
    ...(req.user.role === 'EMPLOYEE' && {
      OR: [{ fromUserId: req.user.userId }, { toUserId: req.user.userId }, { requestedById: req.user.userId }],
    }),
  };

  const [transfers, total] = await Promise.all([
    prisma.transferRequest.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.transferRequest.count({ where }),
  ]);

  res.json({
    success: true, data: transfers,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
};
