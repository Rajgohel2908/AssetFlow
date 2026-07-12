// ─── Highly Realistic Mock Data for AssetFlow ─────────────────────────────────

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

export const departments = [
  { id: 1, name: 'Engineering', head: 'Alice Johnson', employeeCount: 42, budget: 250000 },
  { id: 2, name: 'Product & Design', head: 'Priya Sharma', employeeCount: 28, budget: 180000 },
  { id: 3, name: 'Human Resources', head: 'Carol Smith', employeeCount: 15, budget: 120000 },
  { id: 4, name: 'Finance & Legal', head: 'David Brown', employeeCount: 10, budget: 80000 },
  { id: 5, name: 'IT & Security', head: 'Rahul Verma', employeeCount: 18, budget: 140000 },
  { id: 6, name: 'Sales & Marketing', head: 'Vikram Singh', employeeCount: 12, budget: 200000 }
];

export const categories = [
  { id: 1, name: 'Laptops', description: 'All laptops' },
  { id: 2, name: 'Monitors', description: 'Desktop monitors' },
  { id: 3, name: 'Servers', description: 'Data center servers' },
  { id: 4, name: 'Network Equipment', description: 'Routers, switches, APs' },
  { id: 5, name: 'Office Furniture', description: 'Desks, chairs, etc.' },
  { id: 6, name: 'Mobile Devices', description: 'Phones and tablets' },
  { id: 7, name: 'Software Licenses', description: 'Enterprise software' }
];

export const employees = [
  { id: 101, name: 'Aarav Patel',     dept: 'Engineering',   role: ROLES.EMPLOYEE },
  { id: 102, name: 'Priya Sharma',    dept: 'Product & Design', role: ROLES.DEPT_HEAD },
  { id: 103, name: 'Rahul Verma',     dept: 'IT & Security', role: ROLES.ASSET_MANAGER },
  { id: 104, name: 'Neha Gupta',      dept: 'Finance & Legal', role: ROLES.EMPLOYEE },
  { id: 105, name: 'Vikram Singh',    dept: 'Sales & Marketing', role: ROLES.EMPLOYEE },
];

export const demoUsers = [
  { id: 1, name: 'Rudra Admin',   email: 'admin@assetflow.io',   role: ROLES.ADMIN,         department: 'IT & Security',    password: 'password' },
  { id: 2, name: 'Rahul Verma',   email: 'manager@assetflow.io', role: ROLES.ASSET_MANAGER, department: 'IT & Security',    password: 'password' },
  { id: 3, name: 'Priya Sharma',  email: 'head@assetflow.io',    role: ROLES.DEPT_HEAD,     department: 'Product & Design', password: 'password' },
  { id: 4, name: 'Aarav Patel',   email: 'user@assetflow.io',    role: ROLES.EMPLOYEE,      department: 'Engineering',      password: 'password' },
];

