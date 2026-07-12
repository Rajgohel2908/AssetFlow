import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const customFieldSchema = z.array(
  z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
    options: z.array(z.string()).optional(), // for select type
    required: z.boolean().default(false),
  })
);

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  customFieldSchema: customFieldSchema.default([]),
});

const updateSchema = createSchema.partial();

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createCategory = async (req, res) => {
  const data = createSchema.parse(req.body);

  const category = await prisma.assetCategory.create({
    data,
    include: { _count: { select: { assets: true } } },
  });

  await activityLogService.log(req.user.userId, 'CATEGORY_CREATED', 'AssetCategory', category.id, { name: category.name });

  res.status(201).json({ success: true, data: category });
};

export const getCategories = async (req, res) => {
  const categories = await prisma.assetCategory.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: categories });
};

export const getCategory = async (req, res) => {
  const category = await prisma.assetCategory.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { assets: true } },
      assets: {
        select: { id: true, assetTag: true, name: true, status: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!category) throw new ApiError(404, 'Asset category not found');
  res.json({ success: true, data: category });
};

export const updateCategory = async (req, res) => {
  const data = updateSchema.parse(req.body);

  const existing = await prisma.assetCategory.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Asset category not found');

  const category = await prisma.assetCategory.update({
    where: { id: req.params.id },
    data,
    include: { _count: { select: { assets: true } } },
  });

  await activityLogService.log(req.user.userId, 'CATEGORY_UPDATED', 'AssetCategory', category.id, {
    before: existing, after: data,
  });

  res.json({ success: true, data: category });
};

export const deleteCategory = async (req, res) => {
  const existing = await prisma.assetCategory.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { assets: true } } },
  });
  if (!existing) throw new ApiError(404, 'Asset category not found');

  if (existing._count.assets > 0) {
    throw new ApiError(409, `Cannot delete category — ${existing._count.assets} asset(s) use this category`);
  }

  await prisma.assetCategory.delete({ where: { id: req.params.id } });
  await activityLogService.log(req.user.userId, 'CATEGORY_DELETED', 'AssetCategory', req.params.id, { name: existing.name });

  res.json({ success: true, message: 'Category deleted successfully' });
};
