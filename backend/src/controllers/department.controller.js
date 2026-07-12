import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  parentDepartmentId: z.string().cuid().optional().nullable(),
});

const updateSchema = createSchema.partial();

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createDepartment = async (req, res) => {
  const data = createSchema.parse(req.body);

  // If parentDepartmentId provided, ensure it exists
  if (data.parentDepartmentId) {
    const parent = await prisma.department.findUnique({ where: { id: data.parentDepartmentId } });
    if (!parent) throw new ApiError(404, 'Parent department not found');
  }

  const dept = await prisma.department.create({
    data,
    include: {
      parentDepartment: { select: { id: true, name: true } },
      _count: { select: { users: true, assets: true } },
    },
  });

  await activityLogService.log(req.user.userId, 'DEPARTMENT_CREATED', 'Department', dept.id, { name: dept.name });

  res.status(201).json({ success: true, data: dept });
};

export const getDepartments = async (req, res) => {
  const departments = await prisma.department.findMany({
    include: {
      parentDepartment: { select: { id: true, name: true } },
      childDepartments: { select: { id: true, name: true } },
      _count: { select: { users: true, assets: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: departments });
};

export const getDepartment = async (req, res) => {
  const dept = await prisma.department.findUnique({
    where: { id: req.params.id },
    include: {
      parentDepartment: { select: { id: true, name: true } },
      childDepartments: { select: { id: true, name: true } },
      users: { select: { id: true, name: true, role: true, email: true } },
      _count: { select: { assets: true } },
    },
  });
  if (!dept) throw new ApiError(404, 'Department not found');
  res.json({ success: true, data: dept });
};

export const updateDepartment = async (req, res) => {
  const data = updateSchema.parse(req.body);

  const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Department not found');

  // Prevent circular parentage
  if (data.parentDepartmentId === req.params.id) {
    throw new ApiError(400, 'A department cannot be its own parent');
  }

  const dept = await prisma.department.update({
    where: { id: req.params.id },
    data,
    include: {
      parentDepartment: { select: { id: true, name: true } },
      _count: { select: { users: true, assets: true } },
    },
  });

  await activityLogService.log(req.user.userId, 'DEPARTMENT_UPDATED', 'Department', dept.id, {
    before: existing, after: data,
  });

  res.json({ success: true, data: dept });
};

export const deleteDepartment = async (req, res) => {
  const existing = await prisma.department.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { users: true, assets: true, childDepartments: true } } },
  });
  if (!existing) throw new ApiError(404, 'Department not found');

  if (existing._count.users > 0) {
    throw new ApiError(409, `Cannot delete department — ${existing._count.users} employee(s) still assigned`);
  }
  if (existing._count.assets > 0) {
    throw new ApiError(409, `Cannot delete department — ${existing._count.assets} asset(s) still assigned`);
  }
  if (existing._count.childDepartments > 0) {
    throw new ApiError(409, `Cannot delete department — it has ${existing._count.childDepartments} sub-department(s)`);
  }

  await prisma.department.delete({ where: { id: req.params.id } });
  await activityLogService.log(req.user.userId, 'DEPARTMENT_DELETED', 'Department', req.params.id, { name: existing.name });

  res.json({ success: true, message: 'Department deleted successfully' });
};
