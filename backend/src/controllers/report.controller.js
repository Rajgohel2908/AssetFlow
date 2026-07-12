import { z } from 'zod';
import { stringify } from 'csv-stringify/sync';
import prisma from '../lib/prisma.js';

export const getUtilizationReport = async (req, res) => {
  const months = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  const totalAssets = await prisma.asset.count();
  const utilizationData = await Promise.all(
    months.map(async (month) => {
      const allocatedCount = await prisma.allocation.count({
        where: {
          allocatedDate: { lte: month.end },
          OR: [{ returnedDate: null }, { returnedDate: { gte: month.start } }],
        },
      });
      return {
        month: month.label,
        utilization: totalAssets > 0 ? Math.round((allocatedCount / totalAssets) * 100) : 0,
        allocated: allocatedCount,
        total: totalAssets,
      };
    })
  );

  res.json({ success: true, data: utilizationData });
};

export const getMaintenanceFrequencyReport = async (req, res) => {
  const grouped = await prisma.maintenanceRequest.groupBy({
    by: ['assetId'],
    _count: { assetId: true },
  });

  const assets = await prisma.asset.findMany({
    where: { id: { in: grouped.map((item) => item.assetId) } },
    select: { id: true, category: { select: { name: true } } },
  });
  const categoryByAsset = new Map(assets.map((asset) => [asset.id, asset.category.name]));
  const resultMap = new Map();
  grouped.forEach((item) => {
    const category = categoryByAsset.get(item.assetId) ?? 'Uncategorized';
    resultMap.set(category, (resultMap.get(category) ?? 0) + item._count.assetId);
  });

  const result = [...resultMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  res.json({ success: true, data: result });
};

export const getDepartmentSummaryReport = async (req, res) => {
  const departments = await prisma.department.findMany({
    include: {
      assetsHeld: { select: { id: true, status: true, acquisitionCost: true } },
      allocations: {
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
        include: { asset: { select: { id: true, status: true, acquisitionCost: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  const summary = departments.map((department) => {
    const assets = [
      ...department.assetsHeld,
      ...department.allocations
        .filter((allocation) => !department.assetsHeld.some((asset) => asset.id === allocation.assetId))
        .map((allocation) => allocation.asset),
    ];
    return {
      dept: department.name,
      total: assets.length,
      allocated: assets.filter((asset) => asset.status === 'ALLOCATED').length,
      available: assets.filter((asset) => asset.status === 'AVAILABLE').length,
      underMaintenance: assets.filter((asset) => asset.status === 'UNDER_MAINTENANCE').length,
      totalValue: assets.reduce((sum, asset) => sum + Number(asset.acquisitionCost ?? 0), 0),
    };
  });

  res.json({ success: true, data: summary });
};

export const getBookingHeatmapReport = async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['UPCOMING', 'ONGOING', 'COMPLETED'] },
      startTime: { gte: thirtyDaysAgo },
    },
    select: {
      startTime: true,
      resource: { select: { name: true } },
    },
  });

  const heatmap = bookings.reduce((acc, booking) => {
    const date = booking.startTime.toISOString().split('T')[0];
    const key = `${date}::${booking.resource.name}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const result = Object.entries(heatmap).map(([key, count]) => {
    const [date, resource] = key.split('::');
    return { date, resource, count };
  });

  res.json({ success: true, data: result });
};

export const exportReport = async (req, res) => {
  const { type } = z.object({
    type: z.enum(['assets', 'allocations', 'maintenance', 'audit']),
  }).parse(req.query);

  let rows = [];
  const filename = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;

  if (type === 'assets') {
    const assets = await prisma.asset.findMany({
      include: {
        category: { select: { name: true } },
        holderUser: { select: { name: true, email: true } },
        holderDepartment: { select: { name: true } },
      },
      orderBy: { assetTag: 'asc' },
    });
    rows = assets.map((asset) => ({
      'Asset Tag': asset.assetTag,
      'Name': asset.name,
      'Category': asset.category.name,
      'Status': asset.status,
      'Holder': asset.holderUser?.name ?? asset.holderDepartment?.name ?? '',
      'Location': asset.location ?? '',
      'Serial No': asset.serialNumber ?? '',
      'Acquisition Date': asset.acquisitionDate?.toISOString().split('T')[0] ?? '',
      'Acquisition Cost': asset.acquisitionCost ?? '',
      'Bookable': asset.isBookable ? 'Yes' : 'No',
    }));
  } else if (type === 'allocations') {
    const allocations = await prisma.allocation.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
        holderUser: { select: { name: true, email: true } },
        holderDepartment: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    rows = allocations.map((allocation) => ({
      'Asset Tag': allocation.asset.assetTag,
      'Asset Name': allocation.asset.name,
      'Assigned To': allocation.holderUser?.name ?? allocation.holderDepartment?.name ?? '',
      'Email': allocation.holderUser?.email ?? '',
      'Allocated On': allocation.allocatedDate?.toISOString().split('T')[0] ?? allocation.createdAt.toISOString().split('T')[0],
      'Expected Return': allocation.expectedReturnDate?.toISOString().split('T')[0] ?? '',
      'Status': allocation.status,
      'Returned Date': allocation.returnedDate?.toISOString().split('T')[0] ?? '',
    }));
  } else if (type === 'maintenance') {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
        raisedBy: { select: { name: true } },
        technician: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    rows = requests.map((request) => ({
      'Asset Tag': request.asset.assetTag,
      'Asset Name': request.asset.name,
      'Issue': request.issueDescription,
      'Priority': request.priority,
      'Status': request.status,
      'Raised By': request.raisedBy.name,
      'Technician': request.technician?.name ?? '',
      'Raised On': request.createdAt.toISOString().split('T')[0],
    }));
  } else if (type === 'audit') {
    const items = await prisma.auditItem.findMany({
      include: {
        auditCycle: { select: { name: true } },
        asset: { select: { assetTag: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    rows = items.map((item) => ({
      'Audit Cycle': item.auditCycle.name,
      'Asset Tag': item.asset.assetTag,
      'Asset Name': item.asset.name,
      'Result': item.result,
      'Notes': item.notes ?? '',
      'Updated At': item.updatedAt.toISOString().split('T')[0],
    }));
  }

  if (rows.length === 0) return res.json({ success: true, data: [], message: 'No data to export' });

  const csv = stringify(rows, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};
