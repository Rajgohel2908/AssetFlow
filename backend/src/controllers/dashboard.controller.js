import prisma from '../lib/prisma.js';

// ─── Dashboard Controller ─────────────────────────────────────────────────────

/**
 * GET /dashboard/kpis
 * Aggregation pipeline returning all 6 KPI cards + overdue returns list.
 */
export const getKPIs = async (req, res) => {
  const now = new Date();

  const [
    totalAssets,
    statusCounts,
    overdueAllocations,
    totalValue,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.allocation.findMany({
      where: {
        status: { in: ['ACTIVE', 'OVERDUE'] },
        dueDate: { lt: now, not: null },
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, department: { select: { name: true } } } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }),
    prisma.asset.aggregate({ _sum: { purchasePrice: true } }),
  ]);

  // Build status map
  const statusMap = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {});

  const kpis = {
    totalAssets,
    allocated: statusMap.ALLOCATED ?? 0,
    available: statusMap.AVAILABLE ?? 0,
    underMaintenance: statusMap.UNDER_MAINTENANCE ?? 0,
    lost: statusMap.LOST ?? 0,
    retired: statusMap.RETIRED ?? 0,
    disposed: statusMap.DISPOSED ?? 0,
    overdueReturns: overdueAllocations.length,
    totalValue: totalValue._sum.purchasePrice ?? 0,
  };

  const overdueList = overdueAllocations.map((a) => ({
    allocationId: a.id,
    assetId: a.assetId,
    assetTag: a.asset.assetTag,
    assetName: a.asset.name,
    employeeName: a.user.name,
    employeeId: a.userId,
    department: a.user.department?.name ?? 'N/A',
    dueDate: a.dueDate,
    daysOverdue: Math.floor((now - new Date(a.dueDate)) / (1000 * 60 * 60 * 24)),
  }));

  res.json({ success: true, data: { kpis, overdueList } });
};

/**
 * GET /dashboard/quick-stats
 * Recent activity and pending approvals summary.
 */
export const getQuickStats = async (req, res) => {
  const [
    pendingMaintenance,
    pendingTransfers,
    openAuditCycles,
    recentLogs,
  ] = await Promise.all([
    prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
    prisma.transferRequest.count({ where: { status: 'PENDING' } }),
    prisma.auditCycle.count({ where: { status: 'OPEN' } }),
    prisma.activityLog.findMany({
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  res.json({
    success: true,
    data: {
      pendingApprovals: { maintenance: pendingMaintenance, transfers: pendingTransfers },
      openAuditCycles,
      recentActivity: recentLogs,
    },
  });
};
