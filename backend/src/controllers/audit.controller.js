import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(3).max(200),
  scope: z.object({
    departmentIds: z.array(z.string().cuid()).optional(),
    locationIds: z.array(z.string().cuid()).optional(),
    categoryIds: z.array(z.string().cuid()).optional(),
    allAssets: z.boolean().optional(),
  }).default({}),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  auditorIds: z.array(z.string().cuid()).min(1, 'At least one auditor required'),
});

const updateItemSchema = z.object({
  status: z.enum(['VERIFIED', 'MISSING', 'DAMAGED']),
  notes: z.string().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createAuditCycle = async (req, res) => {
  const data = createSchema.parse(req.body);

  // Build asset query based on scope
  const assetWhere = {};
  if (!data.scope.allAssets) {
    if (data.scope.departmentIds?.length) assetWhere.departmentId = { in: data.scope.departmentIds };
    if (data.scope.locationIds?.length) assetWhere.locationId = { in: data.scope.locationIds };
    if (data.scope.categoryIds?.length) assetWhere.categoryId = { in: data.scope.categoryIds };
  }

  const assets = await prisma.asset.findMany({
    where: {
      ...assetWhere,
      status: { notIn: ['DISPOSED'] }, // Don't audit disposed assets
    },
    select: { id: true },
  });

  if (assets.length === 0) {
    throw new ApiError(400, 'No assets found matching the audit scope');
  }

  // Verify auditors exist
  const auditors = await prisma.user.findMany({
    where: { id: { in: data.auditorIds }, isActive: true },
    select: { id: true },
  });
  if (auditors.length !== data.auditorIds.length) {
    throw new ApiError(400, 'One or more auditor IDs are invalid');
  }

  const auditCycle = await prisma.auditCycle.create({
    data: {
      name: data.name,
      scope: data.scope,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdById: req.user.userId,
      status: 'OPEN',
      auditors: {
        create: data.auditorIds.map((userId) => ({ userId })),
      },
      items: {
        create: assets.map((asset) => ({ assetId: asset.id, status: 'PENDING' })),
      },
    },
    include: {
      creator: { select: { id: true, name: true } },
      auditors: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { items: true } },
    },
  });

  // Notify auditors
  await notifyService.trigger(
    'AUDIT_CYCLE_CREATED',
    `You have been assigned as an auditor for "${auditCycle.name}"`,
    data.auditorIds,
    { entityType: 'AuditCycle', entityId: auditCycle.id }
  );

  await activityLogService.log(req.user.userId, 'AUDIT_CYCLE_CREATED', 'AuditCycle', auditCycle.id, {
    name: auditCycle.name, assetCount: assets.length,
  });

  res.status(201).json({ success: true, data: auditCycle });
};

export const getAuditCycles = async (req, res) => {
  const { status } = req.query;
  const cycles = await prisma.auditCycle.findMany({
    where: { ...(status && { status }) },
    include: {
      creator: { select: { id: true, name: true } },
      auditors: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: cycles });
};

export const getAuditCycle = async (req, res) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: req.params.id },
    include: {
      creator: { select: { id: true, name: true } },
      auditors: { include: { user: { select: { id: true, name: true } } } },
      items: {
        include: {
          asset: { select: { id: true, assetTag: true, name: true, status: true, category: { select: { name: true } }, department: { select: { name: true } } } },
          updatedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!cycle) throw new ApiError(404, 'Audit cycle not found');
  res.json({ success: true, data: cycle });
};

/**
 * PATCH /audit-cycles/:id/items/:assetId
 * Mark an asset as VERIFIED, MISSING, or DAMAGED.
 */
export const updateAuditItem = async (req, res) => {
  const data = updateItemSchema.parse(req.body);

  const cycle = await prisma.auditCycle.findUnique({ where: { id: req.params.id } });
  if (!cycle) throw new ApiError(404, 'Audit cycle not found');
  if (cycle.status === 'CLOSED') throw new ApiError(409, 'Cannot update items in a closed audit cycle');

  const item = await prisma.auditItem.findUnique({
    where: { auditCycleId_assetId: { auditCycleId: req.params.id, assetId: req.params.assetId } },
  });
  if (!item) throw new ApiError(404, 'Asset not found in this audit cycle');

  const updated = await prisma.auditItem.update({
    where: { id: item.id },
    data: { status: data.status, notes: data.notes ?? null, updatedById: req.user.userId },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
    },
  });

  await activityLogService.log(req.user.userId, 'AUDIT_ITEM_UPDATED', 'AuditItem', item.id, {
    auditCycleId: req.params.id, assetId: req.params.assetId, status: data.status,
  });

  res.json({ success: true, data: updated });
};

/**
 * POST /audit-cycles/:id/close
 * BUSINESS RULE 7: Closing is IRREVERSIBLE — locks cycle + cascades status to assets.
 * Missing assets → LOST. Generates discrepancy report.
 */
export const closeAuditCycle = async (req, res) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          asset: { select: { id: true, assetTag: true, name: true, status: true } },
        },
      },
    },
  });

  if (!cycle) throw new ApiError(404, 'Audit cycle not found');
  // BUSINESS RULE 7: Irreversible — return 409 if already closed
  if (cycle.status === 'CLOSED') {
    throw new ApiError(409, 'Audit cycle is already closed. Closing is irreversible.');
  }

  const missingItems = cycle.items.filter((i) => i.status === 'MISSING');
  const damagedItems = cycle.items.filter((i) => i.status === 'DAMAGED');
  const verifiedItems = cycle.items.filter((i) => i.status === 'VERIFIED');
  const pendingItems = cycle.items.filter((i) => i.status === 'PENDING');

  // Generate discrepancy report
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
    missingAssets: missingItems.map((i) => ({
      assetId: i.assetId, assetTag: i.asset.assetTag, name: i.asset.name, notes: i.notes,
    })),
    damagedAssets: damagedItems.map((i) => ({
      assetId: i.assetId, assetTag: i.asset.assetTag, name: i.asset.name, notes: i.notes,
    })),
  };

  // Execute everything in a transaction
  await prisma.$transaction([
    // Lock the cycle
    prisma.auditCycle.update({
      where: { id: cycle.id },
      data: { status: 'CLOSED', closedAt: new Date(), discrepancyReport },
    }),
    // Set all confirmed-missing assets to LOST
    ...missingItems
      .filter((i) => i.asset.status !== 'LOST')
      .map((i) =>
        prisma.asset.update({ where: { id: i.assetId }, data: { status: 'LOST' } })
      ),
  ]);

  // Notify managers of closure
  await notifyService.notifyManagers(
    'AUDIT_CYCLE_CLOSED',
    `Audit cycle "${cycle.name}" closed — ${missingItems.length} missing asset(s), ${damagedItems.length} damaged asset(s)`,
    { entityType: 'AuditCycle', entityId: cycle.id }
  );

  await activityLogService.log(req.user.userId, 'AUDIT_CYCLE_CLOSED', 'AuditCycle', cycle.id, {
    summary: discrepancyReport.summary,
    assetsMarkedLost: missingItems.map((i) => i.assetId),
  });

  res.json({ success: true, data: discrepancyReport });
};