export const assets = [
  { id: 'AF-1001', name: 'Apple MacBook Pro M3 Max 16"', category: 'Laptops', status: 'Allocated', department: 'Engineering', assignedTo: 'Aarav Patel', location: 'BLR-Tower1-F4', value: 349900, purchaseDate: '2023-11-15', serialNo: 'C02F9X84MD6M' },
  { id: 'AF-1002', name: 'Apple MacBook Air M2 15"', category: 'Laptops', status: 'Available', department: 'IT & Security', assignedTo: null, location: 'BLR-Tower1-IT-Store', value: 134900, purchaseDate: '2023-08-20', serialNo: 'C02G1A23MD6N' },
  { id: 'AF-1003', name: 'Dell XPS 15 9530', category: 'Laptops', status: 'Under Maintenance', department: 'Product & Design', assignedTo: 'Priya Sharma', location: 'Service Center', value: 215000, purchaseDate: '2023-01-10', serialNo: 'DL-XPS-9530-X9' },
  { id: 'AF-1004', name: 'Herman Miller Aeron Chair', category: 'Office Furniture', status: 'Allocated', department: 'Engineering', assignedTo: 'Aarav Patel', location: 'BLR-Tower1-F4-D12', value: 125000, purchaseDate: '2022-05-12', serialNo: 'HM-AER-B-2022' },
  { id: 'AF-1005', name: 'Dell UltraSharp 32" 4K U3223QE', category: 'Monitors', status: 'Allocated', department: 'Product & Design', assignedTo: 'Priya Sharma', location: 'BLR-Tower1-F5', value: 85000, purchaseDate: '2023-02-18', serialNo: 'CN-0X1Y2Z-U32' },
  { id: 'AF-1006', name: 'Cisco Meraki MR46 Wi-Fi 6', category: 'Network Equipment', status: 'Allocated', department: 'IT & Security', assignedTo: 'Rahul Verma', location: 'BLR-Tower1-Ceiling', value: 92000, purchaseDate: '2022-11-05', serialNo: 'Q2JD-X9K3-M4R6' },
  { id: 'AF-1007', name: 'Lenovo ThinkPad X1 Carbon Gen 11', category: 'Laptops', status: 'Allocated', department: 'Sales & Marketing', assignedTo: 'Vikram Singh', location: 'Field/Remote', value: 165000, purchaseDate: '2023-09-01', serialNo: 'PF-3XYZ98' },
  { id: 'AF-1008', name: 'LG 27" Ergo IPS Monitor', category: 'Monitors', status: 'Available', department: 'IT & Security', assignedTo: null, location: 'BLR-Tower1-IT-Store', value: 35000, purchaseDate: '2024-01-15', serialNo: 'LG-27-ERGO-11' },
  { id: 'AF-1009', name: 'AWS Outposts Rack 42U', category: 'Servers', status: 'Allocated', department: 'Engineering', assignedTo: null, location: 'BLR-DC-Rack04', value: 2500000, purchaseDate: '2022-03-22', serialNo: 'AWS-OUT-42U-991' },
  { id: 'AF-1010', name: 'Apple iPad Pro 12.9" M2', category: 'Mobile Devices', status: 'Lost', department: 'Finance & Legal', assignedTo: 'Neha Gupta', location: 'Unknown', value: 112900, purchaseDate: '2023-05-10', serialNo: 'DLX-IPAD-PRO22' },
];

export const assetHistory = {
  'AF-1001': [
    { date: '2023-11-15', action: 'Purchased', user: 'System', note: 'Procured from Apple India Auth Reseller' },
    { date: '2023-11-18', action: 'Allocated', user: 'Rahul Verma', note: 'Assigned to Aarav Patel for primary development machine.' }
  ],
  'AF-1003': [
    { date: '2023-01-10', action: 'Purchased', user: 'System', note: 'Procured from Dell Direct' },
    { date: '2023-01-12', action: 'Allocated', user: 'Rahul Verma', note: 'Assigned to Priya Sharma' },
    { date: '2024-02-05', action: 'Maintenance', user: 'Rahul Verma', note: 'Sent for keyboard replacement (sticky spacebar).' }
  ]
};

export const dashboardKPIs = {
  totalAssets:      { label: 'Total Assets',        value: 1450, change: '+24',  trend: 'up' },
  allocated:        { label: 'Allocated',           value: 1210, change: '+18',  trend: 'up' },
  available:        { label: 'Available',           value: 185,  change: '-2',   trend: 'down' },
  underMaintenance: { label: 'Under Maintenance',   value: 42,   change: '+5',   trend: 'up' },
  overdueReturns:   { label: 'Overdue Returns',     value: 13,   change: '-4',   trend: 'down' },
  totalValue:       { label: 'Total Asset Value',   value: '₹8.45 Cr', change: '+₹12.5L', trend: 'up' },
};

