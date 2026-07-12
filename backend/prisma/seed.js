/**
 * AssetFlow — Database Seed Script
 *
 * Run with: node prisma/seed.js
 *
 * Seeds:
 *   - 1 Postgres sequence for asset tags
 *   - 4 locations
 *   - 6 departments (with hierarchy)
 *   - 6 asset categories (with custom field schemas)
 *   - 5 resources (rooms + equipment)
 *   - 10 users (4 demo accounts + 6 supporting)
 *   - 12 assets
 *   - 5 allocations
 *   - 3 transfer requests
 *   - 5 bookings
 *   - 5 maintenance requests
 *   - 2 audit cycles
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AssetFlow seed...\n');

  // ─── Step 0: Asset Tag Sequence ─────────────────────────────────────────────
  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 1 INCREMENT 1 MINVALUE 1 NO MAXVALUE CACHE 1;`
  );
  // Reset sequence to match how many assets we're seeding
  await prisma.$executeRawUnsafe(`SELECT setval('asset_tag_seq', 12, true);`);
  console.log('✅ Asset tag sequence ready');

  // ─── Step 1: Locations ───────────────────────────────────────────────────────
  const locationData = [
    { name: 'Floor 1', building: 'HQ', floor: '1' },
    { name: 'Floor 2', building: 'HQ', floor: '2' },
    { name: 'Floor 3', building: 'HQ', floor: '3' },
    { name: 'Floor 4', building: 'HQ', floor: '4' },
    { name: 'Floor 5', building: 'HQ', floor: '5' },
    { name: 'Storage A', building: 'HQ', floor: 'B1' },
    { name: 'Storage B', building: 'HQ', floor: 'B1' },
    { name: 'Garage B', building: 'Annex', floor: 'G' },
    { name: 'AV Room', building: 'HQ', floor: '2' },
    { name: 'Conf Room A', building: 'HQ', floor: '2' },
  ];

  const locations = {};
  for (const loc of locationData) {
    const l = await prisma.location.upsert({
      where: { name: loc.name }, update: loc, create: loc,
    });
    locations[loc.name] = l;
  }
  console.log(`✅ ${locationData.length} locations`);

  // ─── Step 2: Departments ─────────────────────────────────────────────────────
  const deptData = [
    { name: 'Engineering', description: 'Software and hardware engineering' },
    { name: 'Operations', description: 'Day-to-day business operations' },
    { name: 'Finance', description: 'Financial planning and accounting' },
    { name: 'HR', description: 'Human resources and recruitment' },
    { name: 'Marketing', description: 'Brand, content, and campaigns' },
    { name: 'IT Infrastructure', description: 'Networks, servers, and IT support' },
  ];

  const depts = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { name: d.name }, update: d, create: d,
    });
    depts[d.name] = dept;
  }
  console.log(`✅ ${deptData.length} departments`);

  // ─── Step 3: Asset Categories ─────────────────────────────────────────────
  const categoryData = [
    {
      name: 'Laptops & Computers',
      description: 'All computing devices',
      customFieldSchema: [
        { key: 'ram', label: 'RAM (GB)', type: 'number', required: false },
        { key: 'storage', label: 'Storage (GB)', type: 'number', required: false },
        { key: 'os', label: 'Operating System', type: 'text', required: false },
      ],
    },
    {
      name: 'Furniture',
      description: 'Office furniture and fixtures',
      customFieldSchema: [
        { key: 'material', label: 'Material', type: 'text', required: false },
        { key: 'color', label: 'Color', type: 'text', required: false },
      ],
    },
    {
      name: 'Vehicles',
      description: 'Company fleet',
      customFieldSchema: [
        { key: 'licensePlate', label: 'License Plate', type: 'text', required: true },
        { key: 'year', label: 'Year', type: 'number', required: false },
        { key: 'mileage', label: 'Mileage (km)', type: 'number', required: false },
      ],
    },
    {
      name: 'A/V Equipment',
      description: 'Projectors, cameras, audio gear',
      customFieldSchema: [
        { key: 'resolution', label: 'Resolution', type: 'text', required: false },
      ],
    },
    {
      name: 'Mobile Devices',
      description: 'Phones, tablets',
      customFieldSchema: [
        { key: 'imei', label: 'IMEI', type: 'text', required: false },
        { key: 'carrier', label: 'Carrier', type: 'text', required: false },
      ],
    },
    {
      name: 'Office Equipment',
      description: 'Printers, scanners, shredders',
      customFieldSchema: [
        { key: 'model', label: 'Model Number', type: 'text', required: false },
      ],
    },
  ];

  const cats = {};
  for (const c of categoryData) {
    const cat = await prisma.assetCategory.upsert({
      where: { name: c.name }, update: c, create: c,
    });
    cats[c.name] = cat;
  }
  console.log(`✅ ${categoryData.length} asset categories`);

  // ─── Step 4: Resources ───────────────────────────────────────────────────────
  const resourceData = [
    { name: 'Conference Room A', type: 'Room', capacity: 12, location: 'Floor 2' },
    { name: 'Conference Room B', type: 'Room', capacity: 8, location: 'Floor 3' },
    { name: 'Training Room', type: 'Room', capacity: 30, location: 'Floor 1' },
    { name: 'Epson Projector 4K', type: 'Equipment', capacity: 1, location: 'AV Room' },
    { name: 'Sony A7 IV Camera', type: 'Equipment', capacity: 1, location: 'AV Room' },
  ];

  const resources = {};
  for (const r of resourceData) {
    const res = await prisma.resource.upsert({
      where: { name: r.name }, update: r, create: r,
    });
    resources[r.name] = res;
  }
  console.log(`✅ ${resourceData.length} resources`);

  // ─── Step 5: Users ───────────────────────────────────────────────────────────
  const hash = (p) => bcrypt.hash(p, 12);

  const usersData = [
    // Demo accounts (matching mockData.js demoUsers)
    { name: 'Jack Anderson',  email: 'admin@assetflow.io',   role: 'ADMIN',          dept: 'IT Infrastructure', password: 'password' },
    { name: 'Frank Miller',   email: 'manager@assetflow.io', role: 'ASSET_MANAGER',  dept: 'IT Infrastructure', password: 'password' },
    { name: 'Alice Johnson',  email: 'head@assetflow.io',    role: 'DEPARTMENT_HEAD',dept: 'Engineering',       password: 'password' },
    { name: 'Grace Lee',      email: 'user@assetflow.io',    role: 'EMPLOYEE',       dept: 'Engineering',       password: 'password' },
    // Supporting cast
    { name: 'Bob Williams',   email: 'bob@assetflow.io',     role: 'DEPARTMENT_HEAD',dept: 'Operations',        password: 'password' },
    { name: 'Carol Smith',    email: 'carol@assetflow.io',   role: 'ASSET_MANAGER',  dept: 'Finance',           password: 'password' },
    { name: 'David Brown',    email: 'david@assetflow.io',   role: 'DEPARTMENT_HEAD',dept: 'HR',                password: 'password' },
    { name: 'Eve Davis',      email: 'eve@assetflow.io',     role: 'EMPLOYEE',       dept: 'Marketing',         password: 'password' },
    { name: 'Henry Wilson',   email: 'henry@assetflow.io',   role: 'EMPLOYEE',       dept: 'Operations',        password: 'password' },
    { name: 'Iris Taylor',    email: 'iris@assetflow.io',    role: 'EMPLOYEE',       dept: 'Finance',           password: 'password' },
  ];

  const users = {};
  for (const u of usersData) {
    const passwordHash = await hash(u.password);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, departmentId: depts[u.dept]?.id },
      create: {
        name: u.name, email: u.email, passwordHash,
        role: u.role, departmentId: depts[u.dept]?.id,
      },
    });
    users[u.email] = user;
  }
  console.log(`✅ ${usersData.length} users (passwords: "password")`);

  // ─── Step 6: Assets ──────────────────────────────────────────────────────────
  const assetData = [
    { tag: 'AF-0001', name: 'MacBook Pro 14"',    cat: 'Laptops & Computers', status: 'ALLOCATED',         dept: 'Engineering',   loc: 'Floor 3', price: 2499, serial: 'MBP-X91234', purchase: '2023-01-15' },
    { tag: 'AF-0002', name: 'Dell XPS 15',         cat: 'Laptops & Computers', status: 'AVAILABLE',         dept: null,            loc: 'Storage A', price: 1799, serial: 'DXP-A45678', purchase: '2022-08-10' },
    { tag: 'AF-0003', name: 'Standing Desk',        cat: 'Furniture',           status: 'ALLOCATED',         dept: 'Operations',    loc: 'Floor 2', price: 850, serial: 'FRN-B78901', purchase: '2021-03-20' },
    { tag: 'AF-0004', name: 'Toyota Camry 2022',   cat: 'Vehicles',            status: 'UNDER_MAINTENANCE', dept: 'Operations',    loc: 'Garage B', price: 28000, serial: 'VEH-C12345', purchase: '2022-01-05' },
    { tag: 'AF-0005', name: 'Epson Projector 4K',  cat: 'A/V Equipment',       status: 'AVAILABLE',         dept: null,            loc: 'AV Room', price: 1200, serial: 'AV-D56789', purchase: '2023-05-30' },
    { tag: 'AF-0006', name: 'iPhone 14 Pro',        cat: 'Mobile Devices',      status: 'ALLOCATED',         dept: 'Marketing',     loc: 'Floor 4', price: 999, serial: 'MOB-E90123', purchase: '2023-09-22' },
    { tag: 'AF-0007', name: 'HP LaserJet Pro',      cat: 'Office Equipment',    status: 'AVAILABLE',         dept: null,            loc: 'Floor 1', price: 450, serial: 'OFC-F34567', purchase: '2021-11-12' },
    { tag: 'AF-0008', name: 'ThinkPad X1 Carbon',  cat: 'Laptops & Computers', status: 'RETIRED',           dept: null,            loc: 'Storage B', price: 0, serial: 'TPX-G78901', purchase: '2018-04-18' },
    { tag: 'AF-0009', name: 'Ergonomic Chair',      cat: 'Furniture',           status: 'ALLOCATED',         dept: 'Finance',       loc: 'Floor 5', price: 620, serial: 'FRN-H23456', purchase: '2022-06-30' },
    { tag: 'AF-0010', name: 'iPad Air 5th Gen',    cat: 'Mobile Devices',      status: 'LOST',              dept: 'HR',            loc: null, price: 749, serial: 'MOB-I67890', purchase: '2022-11-01' },
    { tag: 'AF-0011', name: 'Sony A7 IV Camera',   cat: 'A/V Equipment',       status: 'ALLOCATED',         dept: 'Marketing',     loc: 'Floor 4', price: 2800, serial: 'AV-J01234', purchase: '2023-03-14' },
    { tag: 'AF-0012', name: 'Conference Table',     cat: 'Furniture',           status: 'AVAILABLE',         dept: null,            loc: 'Conf Room A', price: 3200, serial: 'FRN-K45678', purchase: '2020-07-22' },
  ];

  const assets = {};
  for (const a of assetData) {
    const asset = await prisma.asset.upsert({
      where: { assetTag: a.tag },
      update: { name: a.name, status: a.status },
      create: {
        assetTag: a.tag, name: a.name,
        categoryId: cats[a.cat].id,
        status: a.status,
        departmentId: a.dept ? depts[a.dept]?.id : null,
        locationId: a.loc ? locations[a.loc]?.id : null,
        purchasePrice: a.price,
        serialNo: a.serial,
        purchaseDate: new Date(a.purchase),
      },
    });
    assets[a.tag] = asset;
  }
  console.log(`✅ ${assetData.length} assets`);

  // ─── Step 7: Allocations ─────────────────────────────────────────────────────
  const allocUser = users['manager@assetflow.io'];
  const allocationData = [
    { asset: 'AF-0001', user: 'user@assetflow.io',  dueDate: '2024-07-01' },
    { asset: 'AF-0003', user: 'bob@assetflow.io',   dueDate: null },
    { asset: 'AF-0006', user: 'eve@assetflow.io',   dueDate: '2024-09-25' },
    { asset: 'AF-0009', user: 'carol@assetflow.io', dueDate: null },
    { asset: 'AF-0011', user: 'eve@assetflow.io',   dueDate: '2024-03-20' },
  ];

  const allocations = {};
  for (const a of allocationData) {
    const alloc = await prisma.allocation.create({
      data: {
        assetId: assets[a.asset].id,
        userId: users[a.user].id,
        allocatedById: allocUser.id,
        dueDate: a.dueDate ? new Date(a.dueDate) : null,
        status: 'ACTIVE',
      },
    });
    allocations[a.asset] = alloc;
  }
  console.log(`✅ ${allocationData.length} allocations`);

  // ─── Step 8: Transfer Requests ───────────────────────────────────────────────
  await prisma.transferRequest.createMany({
    data: [
      {
        allocationId: allocations['AF-0001'].id,
        assetId: assets['AF-0001'].id,
        fromUserId: users['user@assetflow.io'].id,
        toUserId: users['henry@assetflow.io'].id,
        requestedById: users['head@assetflow.io'].id,
        status: 'PENDING',
        reason: 'Henry needs laptop for new project',
      },
      {
        allocationId: allocations['AF-0006'].id,
        assetId: assets['AF-0006'].id,
        fromUserId: users['eve@assetflow.io'].id,
        toUserId: users['iris@assetflow.io'].id,
        requestedById: users['eve@assetflow.io'].id,
        status: 'APPROVED',
        approvedById: users['manager@assetflow.io'].id,
        reason: 'Iris rejoining, needs a phone',
      },
    ],
  });
  console.log('✅ 2 transfer requests');

  // ─── Step 9: Bookings ────────────────────────────────────────────────────────
  const futureBase = new Date();
  futureBase.setDate(futureBase.getDate() + 3); // 3 days from now
  const d = (offsetDays, hour, minute = 0) => {
    const dt = new Date(futureBase);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(hour, minute, 0, 0);
    return dt;
  };

  await prisma.booking.createMany({
    data: [
      {
        resourceId: resources['Conference Room A'].id,
        userId: users['head@assetflow.io'].id,
        startTime: d(0, 9), endTime: d(0, 11),
        purpose: 'Sprint Planning', status: 'CONFIRMED',
      },
      {
        resourceId: resources['Epson Projector 4K'].id,
        userId: users['eve@assetflow.io'].id,
        startTime: d(0, 14), endTime: d(0, 16),
        purpose: 'Client Presentation', status: 'CONFIRMED',
      },
      {
        resourceId: resources['Conference Room B'].id,
        userId: users['bob@assetflow.io'].id,
        startTime: d(1, 10), endTime: d(1, 12),
        purpose: 'Operations Review', status: 'CONFIRMED',
      },
      {
        resourceId: resources['Sony A7 IV Camera'].id,
        userId: users['user@assetflow.io'].id,
        startTime: d(3, 13), endTime: d(3, 15),
        purpose: 'Product Photoshoot', status: 'CONFIRMED',
      },
      {
        resourceId: resources['Training Room'].id,
        userId: users['admin@assetflow.io'].id,
        startTime: d(2, 9), endTime: d(2, 17),
        purpose: 'All-hands meeting', status: 'CONFIRMED',
      },
    ],
  });
  console.log('✅ 5 bookings');

  // ─── Step 10: Maintenance Requests ───────────────────────────────────────────
  await prisma.maintenanceRequest.createMany({
    data: [
      {
        assetId: assets['AF-0004'].id,
        requestedById: users['bob@assetflow.io'].id,
        technicianId: users['manager@assetflow.io'].id,
        approvedById: users['manager@assetflow.io'].id,
        issue: 'Engine service overdue',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        estimatedCost: 1200,
      },
      {
        assetId: assets['AF-0001'].id,
        requestedById: users['user@assetflow.io'].id,
        technicianId: users['manager@assetflow.io'].id,
        approvedById: users['manager@assetflow.io'].id,
        issue: 'Battery draining fast',
        priority: 'MEDIUM',
        status: 'APPROVED',
        estimatedCost: 200,
      },
      {
        assetId: assets['AF-0007'].id,
        requestedById: users['carol@assetflow.io'].id,
        issue: 'Paper jam frequently',
        priority: 'LOW',
        status: 'PENDING',
        estimatedCost: 80,
      },
      {
        assetId: assets['AF-0005'].id,
        requestedById: users['head@assetflow.io'].id,
        technicianId: users['manager@assetflow.io'].id,
        approvedById: users['manager@assetflow.io'].id,
        issue: 'Lamp needs replacement',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        estimatedCost: 350,
        resolvedAt: new Date(),
      },
      {
        assetId: assets['AF-0003'].id,
        requestedById: users['bob@assetflow.io'].id,
        issue: 'Motor making noise on raise',
        priority: 'LOW',
        status: 'PENDING',
        estimatedCost: 150,
      },
    ],
  });
  console.log('✅ 5 maintenance requests');

  // ─── Step 11: Audit Cycles ───────────────────────────────────────────────────
  const auditCycle1 = await prisma.auditCycle.create({
    data: {
      name: 'Q4 2023 Physical Audit',
      scope: { allAssets: true },
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-31'),
      status: 'CLOSED',
      closedAt: new Date('2023-12-31'),
      createdById: users['manager@assetflow.io'].id,
      auditors: { create: [{ userId: users['manager@assetflow.io'].id }] },
      items: {
        create: [
          { assetId: assets['AF-0001'].id, status: 'VERIFIED', updatedById: users['manager@assetflow.io'].id },
          { assetId: assets['AF-0003'].id, status: 'VERIFIED', updatedById: users['manager@assetflow.io'].id },
          { assetId: assets['AF-0010'].id, status: 'MISSING', notes: 'Cannot locate - HR dept', updatedById: users['manager@assetflow.io'].id },
        ],
      },
    },
  });

  await prisma.auditCycle.create({
    data: {
      name: 'Q1 2024 IT Assets Audit',
      scope: { categoryIds: [cats['Laptops & Computers'].id] },
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-31'),
      status: 'OPEN',
      createdById: users['manager@assetflow.io'].id,
      auditors: {
        create: [
          { userId: users['manager@assetflow.io'].id },
          { userId: users['head@assetflow.io'].id },
        ],
      },
      items: {
        create: [
          { assetId: assets['AF-0001'].id, status: 'VERIFIED', updatedById: users['manager@assetflow.io'].id },
          { assetId: assets['AF-0002'].id, status: 'VERIFIED', updatedById: users['manager@assetflow.io'].id },
          { assetId: assets['AF-0008'].id, status: 'DAMAGED', notes: 'Cracked screen, ready for disposal', updatedById: users['head@assetflow.io'].id },
        ],
      },
    },
  });
  console.log('✅ 2 audit cycles');

  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('  admin@assetflow.io    / password  (ADMIN)');
  console.log('  manager@assetflow.io  / password  (ASSET_MANAGER)');
  console.log('  head@assetflow.io     / password  (DEPARTMENT_HEAD)');
  console.log('  user@assetflow.io     / password  (EMPLOYEE)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
