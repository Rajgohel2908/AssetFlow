import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';
import { notifyService } from '../services/notification.service.js';

const roleSchema = z.object({
  role: z.enum(['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be one of: EMPLOYEE, DEPARTMENT_HEAD, ASSET_MANAGER, ADMIN' }),
  }),
});

const querySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN']).optional(),
  departmentId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const getEmployees = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const where = {
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
    ...(query.role && { role: query.role }),
    ...(query.departmentId && { departmentId: query.departmentId }),
    ...(query.isActive !== undefined && { status: query.isActive === 'true' ? 'ACTIVE' : 'INACTIVE' }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
        _count: { select: { allocationsAsHolder: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { name: 'asc' },
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users.map((user) => ({ ...user, isActive: user.status === 'ACTIVE' })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
};

export const getEmployee = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      department: { select: { id: true, name: true } },
      allocationsAsHolder: {
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
        include: { asset: { select: { id: true, assetTag: true, name: true, status: true } } },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) throw new ApiError(404, 'Employee not found');
  res.json({ success: true, data: { ...user, isActive: user.status === 'ACTIVE' } });
};

export const updateRole = async (req, res) => {
  const { role } = roleSchema.parse(req.body);
  const targetId = req.params.id;

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new ApiError(404, 'Employee not found');

  if (targetId === req.user.userId && role !== 'ADMIN') {
    throw new ApiError(400, 'Admins cannot change their own role to a lower role');
  }

  const oldRole = target.role;
  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, departmentId: true },
  });

  await notifyService.trigger(
    'ROLE_CHANGED',
    `Your role has been updated from ${oldRole} to ${role}`,
    [targetId],
    { entityType: 'User', entityId: targetId }
  );

  await activityLogService.log(req.user.userId, 'ROLE_CHANGED', 'User', targetId, {
    before: { role: oldRole },
    after: { role },
  });

  res.json({ success: true, data: updated });
};

export const updateStatus = async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new ApiError(404, 'Employee not found');

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: isActive ? 'ACTIVE' : 'INACTIVE' },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  await activityLogService.log(req.user.userId, isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'User', req.params.id, null);

  res.json({ success: true, data: { ...updated, isActive: updated.status === 'ACTIVE' } });
};