export const overdueReturns = [
  { assetId: 'AF-0892', assetName: 'MacBook Air M1', employee: 'Suresh Kumar', dept: 'Marketing', dueDate: '2024-01-10', daysOverdue: 45 },
  { assetId: 'AF-0915', assetName: 'Samsung 34" Ultrawide', employee: 'Anita Roy', dept: 'Engineering', dueDate: '2024-02-15', daysOverdue: 9 },
  { assetId: 'AF-0940', assetName: 'Sony A7IV Camera', employee: 'Vikram Singh', dept: 'Sales & Marketing', dueDate: '2024-02-20', daysOverdue: 4 },
];

export const utilizationTrend = [
  { month: 'Aug', utilization: 78 },
  { month: 'Sep', utilization: 82 },
  { month: 'Oct', utilization: 85 },
  { month: 'Nov', utilization: 84 },
  { month: 'Dec', utilization: 88 },
  { month: 'Jan', utilization: 91 },
  { month: 'Feb', utilization: 94 },
];

export const maintenanceFrequency = [];
export const deptAllocationData = [];

export const allocations = [
  { id: 'ALC-901', assetId: 'AF-1001', assetName: 'Apple MacBook Pro M3 Max 16"', assignedTo: 'Aarav Patel', department: 'Engineering', allocatedOn: '2023-11-18', dueReturn: null, status: 'Active' },
  { id: 'ALC-902', assetId: 'AF-1004', assetName: 'Herman Miller Aeron Chair', assignedTo: 'Aarav Patel', department: 'Engineering', allocatedOn: '2022-05-15', dueReturn: null, status: 'Active' },
  { id: 'ALC-903', assetId: 'AF-1005', assetName: 'Dell UltraSharp 32" 4K U3223QE', assignedTo: 'Priya Sharma', department: 'Product & Design', allocatedOn: '2023-02-20', dueReturn: null, status: 'Active' },
  { id: 'ALC-904', assetId: 'AF-1006', assetName: 'Cisco Meraki MR46 Wi-Fi 6', assignedTo: 'Rahul Verma', department: 'IT & Security', allocatedOn: '2022-11-06', dueReturn: null, status: 'Active' },
  { id: 'ALC-905', assetId: 'AF-1007', assetName: 'Lenovo ThinkPad X1 Carbon Gen 11', assignedTo: 'Vikram Singh', department: 'Sales & Marketing', allocatedOn: '2023-09-02', dueReturn: '2024-12-31', status: 'Active' },
];

