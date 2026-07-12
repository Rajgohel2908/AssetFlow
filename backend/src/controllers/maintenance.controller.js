import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { assertTransition } from '../utils/stateTransitions.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  assetId: z.string().cuid(),
  issue: z.string().min(5, 'Issue description must be at least 5 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  estimatedCost: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional(),
});

const querySchema = z.object({
  assetId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createMaintenanceRequest = async (req, res) => {
  const data = createSchema.parse(req.body);

  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new ApiError(404, 'Asset not found');
  if (asset.status === 'DISPOSED') throw new ApiError(409, 'Cannot raise maintenance for a disposed asset');
  if (asset.status === 'LOST') throw new ApiError(409, 'Cannot raise maintenance for a lost asset');

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: data.assetId,
      requestedById: req.user.userId,
      issue: data.issue,
      priority: data.priority,
      estimatedCost: data.estimatedCost ?? null,
      notes: data.notes ?? null,
      status: 'PENDING',
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      requestedBy: { select: { id: true, name: true } },
    },
  });

  // Notify asset managers
  await notifyService.notifyManagers(
    'MAINTENANCE_REQUESTED',
    `Maintenance requested for ${asset.name} (${asset.assetTag}): ${data.issue}`,
    { entityType: 'MaintenanceRequest', entityId: request.id }
  );

  await activityLogService.log(req.user.userId, 'MAINTENANCE_REQUESTED', 'MaintenanceRequest', request.id, {
    assetId: data.assetId, issue: data.issue, priority: data.priority,
  });

  res.status(201).json({ success: true, data: request });
};

/**
 * PATCH /maintenance-requests/:id/approve
 * BUSINESS RULE 6: Approval is required before status flips to UNDER_MAINTENANCE.
 * Transitions: PENDING → APPROVED + asset → UNDER_MAINTENANCE
 */
export const approveMaintenanceRequest = async (req, res) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: req.params.id },
    include: { asset: { select: { id: true, assetTag: true, name: true, status: true } } },
  });

  if (!request) throw new ApiError(404, 'Maintenance request not found');
  if (request.status !== 'PENDING') {
    throw new ApiError(409, `Cannot approve — request is already ${request.status}`);
  }

  // Validate asset transition AVAILABLE/ALLOCATED → UNDER_MAINTENANCE
  assertTransition(request.asset.status, 'UNDER_MAINTENANCE');

  // Atomic: approve request + flip asset status
  await prisma.$transaction([
    prisma.maintenanceRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', approvedById: req.user.userId },
    }),
    prisma.asset.update({
      where: { id: request.assetId },
      data: { status: 'UNDER_MAINTENANCE' },
    }),
  ]);

  await notifyService.trigger(
    'MAINTENANCE_APPROVED',
    `Maintenance request for ${request.asset.name} (${request.asset.assetTag}) has been approved`,
    [request.requestedById],
    { entityType: 'MaintenanceRequest', entityId: request.id }
  );

  await activityLogService.log(req.user.userId, 'MAINTENANCE_APPROVED', 'MaintenanceRequest', request.id, {
    assetId: request.assetId, previousAssetStatus: request.asset.status,
  });

  res.json({ success: true, message: 'Maintenance request approved. Asset is now Under Maintenance.' });
};

export const assignTechnician = async (req, res) => {
  const { technicianId } = z.object({ technicianId: z.string().cuid() }).parse(req.body);

  const request = await prisma.maintenanceRequest.findUnique({ where: { id: req.params.id } });
  if (!request) throw new ApiError(404, 'Maintenance request not found');
  if (!['APPROVED', 'IN_PROGRESS'].includes(request.status)) {
    throw new ApiError(409, 'Can only assign technician to approved or in-progress requests');
  }

  const technician = await prisma.user.findUnique({ where: { id: technicianId } });
  if (!technician) throw new ApiError(404, 'Technician not found');

  const updated = await prisma.maintenanceRequest.update({
    where: { id: request.id },
    data: { technicianId, status: 'IN_PROGRESS' },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      technician: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyService.trigger(
    'MAINTENANCE_ASSIGNED',
    `You have been assigned to maintain ${updated.asset.name} (${updated.asset.assetTag})`,
    [technicianId],
    { entityType: 'MaintenanceRequest', entityId: request.id }
  );

  await activityLogService.log(req.user.userId, 'MAINTENANCE_TECHNICIAN_ASSIGNED', 'MaintenanceRequest', request.id, { technicianId });

  res.json({ success: true, data: updated });
};

/**
 * PATCH /maintenance-requests/:id/resolve
 * Transitions: IN_PROGRESS/APPROVED → RESOLVED + asset → AVAILABLE
 */
export const resolveMaintenanceRequest = async (req, res) => {
  const { notes } = z.object({ notes: z.string().optional() }).parse(req.body);

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: req.params.id },
    include: { asset: { select: { id: true, assetTag: true, name: true, status: true } } },
  });

  if (!request) throw new ApiError(404, 'Maintenance request not found');
  if (!['APPROVED', 'IN_PROGRESS'].includes(request.status)) {
    throw new ApiError(409, `Cannot resolve — request is ${request.status}`);
  }

  // Validate asset transition: UNDER_MAINTENANCE → AVAILABLE
  assertTransition(request.asset.status, 'AVAILABLE');

  await prisma.$transaction([
    prisma.maintenanceRequest.update({
      where: { id: request.id },
      data: { status: 'RESOLVED', resolvedAt: new Date(), notes: notes ?? request.notes },
    }),
    prisma.asset.update({
      where: { id: request.assetId },
      data: { status: 'AVAILABLE' },
    }),
  ]);

  await notifyService.trigger(
    'MAINTENANCE_RESOLVED',
    `${request.asset.name} (${request.asset.assetTag}) maintenance is complete — asset is now available`,
    [request.requestedById],
    { entityType: 'MaintenanceRequest', entityId: request.id }
  );

  await activityLogService.log(req.user.userId, 'MAINTENANCE_RESOLVED', 'MaintenanceRequest', request.id, {
    assetId: request.assetId, notes,
  });

  res.json({ success: true, message: 'Maintenance resolved. Asset is now Available.' });
};

export const getMaintenanceRequests = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const where = {
    ...(query.assetId && { assetId: query.assetId }),
    ...(query.status && { status: query.status }),
    ...(query.priority && { priority: query.priority }),
    ...(req.user.role === 'EMPLOYEE' && { requestedById: req.user.userId }),
  };

  const [requests, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        requestedBy: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  res.json({
    success: true, data: requests,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
};

export const getMaintenanceRequest = async (req, res) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: req.params.id },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true, category: { select: { name: true } } } },
      requestedBy: { select: { id: true, name: true, email: true } },
      technician: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });
  if (!request) throw new ApiError(404, 'Maintenance request not found');
  res.json({ success: true, data: request });
};
