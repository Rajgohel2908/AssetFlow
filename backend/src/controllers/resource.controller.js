import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { generateAssetTag } from '../utils/assetTagGenerator.js';
import { activityLogService } from '../services/activityLog.service.js';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.string().min(2).max(50).default('Shared Resource'),
  categoryId: z.string().cuid().optional(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const resourceSelect = {
  id: true,
  assetTag: true,
  name: true,
  location: true,
  status: true,
  isBookable: true,
  category: { select: { id: true, name: true } },
  _count: { select: { bookings: { where: { status: { in: ['UPCOMING', 'ONGOING'] } } } } },
};

const toResourceDto = (asset) => ({
  ...asset,
  type: asset.category?.name ?? 'Shared Resource',
  capacity: null,
  isActive: ['AVAILABLE', 'RESERVED'].includes(asset.status),
});

const getOrCreateResourceCategory = async (type, categoryId) => {
  if (categoryId) {
    const category = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new ApiError(404, 'Asset category not found');
    return category.id;
  }

  const category = await prisma.assetCategory.upsert({
    where: { name: type },
    update: {},
    create: { name: type },
  });
  return category.id;
};

export const createResource = async (req, res) => {
  const data = createSchema.parse(req.body);
  const categoryId = await getOrCreateResourceCategory(data.type, data.categoryId);
  const assetTag = await generateAssetTag();

  const resource = await prisma.asset.create({
    data: {
      assetTag,
      name: data.name,
      categoryId,
      location: data.location ?? null,
      isBookable: true,
      status: 'AVAILABLE',
    },
    select: resourceSelect,
  });

  await activityLogService.log(req.user.userId, 'RESOURCE_CREATED', 'Asset', resource.id, { name: resource.name });
  res.status(201).json({ success: true, data: toResourceDto(resource) });
};

export const getResources = async (req, res) => {
  const { type, isActive } = req.query;
  const resources = await prisma.asset.findMany({
    where: {
      isBookable: true,
      ...(type && { category: { name: { contains: type, mode: 'insensitive' } } }),
      ...(isActive !== undefined && {
        status: isActive === 'true' ? { in: ['AVAILABLE', 'RESERVED'] } : { notIn: ['AVAILABLE', 'RESERVED'] },
      }),
    },
    select: resourceSelect,
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: resources.map(toResourceDto) });
};

export const getResource = async (req, res) => {
  const resource = await prisma.asset.findFirst({
    where: { id: req.params.id, isBookable: true },
    select: {
      ...resourceSelect,
      bookings: {
        where: { status: { in: ['UPCOMING', 'ONGOING'] }, endTime: { gte: new Date() } },
        include: { bookedBy: { select: { id: true, name: true } } },
        orderBy: { startTime: 'asc' },
        take: 20,
      },
    },
  });
  if (!resource) throw new ApiError(404, 'Resource not found');
  res.json({ success: true, data: toResourceDto(resource) });
};

export const updateResource = async (req, res) => {
  const data = updateSchema.parse(req.body);
  const existing = await prisma.asset.findFirst({ where: { id: req.params.id, isBookable: true } });
  if (!existing) throw new ApiError(404, 'Resource not found');

  const categoryId = data.categoryId || data.type
    ? await getOrCreateResourceCategory(data.type ?? 'Shared Resource', data.categoryId)
    : undefined;

  const resource = await prisma.asset.update({
    where: { id: req.params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(categoryId && { categoryId }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.isActive !== undefined && { status: data.isActive ? 'AVAILABLE' : 'RETIRED' }),
      isBookable: true,
    },
    select: resourceSelect,
  });

  await activityLogService.log(req.user.userId, 'RESOURCE_UPDATED', 'Asset', resource.id, { before: existing, after: data });
  res.json({ success: true, data: toResourceDto(resource) });
};

export const deleteResource = async (req, res) => {
  const existing = await prisma.asset.findFirst({
    where: { id: req.params.id, isBookable: true },
    include: { _count: { select: { bookings: { where: { status: { in: ['UPCOMING', 'ONGOING'] }, endTime: { gte: new Date() } } } } } },
  });
  if (!existing) throw new ApiError(404, 'Resource not found');
  if (existing._count.bookings > 0) {
    throw new ApiError(409, 'Cannot delete resource because it has upcoming bookings');
  }

  await prisma.asset.delete({ where: { id: req.params.id } });
  await activityLogService.log(req.user.userId, 'RESOURCE_DELETED', 'Asset', req.params.id, { name: existing.name });
  res.json({ success: true, message: 'Resource deleted successfully' });
};
