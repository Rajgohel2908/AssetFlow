// ─── Mock Data for AssetFlow ─────────────────────────────────────────────────

export const ROLES = {
  EMPLOYEE: 'employee',
  DEPT_HEAD: 'dept_head',
  ASSET_MANAGER: 'asset_manager',
  ADMIN: 'admin',
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
  { id: 2, name: 'Operations', head: 'Bob Williams', employeeCount: 28, budget: 180000 },
  { id: 3, name: 'Finance', head: 'Carol Smith', employeeCount: 15, budget: 120000 },
  { id: 4, name: 'HR', head: 'David Brown', employeeCount: 10, budget: 80000 },
  { id: 5, name: 'Marketing', head: 'Eve Davis', employeeCount: 18, budget: 140000 },
  { id: 6, name: 'IT Infrastructure', head: 'Frank Miller', employeeCount: 12, budget: 200000 },
];

export const categories = [
  { id: 1, name: 'Laptops & Computers', description: 'All computing devices', assetCount: 120 },
  { id: 2, name: 'Furniture', description: 'Office furniture and fixtures', assetCount: 340 },
  { id: 3, name: 'Vehicles', description: 'Company fleet', assetCount: 18 },
  { id: 4, name: 'A/V Equipment', description: 'Projectors, cameras, audio gear', assetCount: 45 },
  { id: 5, name: 'Mobile Devices', description: 'Phones, tablets', assetCount: 80 },
  { id: 6, name: 'Office Equipment', description: 'Printers, scanners, shredders', assetCount: 60 },
];

export const employees = [
  { id: 1,  name: 'Alice Johnson',  email: 'alice@assetflow.io',    department: 'Engineering',      role: ROLES.DEPT_HEAD,    status: 'Active', joinDate: '2021-03-15' },
  { id: 2,  name: 'Bob Williams',   email: 'bob@assetflow.io',      department: 'Operations',       role: ROLES.DEPT_HEAD,    status: 'Active', joinDate: '2020-08-01' },
  { id: 3,  name: 'Carol Smith',    email: 'carol@assetflow.io',    department: 'Finance',          role: ROLES.ASSET_MANAGER,status: 'Active', joinDate: '2019-11-20' },
  { id: 4,  name: 'David Brown',    email: 'david@assetflow.io',    department: 'HR',               role: ROLES.DEPT_HEAD,    status: 'Active', joinDate: '2022-01-10' },
  { id: 5,  name: 'Eve Davis',      email: 'eve@assetflow.io',      department: 'Marketing',        role: ROLES.EMPLOYEE,     status: 'Active', joinDate: '2023-05-22' },
  { id: 6,  name: 'Frank Miller',   email: 'frank@assetflow.io',    department: 'IT Infrastructure',role: ROLES.ASSET_MANAGER,status: 'Active', joinDate: '2018-09-05' },
  { id: 7,  name: 'Grace Lee',      email: 'grace@assetflow.io',    department: 'Engineering',      role: ROLES.EMPLOYEE,     status: 'Active', joinDate: '2023-02-14' },
  { id: 8,  name: 'Henry Wilson',   email: 'henry@assetflow.io',    department: 'Operations',       role: ROLES.EMPLOYEE,     status: 'Active', joinDate: '2022-07-30' },
  { id: 9,  name: 'Iris Taylor',    email: 'iris@assetflow.io',     department: 'Finance',          role: ROLES.EMPLOYEE,     status: 'Inactive', joinDate: '2021-12-01' },
  { id: 10, name: 'Jack Anderson',  email: 'jack@assetflow.io',     department: 'Engineering',      role: ROLES.ADMIN,        status: 'Active', joinDate: '2017-06-15' },
];

export const demoUsers = [
  { id: 1,  name: 'Jack Anderson',  email: 'admin@assetflow.io',    role: ROLES.ADMIN,         department: 'IT Infrastructure', password: 'password' },
  { id: 2,  name: 'Frank Miller',   email: 'manager@assetflow.io',  role: ROLES.ASSET_MANAGER, department: 'IT Infrastructure', password: 'password' },
  { id: 3,  name: 'Alice Johnson',  email: 'head@assetflow.io',     role: ROLES.DEPT_HEAD,     department: 'Engineering',       password: 'password' },
  { id: 4,  name: 'Grace Lee',      email: 'user@assetflow.io',     role: ROLES.EMPLOYEE,      department: 'Engineering',       password: 'password' },
];

