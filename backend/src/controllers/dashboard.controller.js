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
        expectedReturnDate: { lt: now, not: null },
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        holderUser: { select: { id: true, name: true, department: { select: { name: true } } } },
        holderDepartment: { select: { id: true, name: true } },
      },
      orderBy: { expectedReturnDate: 'asc' },
      take: 20,
    }),
    prisma.asset.aggregate({ _sum: { acquisitionCost: true } }),
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
    totalValue: totalValue._sum.acquisitionCost ?? 0,
  };

  const overdueList = overdueAllocations.map((a) => ({
    allocationId: a.id,
    assetId: a.assetId,
    assetTag: a.asset.assetTag,
    assetName: a.asset.name,
    employeeName: a.holderUser?.name ?? a.holderDepartment?.name ?? 'N/A',
    employeeId: a.holderUserId,
    department: a.holderUser?.department?.name ?? a.holderDepartment?.name ?? 'N/A',
    dueDate: a.expectedReturnDate,
    daysOverdue: Math.floor((now - new Date(a.expectedReturnDate)) / (1000 * 60 * 60 * 24)),
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
    prisma.transferRequest.count({ where: { status: 'REQUESTED' } }),
    prisma.auditCycle.count({ where: { status: 'OPEN' } }),
    prisma.activityLog.findMany({
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { timestamp: 'desc' },
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