export const transferRequests = [
  { id: 'TRF-001', assetId: 'AF-1002', assetName: 'Apple MacBook Air M2 15"', from: 'IT & Security', to: 'Neha Gupta', toDept: 'Finance & Legal', date: '2024-03-01', status: 'Pending' },
  { id: 'TRF-002', assetId: 'AF-1009', assetName: 'AWS Outposts Rack 42U', from: 'Engineering', to: 'Data Center Ops', toDept: 'IT & Security', date: '2024-02-28', status: 'Approved' },
  { id: 'TRF-003', assetId: 'AF-1008', assetName: 'LG 27" Ergo IPS Monitor', from: 'IT Store', to: 'Vikram Singh', toDept: 'Sales & Marketing', date: '2024-02-25', status: 'In Progress' },
  { id: 'TRF-004', assetId: 'AF-1003', assetName: 'Dell XPS 15 9530', from: 'Priya Sharma', to: 'IT Service Desk', toDept: 'IT & Security', date: '2024-02-05', status: 'Resolved' },
  { id: 'TRF-005', assetId: 'AF-0892', assetName: 'MacBook Air M1', from: 'Suresh Kumar', to: 'IT Store', toDept: 'IT & Security', date: '2024-03-05', status: 'Pending' },
  { id: 'TRF-006', assetId: 'AF-1020', assetName: 'Logitech MX Master 3', from: 'IT Store', to: 'Aarav Patel', toDept: 'Engineering', date: '2024-03-06', status: 'Pending' },
  { id: 'TRF-007', assetId: 'AF-1031', assetName: 'Apple Magic Keyboard', from: 'Engineering', to: 'Priya Sharma', toDept: 'Product & Design', date: '2024-03-02', status: 'Approved' },
  { id: 'TRF-008', assetId: 'AF-1045', assetName: 'Dell 24" Monitor', from: 'IT Store', to: 'Neha Gupta', toDept: 'Finance & Legal', date: '2024-02-20', status: 'In Progress' },
  { id: 'TRF-009', assetId: 'AF-1052', assetName: 'ThinkPad Docking Station', from: 'Vikram Singh', to: 'IT Store', toDept: 'IT & Security', date: '2024-01-15', status: 'Resolved' },
  { id: 'TRF-010', assetId: 'AF-1066', assetName: 'Keychron K2 Keyboard', from: 'IT Store', to: 'Rahul Verma', toDept: 'IT & Security', date: '2024-03-07', status: 'Pending' },
  { id: 'TRF-011', assetId: 'AF-1077', assetName: 'Herman Miller Embody', from: 'IT Store', to: 'Aarav Patel', toDept: 'Engineering', date: '2024-03-01', status: 'Approved' },
  { id: 'TRF-012', assetId: 'AF-1088', assetName: 'Wacom Cintiq Pro 24', from: 'IT Store', to: 'Priya Sharma', toDept: 'Product & Design', date: '2024-02-15', status: 'In Progress' },
  { id: 'TRF-013', assetId: 'AF-1099', assetName: 'Cisco IP Phone 8841', from: 'Sales & Marketing', to: 'IT Store', toDept: 'IT & Security', date: '2024-01-20', status: 'Resolved' },
  { id: 'TRF-014', assetId: 'AF-1105', assetName: 'Sony WH-1000XM5', from: 'IT Store', to: 'Neha Gupta', toDept: 'Finance & Legal', date: '2024-03-08', status: 'Pending' },
  { id: 'TRF-015', assetId: 'AF-1122', assetName: 'Samsung 49" Odyssey', from: 'IT Store', to: 'Aarav Patel', toDept: 'Engineering', date: '2024-02-29', status: 'Approved' },
];

export const bookings = [
  { id: 'BKG-001', resource: 'Conference Room A', bookedBy: 'Alice Johnson', date: '2024-01-15', startTime: '09:00', endTime: '11:00', purpose: 'Sprint Planning', status: 'Confirmed' },
  { id: 'BKG-002', resource: 'Projector 4K', bookedBy: 'Bob Smith', date: '2024-01-16', startTime: '13:00', endTime: '15:00', purpose: 'Client Presentation', status: 'Confirmed' },
  { id: 'BKG-003', resource: 'Conference Room B', bookedBy: 'Charlie Davis', date: '2024-01-15', startTime: '14:00', endTime: '15:00', purpose: '1-on-1 Review', status: 'Confirmed' },
];

export const resources = [
  { id: 'RES-01', name: 'Conference Room A', type: 'Room', capacity: 12 },
  { id: 'RES-02', name: 'Conference Room B', type: 'Room', capacity: 8 },
  { id: 'RES-03', name: 'Conference Room C', type: 'Room', capacity: 20 },
  { id: 'RES-04', name: 'Projector 4K', type: 'Equipment', capacity: 1 },
  { id: 'RES-05', name: 'Design Tablet Wacom', type: 'Equipment', capacity: 1 },
  { id: 'RES-06', name: 'Poly Studio Cam', type: 'Equipment', capacity: 1 },
];

export const maintenanceRequests = [];
export const auditCycles = [];
export const activityLogs = [];

export const notifications = [
  { id: 1, type: 'warning', message: '13 Assets are currently overdue for return.', time: '2 hours ago', read: false },
  { id: 2, type: 'info', message: 'New MacBook batch arrived in IT store.', time: '5 hours ago', read: false },
  { id: 3, type: 'error', message: 'Audit Cycle 2024-Q1 missed by Finance dept.', time: '1 day ago', read: true }
];