export const assets = [
  { id: 'AST-001', name: 'MacBook Pro 14"',      category: 'Laptops & Computers', status: ASSET_STATUS.ALLOCATED,    department: 'Engineering',   assignedTo: 'Grace Lee',   purchaseDate: '2023-01-15', value: 2499, location: 'Floor 3', serialNo: 'MBP-X91234' },
  { id: 'AST-002', name: 'Dell XPS 15',          category: 'Laptops & Computers', status: ASSET_STATUS.AVAILABLE,    department: null,            assignedTo: null,          purchaseDate: '2022-08-10', value: 1799, location: 'Storage A', serialNo: 'DXP-A45678' },
  { id: 'AST-003', name: 'Standing Desk',         category: 'Furniture',           status: ASSET_STATUS.ALLOCATED,    department: 'Operations',    assignedTo: 'Bob Williams',purchaseDate: '2021-03-20', value: 850,  location: 'Floor 2', serialNo: 'FRN-B78901' },
  { id: 'AST-004', name: 'Toyota Camry 2022',     category: 'Vehicles',            status: ASSET_STATUS.MAINTENANCE,  department: 'Operations',    assignedTo: null,          purchaseDate: '2022-01-05', value: 28000,location: 'Garage B', serialNo: 'VEH-C12345' },
  { id: 'AST-005', name: 'Epson Projector 4K',    category: 'A/V Equipment',       status: ASSET_STATUS.AVAILABLE,    department: null,            assignedTo: null,          purchaseDate: '2023-05-30', value: 1200, location: 'AV Room',  serialNo: 'AV-D56789' },
  { id: 'AST-006', name: 'iPhone 14 Pro',         category: 'Mobile Devices',      status: ASSET_STATUS.ALLOCATED,    department: 'Marketing',     assignedTo: 'Eve Davis',   purchaseDate: '2023-09-22', value: 999,  location: 'Floor 4', serialNo: 'MOB-E90123' },
  { id: 'AST-007', name: 'HP LaserJet Pro',       category: 'Office Equipment',    status: ASSET_STATUS.AVAILABLE,    department: null,            assignedTo: null,          purchaseDate: '2021-11-12', value: 450,  location: 'Floor 1', serialNo: 'OFC-F34567' },
  { id: 'AST-008', name: 'ThinkPad X1 Carbon',    category: 'Laptops & Computers', status: ASSET_STATUS.RETIRED,      department: null,            assignedTo: null,          purchaseDate: '2018-04-18', value: 0,    location: 'Storage B', serialNo: 'TPX-G78901' },
  { id: 'AST-009', name: 'Ergonomic Chair',        category: 'Furniture',           status: ASSET_STATUS.ALLOCATED,    department: 'Finance',       assignedTo: 'Carol Smith', purchaseDate: '2022-06-30', value: 620,  location: 'Floor 5', serialNo: 'FRN-H23456' },
  { id: 'AST-010', name: 'iPad Air 5th Gen',      category: 'Mobile Devices',      status: ASSET_STATUS.LOST,         department: 'HR',            assignedTo: 'David Brown', purchaseDate: '2022-11-01', value: 749,  location: 'Unknown',  serialNo: 'MOB-I67890' },
  { id: 'AST-011', name: 'Sony A7 IV Camera',     category: 'A/V Equipment',       status: ASSET_STATUS.ALLOCATED,    department: 'Marketing',     assignedTo: 'Eve Davis',   purchaseDate: '2023-03-14', value: 2800, location: 'Floor 4', serialNo: 'AV-J01234' },
  { id: 'AST-012', name: 'Conference Table',       category: 'Furniture',           status: ASSET_STATUS.AVAILABLE,    department: null,            assignedTo: null,          purchaseDate: '2020-07-22', value: 3200, location: 'Conf Room A', serialNo: 'FRN-K45678' },
];

