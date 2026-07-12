// ─── Empty Mock Data for AssetFlow ─────────────────────────────────────────────

export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  DEPT_HEAD: 'DEPARTMENT_HEAD',
  ASSET_MANAGER: 'ASSET_MANAGER',
  ADMIN: 'ADMIN',
};

export const ASSET_STATUS = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  MAINTENANCE: 'Under Maintenance',
  LOST: 'Lost',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed',
};

export const departments = [];
export const categories = [];
export const employees = [];
export const demoUsers = [
  { id: 1, name: 'Rudra Admin', email: 'rudra@gmail.com', role: ROLES.ADMIN, department: 'IT', password: 'rudi' }
];
export const assets = [];
export const assetHistory = {};
export const allocations = [];
export const transferRequests = [];
export const bookings = [];
export const resources = [];
export const maintenanceRequests = [];
export const auditCycles = [];
export const activityLogs = [];
export const notifications = [];

export const dashboardKPIs = {
  totalAssets:      { label: 'Total Assets',        value: 0, change: '0',  trend: 'up' },
  allocated:        { label: 'Allocated',           value: 0, change: '0',  trend: 'up' },
  available:        { label: 'Available',           value: 0, change: '0',  trend: 'up' },
  underMaintenance: { label: 'Under Maintenance',   value: 0, change: '0',  trend: 'up' },
  overdueReturns:   { label: 'Overdue Returns',     value: 0, change: '0',  trend: 'up' },
  totalValue:       { label: 'Total Asset Value',   value: '₹0', change: '₹0', trend: 'up' },
};

export const overdueReturns = [];
export const utilizationTrend = [];
export const maintenanceFrequency = [];
export const deptAllocationData = [];
