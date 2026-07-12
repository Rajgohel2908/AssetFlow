import { z } from 'zod';
import prisma from '../lib/prisma.js';

// ─── Activity Log Controller ──────────────────────────────────────────────────

const querySchema = z.object({
  actorId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

/**
 * GET /activity-logs?actorId=&entityType=&dateRange=
 */
export const getActivityLogs = async (req, res) => {
  const query = querySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const where = {
    ...(query.actorId && { actorId: query.actorId }),
    ...(query.entityType && { entityType: query.entityType }),
    ...(query.entityId && { entityId: query.entityId }),
    ...(query.action && { action: { contains: query.action, mode: 'insensitive' } }),
    ...(query.startDate || query.endDate
      ? {
          timestamp: {
            ...(query.startDate && { gte: new Date(query.startDate) }),
            ...(query.endDate && { lte: new Date(query.endDate) }),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: query.page, limit: query.limit, total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
};
