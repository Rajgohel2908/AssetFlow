import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

const createSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  scope: z.object({
    departmentIds: z.array(z.string().cuid()).optional(),
    locations: z.array(z.string()).optional(),
    locationIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string().cuid()).optional(),
    allAssets: z.boolean().optional(),
  }).default({}),
  departmentId: z.string().cuid().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  auditorIds: z.array(z.string().cuid()).min(1, 'At least one auditor required'),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

const updateItemSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'MISSING', 'DAMAGED']).optional(),
  result: z.enum(['PENDING', 'VERIFIED', 'MISSING', 'DAMAGED']).optional(),
  notes: z.string().optional(),
}).refine((data) => data.status || data.result, {
  message: 'Audit item status is required',
});

const cycleInclude = {
  department: { select: { id: true, name: true } },
  auditors: { include: { user: { select: { id: true, name: true, email: true } } } },
  _count: { select: { items: true } },
};

export const createAuditCycle = async (req, res) => {
  const data = createSchema.parse(req.body);

  const departmentIds = data.scope.departmentIds ?? (data.departmentId ? [data.departmentId] : []);
  const locations = data.scope.locations ?? data.scope.locationIds ?? (data.location ? [data.location] : []);

  const assetWhere = {};
  if (!data.scope.allAssets) {
    if (departmentIds.length) assetWhere.holderDepartmentId = { in: departmentIds };
    if (locations.length) assetWhere.location = { in: locations };
    if (data.scope.categoryIds?.length) assetWhere.categoryId = { in: data.scope.categoryIds };
  }

  const assets = await prisma.asset.findMany({
    where: { ...assetWhere, status: { not: 'DISPOSED' } },
    select: { id: true },
  });
  if (assets.length === 0) throw new ApiError(400, 'No assets found matching the audit scope');

  const auditors = await prisma.user.findMany({
    where: { id: { in: data.auditorIds }, status: 'ACTIVE' },
    select: { id: true },
  });
  if (auditors.length !== data.auditorIds.length) throw new ApiError(400, 'One or more auditor IDs are invalid');

  const auditCycle = await prisma.auditCycle.create({
    data: {
      departmentId: departmentIds[0] ?? null,
      location: locations[0] ?? null,
      dateRangeStart: new Date(data.startDate),
      dateRangeEnd: new Date(data.endDate),
      status: 'OPEN',
      auditors: { create: data.auditorIds.map((userId) => ({ userId })) },
      items: { create: assets.map((asset) => ({ assetId: asset.id, result: 'PENDING' })) },
    },
    include: cycleInclude,
  });

  await notifyService.trigger(
    'AUDIT_CYCLE_CREATED',
    `You have been assigned as an auditor for "${auditCycle.name}"`,
    data.auditorIds,
    { entityType: 'AuditCycle', entityId: auditCycle.id }
  );

  await activityLogService.log(req.user.userId, 'AUDIT_CYCLE_CREATED', 'AuditCycle', auditCycle.id, {
    name: auditCycle.name,
    assetCount: assets.length,
  });

  res.status(201).json({ success: true, data: auditCycle });
};

export const getAuditCycles = async (req, res) => {
  const { status } = req.query;
  const cycles = await prisma.auditCycle.findMany({
    where: { ...(status && { status: String(status).toUpperCase() }) },
    include: cycleInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: cycles });
};

export const getAuditCycle = async (req, res) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: req.params.id },
    include: {
      department: { select: { id: true, name: true } },
      auditors: { include: { user: { select: { id: true, name: true, email: true } } } },
      items: {
        include: {
          asset: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              status: true,
              location: true,
              category: { select: { name: true } },
              holderDepartment: { select: { name: true } },
              holderUser: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!cycle) throw new ApiError(404, 'Audit cycle not found');
  res.json({ success: true, data: cycle });
};

export const updateAuditItem = async (req, res) => {
  const data = updateItemSchema.parse(req.body);
  const result = data.result ?? data.status;

  const cycle = await prisma.auditCycle.findUnique({ where: { id: req.params.id } });
  if (!cycle) throw new ApiError(404, 'Audit cycle not found');
  if (cycle.status === 'CLOSED') throw new ApiError(409, 'Cannot update items in a closed audit cycle');

  const item = await prisma.auditItem.findUnique({
    where: { auditCycleId_assetId: { auditCycleId: req.params.id, assetId: req.params.assetId } },
  });
  if (!item) throw new ApiError(404, 'Asset not found in this audit cycle');

  const updated = await prisma.auditItem.update({
    where: { id: item.id },
    data: { result, notes: data.notes ?? null },
    include: { asset: { select: { id: true, assetTag: true, name: true } } },
  });

  await activityLogService.log(req.user.userId, 'AUDIT_ITEM_UPDATED', 'AuditItem', item.id, {
    auditCycleId: req.params.id,
    assetId: req.params.assetId,
    result,
  });

  res.json({ success: true, data: updated });
};

export const closeAuditCycle = async (req, res) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: { asset: { select: { id: true, assetTag: true, name: true, status: true } } },
      },
    },
  });

  if (!cycle) throw new ApiError(404, 'Audit cycle not found');
  if (cycle.status === 'CLOSED') throw new ApiError(409, 'Audit cycle is already closed. Closing is irreversible.');

  const missingItems = cycle.items.filter((item) => item.result === 'MISSING');
  const damagedItems = cycle.items.filter((item) => item.result === 'DAMAGED');
  const verifiedItems = cycle.items.filter((item) => item.result === 'VERIFIED');
  const pendingItems = cycle.items.filter((item) => item.result === 'PENDING');

  const discrepancyReport = {
    closedAt: new Date().toISOString(),
    closedBy: req.user.userId,
    summary: {
      total: cycle.items.length,
      verified: verifiedItems.length,
      missing: missingItems.length,
      damaged: damagedItems.length,
      pending: pendingItems.length,
    },
    missingAssets: missingItems.map((item) => ({
      assetId: item.assetId,
      assetTag: item.asset.assetTag,
      name: item.asset.name,
      notes: item.notes,
    })),
    damagedAssets: damagedItems.map((item) => ({
      assetId: item.assetId,
      assetTag: item.asset.assetTag,
      name: item.asset.name,
      notes: item.notes,
    })),
  };

  await prisma.$transaction([
    prisma.auditCycle.update({
      where: { id: cycle.id },
      data: { status: 'CLOSED', closedAt: new Date(), discrepancyReport },
    }),
    ...missingItems
      .filter((item) => item.asset.status !== 'LOST')
      .map((item) => prisma.asset.update({ where: { id: item.assetId }, data: { status: 'LOST' } })),
  ]);

  await notifyService.notifyManagers(
    'AUDIT_CYCLE_CLOSED',
    `Audit cycle "${cycle.name}" closed: ${missingItems.length} missing, ${damagedItems.length} damaged`,
    { entityType: 'AuditCycle', entityId: cycle.id }
  );

  await activityLogService.log(req.user.userId, 'AUDIT_CYCLE_CLOSED', 'AuditCycle', cycle.id, {
    summary: discrepancyReport.summary,
    assetsMarkedLost: missingItems.map((item) => item.assetId),
  });

  res.json({ success: true, data: discrepancyReport });
};
