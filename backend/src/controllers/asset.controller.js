import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { generateAssetTag } from '../utils/assetTagGenerator.js';
import { assertTransition } from '../utils/stateTransitions.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2).max(200),
  categoryId: z.string().cuid(),
  holderDepartmentId: z.string().cuid().optional().nullable(),
  location: z.string().optional().nullable(),
  acquisitionDate: z.string().datetime().optional().nullable(),
  acquisitionCost: z.coerce.number().nonnegative().optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  condition: z.string().optional().nullable(),
  isBookable: z.boolean().optional(),
  customFieldValues: z.record(z.any()).default({}),
});

const updateSchema = createSchema.omit({ categoryId: true }).partial().extend({
  categoryId: z.string().cuid().optional(),
});

const statusSchema = z.object({
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']),
  reason: z.string().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
  holderDepartmentId: z.string().optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Shared select ────────────────────────────────────────────────────────────

const assetSelect = {
  id: true, assetTag: true, name: true, status: true,
  acquisitionDate: true, acquisitionCost: true, serialNumber: true,
  location: true, condition: true, isBookable: true,
  createdAt: true, updatedAt: true,
  category: { select: { id: true, name: true } },
  holderDepartment: { select: { id: true, name: true } },
  holderUser: { select: { id: true, name: true, email: true } },
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /assets
 * Auto-generates Asset Tag using Postgres SEQUENCE (never regex-parses last tag).
 */
export const createAsset = async (req, res) => {
  const data = createSchema.parse(req.body);

  // Verify category exists
  const category = await prisma.assetCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new ApiError(404, 'Asset category not found');

  const assetTag = await generateAssetTag();

  const asset = await prisma.asset.create({
    data: {
      assetTag,
      name: data.name,
      categoryId: data.categoryId,
      holderDepartmentId: data.holderDepartmentId ?? null,
      location: data.location ?? null,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
      acquisitionCost: data.acquisitionCost ?? null,
      serialNumber: data.serialNumber ?? null,
      condition: data.condition ?? null,
      isBookable: data.isBookable ?? false,
      status: 'AVAILABLE',
    },
    select: assetSelect,
  });

  await activityLogService.log(req.user.userId, 'ASSET_CREATED', 'Asset', asset.id, {
    assetTag: asset.assetTag, name: asset.name,
  });

  res.status(201).json({ success: true, data: asset });
};

/**
 * GET /assets?search=&categoryId=&status=&departmentId=&locationId=
 */
export const getAssets = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const where = {
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { assetTag: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
    ...(query.categoryId && { categoryId: query.categoryId }),
    ...(query.status && { status: query.status }),
    ...(query.holderDepartmentId && { holderDepartmentId: query.holderDepartmentId }),
    ...(query.location && { location: query.location }),
  };

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      select: assetSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.asset.count({ where }),
  ]);

  res.json({
    success: true,
    data: assets,
    pagination: {
      page: query.page, limit: query.limit, total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
};

/**
 * GET /assets/:id
 */
export const getAsset = async (req, res) => {
  const asset = await prisma.asset.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      department: true,
      location: true,
      allocations: {
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
        include: { user: { select: { id: true, name: true, email: true } } },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!asset) throw new ApiError(404, 'Asset not found');
  res.json({ success: true, data: asset });
};

/**
 * GET /assets/:id/history
 * Returns combined allocation + maintenance history, sorted by date desc.
 */
export const getAssetHistory = async (req, res) => {
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!asset) throw new ApiError(404, 'Asset not found');

  const [allocations, maintenance] = await Promise.all([
    prisma.allocation.findMany({
      where: { assetId: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        allocatedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.maintenanceRequest.findMany({
      where: { assetId: req.params.id },
      include: {
        requestedBy: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Combine and tag each entry with its type
  const history = [
    ...allocations.map((a) => ({ type: 'allocation', date: a.createdAt, data: a })),
    ...maintenance.map((m) => ({ type: 'maintenance', date: m.createdAt, data: m })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ success: true, data: history });
};

/**
 * PATCH /assets/:id/status
 * BUSINESS RULE 3: Must go through canTransition() check before saving.
 */
export const updateAssetStatus = async (req, res) => {
  const { status: newStatus, reason } = statusSchema.parse(req.body);

  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!asset) throw new ApiError(404, 'Asset not found');

  // This throws a 422 if transition is invalid
  assertTransition(asset.status, newStatus);

  const updated = await prisma.asset.update({
    where: { id: req.params.id },
    data: { status: newStatus },
    select: assetSelect,
  });

  await activityLogService.log(req.user.userId, 'ASSET_STATUS_CHANGED', 'Asset', asset.id, {
    before: { status: asset.status }, after: { status: newStatus }, reason,
  });

  // Notify asset managers of significant status changes
  if (['LOST', 'DISPOSED'].includes(newStatus)) {
    await notifyService.notifyManagers(
      'ASSET_STATUS_CHANGED',
      `Asset ${asset.assetTag} — ${asset.name} has been marked as ${newStatus}`,
      { entityType: 'Asset', entityId: asset.id }
    );
  }

  res.json({ success: true, data: updated });
};

/**
 * PUT /assets/:id
 */
export const updateAsset = async (req, res) => {
  const data = updateSchema.parse(req.body);

  const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Asset not found');

  const updated = await prisma.asset.update({
    where: { id: req.params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.holderDepartmentId !== undefined && { holderDepartmentId: data.holderDepartmentId }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.acquisitionDate !== undefined && { acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null }),
      ...(data.acquisitionCost !== undefined && { acquisitionCost: data.acquisitionCost }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.isBookable !== undefined && { isBookable: data.isBookable }),
    },
    select: assetSelect,
  });

  await activityLogService.log(req.user.userId, 'ASSET_UPDATED', 'Asset', existing.id, {
    before: existing, after: data,
  });

  res.json({ success: true, data: updated });
};

/**
 * DELETE /assets/:id — only if AVAILABLE and no active relations
 */
export const deleteAsset = async (req, res) => {
  const asset = await prisma.asset.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          allocations: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } },
          maintenanceRequests: { where: { status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] } } },
        },
      },
    },
  });
  if (!asset) throw new ApiError(404, 'Asset not found');

  if (asset._count.allocations > 0) {
    throw new ApiError(409, 'Cannot delete asset — it has active allocations');
  }
  if (asset._count.maintenanceRequests > 0) {
    throw new ApiError(409, 'Cannot delete asset — it has open maintenance requests');
  }

  await prisma.asset.delete({ where: { id: req.params.id } });
  await activityLogService.log(req.user.userId, 'ASSET_DELETED', 'Asset', req.params.id, {
    assetTag: asset.assetTag, name: asset.name,
  });

  res.json({ success: true, message: 'Asset deleted successfully' });
};