export const assetHistory = {
  'AST-001': [
    { date: '2023-01-20', action: 'Allocated',    user: 'Frank Miller', note: 'Initial allocation to new hire' },
    { date: '2023-06-10', action: 'Maintenance',  user: 'Frank Miller', note: 'Battery replacement' },
    { date: '2023-06-25', action: 'Returned',     user: 'Frank Miller', note: 'Returned after maintenance' },
    { date: '2023-07-01', action: 'Re-Allocated', user: 'Frank Miller', note: 'Reallocated to Grace Lee' },
  ],
  'AST-004': [
    { date: '2022-01-10', action: 'Registered',   user: 'Frank Miller', note: 'New vehicle added to fleet' },
    { date: '2023-11-15', action: 'Maintenance',  user: 'Bob Williams',  note: 'Scheduled engine service' },
  ],
};

export const allocations = [
  { id: 'ALO-001', assetId: 'AST-001', assetName: 'MacBook Pro 14"',   assignedTo: 'Grace Lee',   department: 'Engineering', allocatedOn: '2023-07-01', dueReturn: '2024-07-01', status: 'Active' },
  { id: 'ALO-002', assetId: 'AST-003', assetName: 'Standing Desk',      assignedTo: 'Bob Williams',department: 'Operations',  allocatedOn: '2021-03-25', dueReturn: null,          status: 'Active' },
  { id: 'ALO-003', assetId: 'AST-006', assetName: 'iPhone 14 Pro',      assignedTo: 'Eve Davis',   department: 'Marketing',   allocatedOn: '2023-09-25', dueReturn: '2024-09-25', status: 'Active' },
  { id: 'ALO-004', assetId: 'AST-009', assetName: 'Ergonomic Chair',    assignedTo: 'Carol Smith', department: 'Finance',     allocatedOn: '2022-07-01', dueReturn: null,          status: 'Active' },
  { id: 'ALO-005', assetId: 'AST-011', assetName: 'Sony A7 IV Camera',  assignedTo: 'Eve Davis',   department: 'Marketing',   allocatedOn: '2023-03-20', dueReturn: '2024-03-20', status: 'Active' },
];

export const transferRequests = [
  { id: 'TRF-001', assetId: 'AST-001', assetName: 'MacBook Pro 14"', from: 'Grace Lee', to: 'Henry Wilson', fromDept: 'Engineering', toDept: 'Operations', requestedBy: 'Alice Johnson', date: '2024-01-10', status: 'Pending' },
  { id: 'TRF-002', assetId: 'AST-006', assetName: 'iPhone 14 Pro',   from: 'Eve Davis',  to: 'Iris Taylor',  fromDept: 'Marketing',   toDept: 'Finance',    requestedBy: 'Eve Davis',     date: '2024-01-08', status: 'Approved' },
  { id: 'TRF-003', assetId: 'AST-011', assetName: 'Sony A7 IV Camera',from: 'Eve Davis', to: 'Alice Johnson',fromDept: 'Marketing',   toDept: 'Engineering',requestedBy: 'Frank Miller',  date: '2024-01-05', status: 'Rejected' },
];

export const bookings = [
  { id: 'BKG-001', resource: 'Conference Room A', bookedBy: 'Alice Johnson', date: '2024-01-15', startTime: '09:00', endTime: '11:00', purpose: 'Sprint Planning', status: 'Confirmed' },
  { id: 'BKG-002', resource: 'Epson Projector 4K', bookedBy: 'Eve Davis',   date: '2024-01-15', startTime: '14:00', endTime: '16:00', purpose: 'Client Presentation', status: 'Confirmed' },
  { id: 'BKG-003', resource: 'Conference Room B', bookedBy: 'Bob Williams', date: '2024-01-16', startTime: '10:00', endTime: '12:00', purpose: 'Operations Review', status: 'Confirmed' },
  { id: 'BKG-004', resource: 'Conference Room A', bookedBy: 'Carol Smith',  date: '2024-01-15', startTime: '10:00', endTime: '12:00', purpose: 'Budget Meeting', status: 'Rejected', reason: 'Overlap with BKG-001' },
  { id: 'BKG-005', resource: 'Sony A7 IV Camera', bookedBy: 'Grace Lee',   date: '2024-01-18', startTime: '13:00', endTime: '15:00', purpose: 'Product Photoshoot', status: 'Confirmed' },
];

export const resources = [
  { id: 'RES-001', name: 'Conference Room A', type: 'Room',     capacity: 12, location: 'Floor 2' },
  { id: 'RES-002', name: 'Conference Room B', type: 'Room',     capacity: 8,  location: 'Floor 3' },
  { id: 'RES-003', name: 'Epson Projector 4K', type: 'Equipment', capacity: 1, location: 'AV Room' },
  { id: 'RES-004', name: 'Sony A7 IV Camera',  type: 'Equipment', capacity: 1, location: 'AV Room' },
  { id: 'RES-005', name: 'Training Room',       type: 'Room',     capacity: 30, location: 'Floor 1' },
];

