import { z } from 'zod';
import { stringify } from 'csv-stringify/sync';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';

// ─── Report Controllers ───────────────────────────────────────────────────────

/**
 * GET /reports/utilization
 * Monthly asset utilization trend (% of assets allocated per month).
 */
export const getUtilizationReport = async (req, res) => {
  // Calculate utilization for the past 7 months
  const months = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  const totalAssets = await prisma.asset.count();

  const utilizationData = await Promise.all(
    months.map(async (m) => {
      const allocatedCount = await prisma.allocation.count({
        where: {
          createdAt: { lte: m.end },
          OR: [{ returnedAt: null }, { returnedAt: { gte: m.start } }],
          status: { not: 'RETURNED' },
        },
      });
      const utilization = totalAssets > 0 ? Math.round((allocatedCount / totalAssets) * 100) : 0;
      return { month: m.label, utilization, allocated: allocatedCount, total: totalAssets };
    })
  );

  res.json({ success: true, data: utilizationData });
};

/**
 * GET /reports/maintenance-frequency
 * Maintenance count by asset category.
 */
export const getMaintenanceFrequencyReport = async (req, res) => {
  const data = await prisma.maintenanceRequest.groupBy({
    by: ['assetId'],
    _count: { assetId: true },
  });

  // Join with asset categories
  const assetIds = data.map((d) => d.assetId);
  const assets = await prisma.asset.findMany({
    where: { id: { in: assetIds } },
    select: { id: true, category: { select: { name: true } } },
  });

  const categoryMap = {};
  assets.forEach((a) => {
    const cat = a.category.name;
    categoryMap[cat] = (categoryMap[cat] ?? 0);
  });

  const grouped = await prisma.$queryRaw`
    SELECT ac.name AS category, COUNT(mr.id)::int AS count
    FROM "MaintenanceRequest" mr
    JOIN "Asset" a ON mr."assetId" = a.id
    JOIN "AssetCategory" ac ON a."categoryId" = ac.id
    GROUP BY ac.name
    ORDER BY count DESC
  `;

  res.json({ success: true, data: grouped });
};

/**
 * GET /reports/department-summary
 * Per-department allocated vs available asset count.
 */
export const getDepartmentSummaryReport = async (req, res) => {
  const summary = await prisma.$queryRaw`
    SELECT
      d.name AS dept,
      COUNT(a.id)::int AS total,
      SUM(CASE WHEN a.status = 'ALLOCATED' THEN 1 ELSE 0 END)::int AS allocated,
      SUM(CASE WHEN a.status = 'AVAILABLE' THEN 1 ELSE 0 END)::int AS available,
      SUM(CASE WHEN a.status = 'UNDER_MAINTENANCE' THEN 1 ELSE 0 END)::int AS "underMaintenance",
      COALESCE(SUM(a."purchasePrice"), 0)::float AS "totalValue"
    FROM "Department" d
    LEFT JOIN "Asset" a ON a."departmentId" = d.id
    GROUP BY d.id, d.name
    ORDER BY total DESC
  `;

  res.json({ success: true, data: summary });
};

/**
 * GET /reports/booking-heatmap
 * Bookings per day per resource for the past 30 days.
 */
export const getBookingHeatmapReport = async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      startTime: { gte: thirtyDaysAgo },
    },
    select: {
      startTime: true,
      resourceId: true,
      resource: { select: { name: true } },
    },
  });

  // Group by date and resource
  const heatmap = bookings.reduce((acc, b) => {
    const date = b.startTime.toISOString().split('T')[0];
    const key = `${date}::${b.resource.name}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const result = Object.entries(heatmap).map(([key, count]) => {
    const [date, resource] = key.split('::');
    return { date, resource, count };
  });

  res.json({ success: true, data: result });
};

/**
 * GET /reports/export?type=assets|allocations|maintenance|audit
 * Export data as CSV.
 */
export const exportReport = async (req, res) => {
  const { type } = z.object({
    type: z.enum(['assets', 'allocations', 'maintenance', 'audit']),
  }).parse(req.query);

  let rows = [];
  let filename = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;

  if (type === 'assets') {
    const assets = await prisma.asset.findMany({
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { assetTag: 'asc' },
    });
    rows = assets.map((a) => ({
      'Asset Tag': a.assetTag,
      'Name': a.name,
      'Category': a.category.name,
      'Status': a.status,
      'Department': a.department?.name ?? '',
      'Location': a.location?.name ?? '',
      'Serial No': a.serialNo ?? '',
      'Purchase Date': a.purchaseDate?.toISOString().split('T')[0] ?? '',
      'Purchase Price': a.purchasePrice ?? '',
    }));
  } else if (type === 'allocations') {
    const allocations = await prisma.allocation.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
        user: { select: { name: true, email: true } },
        allocatedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    rows = allocations.map((a) => ({
      'Asset Tag': a.asset.assetTag,
      'Asset Name': a.asset.name,
      'Assigned To': a.user.name,
      'Email': a.user.email,
      'Allocated By': a.allocatedBy.name,
      'Allocated On': a.createdAt.toISOString().split('T')[0],
      'Due Date': a.dueDate?.toISOString().split('T')[0] ?? '',
      'Status': a.status,
      'Returned At': a.returnedAt?.toISOString().split('T')[0] ?? '',
    }));
  } else if (type === 'maintenance') {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
        requestedBy: { select: { name: true } },
        technician: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    rows = requests.map((r) => ({
      'Asset Tag': r.asset.assetTag,
      'Asset Name': r.asset.name,
      'Issue': r.issue,
      'Priority': r.priority,
      'Status': r.status,
      'Requested By': r.requestedBy.name,
      'Technician': r.technician?.name ?? '',
      'Estimated Cost': r.estimatedCost ?? '',
      'Raised On': r.createdAt.toISOString().split('T')[0],
      'Resolved At': r.resolvedAt?.toISOString().split('T')[0] ?? '',
    }));
  } else if (type === 'audit') {
    const items = await prisma.auditItem.findMany({
      include: {
        auditCycle: { select: { name: true } },
        asset: { select: { assetTag: true, name: true } },
        updatedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    rows = items.map((i) => ({
      'Audit Cycle': i.auditCycle.name,
      'Asset Tag': i.asset.assetTag,
      'Asset Name': i.asset.name,
      'Status': i.status,
      'Notes': i.notes ?? '',
      'Updated By': i.updatedBy?.name ?? '',
      'Updated At': i.updatedAt.toISOString().split('T')[0],
    }));
  }

  if (rows.length === 0) {
    return res.json({ success: true, data: [], message: 'No data to export' });
  }

  const csv = stringify(rows, { header: true });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};