export const maintenanceRequests = [
  { id: 'MNT-001', assetId: 'AST-004', assetName: 'Toyota Camry 2022',   issue: 'Engine service overdue',       raisedBy: 'Bob Williams', raisedDate: '2023-11-10', assignedTo: 'Vendor A',   priority: 'High',   status: 'In Progress', estimatedCost: 1200 },
  { id: 'MNT-002', assetId: 'AST-001', assetName: 'MacBook Pro 14"',     issue: 'Battery draining fast',        raisedBy: 'Grace Lee',    raisedDate: '2023-12-05', assignedTo: 'Frank Miller',priority: 'Medium', status: 'Approved',    estimatedCost: 200  },
  { id: 'MNT-003', assetId: 'AST-007', assetName: 'HP LaserJet Pro',     issue: 'Paper jam frequently',         raisedBy: 'Carol Smith',  raisedDate: '2024-01-02', assignedTo: null,          priority: 'Low',    status: 'Pending',     estimatedCost: 80   },
  { id: 'MNT-004', assetId: 'AST-005', assetName: 'Epson Projector 4K',  issue: 'Lamp needs replacement',       raisedBy: 'Alice Johnson',raisedDate: '2024-01-08', assignedTo: 'Vendor B',   priority: 'Medium', status: 'Resolved',    estimatedCost: 350  },
  { id: 'MNT-005', assetId: 'AST-003', assetName: 'Standing Desk',        issue: 'Motor making noise on raise',  raisedBy: 'Bob Williams', raisedDate: '2024-01-10', assignedTo: null,          priority: 'Low',    status: 'Pending',     estimatedCost: 150  },
];

export const auditCycles = [
  {
    id: 'AUD-001', name: 'Q4 2023 Physical Audit', createdBy: 'Frank Miller', startDate: '2023-12-01', endDate: '2023-12-31', status: 'Completed',
    checklist: [
      { assetId: 'AST-001', assetName: 'MacBook Pro 14"',    status: 'Verified', note: '' },
      { assetId: 'AST-003', assetName: 'Standing Desk',       status: 'Verified', note: '' },
      { assetId: 'AST-010', assetName: 'iPad Air 5th Gen',   status: 'Missing',  note: 'Cannot locate - HR dept' },
    ],
  },
  {
    id: 'AUD-002', name: 'Q1 2024 IT Assets Audit', createdBy: 'Frank Miller', startDate: '2024-01-15', endDate: '2024-01-31', status: 'In Progress',
    checklist: [
      { assetId: 'AST-001', assetName: 'MacBook Pro 14"',    status: 'Verified', note: '' },
      { assetId: 'AST-002', assetName: 'Dell XPS 15',         status: 'Verified', note: '' },
      { assetId: 'AST-008', assetName: 'ThinkPad X1 Carbon', status: 'Damaged',  note: 'Cracked screen, ready for disposal' },
    ],
  },
];

export const activityLogs = [
  { id: 1,  timestamp: '2024-01-12T10:30:00', user: 'Frank Miller',   action: 'Asset Allocated',       details: 'AST-001 allocated to Grace Lee',               module: 'Allocation' },
  { id: 2,  timestamp: '2024-01-12T09:15:00', user: 'Alice Johnson',  action: 'Transfer Requested',    details: 'Transfer request TRF-001 submitted',           module: 'Transfer' },
  { id: 3,  timestamp: '2024-01-11T16:45:00', user: 'Bob Williams',   action: 'Maintenance Raised',    details: 'MNT-005 raised for Standing Desk',             module: 'Maintenance' },
  { id: 4,  timestamp: '2024-01-11T14:00:00', user: 'Grace Lee',      action: 'Resource Booked',       details: 'BKG-005 - Sony Camera booked for Jan 18',     module: 'Booking' },
  { id: 5,  timestamp: '2024-01-11T11:30:00', user: 'Jack Anderson',  action: 'Employee Promoted',     details: 'Carol Smith promoted to Asset Manager role',   module: 'Org Setup' },
  { id: 6,  timestamp: '2024-01-10T15:20:00', user: 'Frank Miller',   action: 'Asset Registered',      details: 'New asset AST-012 added - Conference Table',   module: 'Assets' },
  { id: 7,  timestamp: '2024-01-10T09:05:00', user: 'Carol Smith',    action: 'Report Exported',       details: 'Department Allocation Summary exported (CSV)',  module: 'Reports' },
  { id: 8,  timestamp: '2024-01-09T17:00:00', user: 'David Brown',    action: 'Audit Updated',         details: 'AUD-001 checklist updated for iPad item',      module: 'Audit' },
  { id: 9,  timestamp: '2024-01-09T13:45:00', user: 'Eve Davis',      action: 'Booking Cancelled',     details: 'BKG-004 cancelled by Carol Smith',             module: 'Booking' },
  { id: 10, timestamp: '2024-01-08T10:00:00', user: 'Frank Miller',   action: 'Transfer Approved',     details: 'Transfer request TRF-002 approved',            module: 'Transfer' },
];

export const notifications = [
  { id: 1, message: 'Transfer request TRF-001 awaiting approval',   time: '2h ago', read: false, type: 'warning' },
  { id: 2, message: 'MacBook Pro 14" maintenance approved',           time: '5h ago', read: false, type: 'info' },
  { id: 3, message: 'Overdue return: iPad Air (David Brown)',         time: '1d ago', read: false, type: 'error' },
  { id: 4, message: 'New audit cycle AUD-002 has been created',      time: '2d ago', read: true,  type: 'info' },
  { id: 5, message: 'Standing Desk maintenance request submitted',   time: '3d ago', read: true,  type: 'info' },
];

// KPIs for Dashboard
export const dashboardKPIs = {
  totalAssets:      { label: 'Total Assets',        value: 603,  change: '+12',  trend: 'up' },
  allocated:        { label: 'Allocated',            value: 281,  change: '+5',   trend: 'up' },
  available:        { label: 'Available',            value: 198,  change: '-3',   trend: 'down' },
  underMaintenance: { label: 'Under Maintenance',    value: 24,   change: '+8',   trend: 'up' },
  overdueReturns:   { label: 'Overdue Returns',      value: 7,    change: '+2',   trend: 'up' },
  totalValue:       { label: 'Total Asset Value',    value: '$2.4M', change: '+$140K', trend: 'up' },
};

export const overdueReturns = [
  { assetId: 'AST-010', assetName: 'iPad Air 5th Gen',    employee: 'David Brown',   dept: 'HR',          dueDate: '2023-11-01', daysOverdue: 72 },
  { assetId: 'AST-006', assetName: 'iPhone 14 Pro',       employee: 'Eve Davis',     dept: 'Marketing',   dueDate: '2023-12-15', daysOverdue: 28 },
  { assetId: 'AST-001', assetName: 'MacBook Pro 14"',     employee: 'Grace Lee',     dept: 'Engineering', dueDate: '2024-01-01', daysOverdue: 12 },
  { assetId: 'AST-011', assetName: 'Sony A7 IV Camera',   employee: 'Eve Davis',     dept: 'Marketing',   dueDate: '2024-01-05', daysOverdue: 7  },
];

// Chart Data
export const utilizationTrend = [
  { month: 'Jul', utilization: 72 },
  { month: 'Aug', utilization: 75 },
  { month: 'Sep', utilization: 78 },
  { month: 'Oct', utilization: 74 },
  { month: 'Nov', utilization: 81 },
  { month: 'Dec', utilization: 79 },
  { month: 'Jan', utilization: 83 },
];

export const maintenanceFrequency = [
  { category: 'Laptops',    count: 12 },
  { category: 'Vehicles',   count: 8  },
  { category: 'A/V Equip',  count: 6  },
  { category: 'Furniture',  count: 4  },
  { category: 'Mobiles',    count: 3  },
  { category: 'Office Eq.', count: 2  },
];

export const deptAllocationData = [
  { dept: 'Engineering', allocated: 85,  available: 20 },
  { dept: 'Operations',  allocated: 62,  available: 15 },
  { dept: 'Finance',     allocated: 38,  available: 10 },
  { dept: 'HR',          allocated: 22,  available: 8  },
  { dept: 'Marketing',   allocated: 45,  available: 12 },
  { dept: 'IT Infra',    allocated: 29,  available: 18 },
];
