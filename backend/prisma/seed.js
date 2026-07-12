/**
 * AssetFlow — Database Seed Script
 * Generates 50+ highly realistic assets and extensive history.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Massive AssetFlow Seed...\n');

  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 100 INCREMENT 1 MINVALUE 1 NO MAXVALUE CACHE 1;`
  );
  await prisma.$executeRawUnsafe(`SELECT setval('asset_tag_seq', 100, true);`);

  // ─── Departments ─────────────────────────────────────────────────────
  const deptNames = ['Product & Engineering', 'Cloud Infrastructure', 'Sales & Revenue', 'People Operations', 'Corporate Finance', 'Workplace Experience', 'Legal & Compliance', 'Customer Success'];
  const depts = {};
  for (const d of deptNames) {
    depts[d] = await prisma.department.upsert({ where: { name: d }, update: {}, create: { name: d, status: 'ACTIVE' } });
  }

  // ─── Users ───────────────────────────────────────────────────────────
  const hash = (p) => bcrypt.hash(p, 12);
  const pw = await hash('password');
  
  const usersData = [
    { name: 'Sarah Connor',   email: 'admin@assetflow.io',    role: 'ADMIN',           dept: 'Cloud Infrastructure' },
    { name: 'Marcus Wright',  email: 'manager@assetflow.io',  role: 'ASSET_MANAGER',   dept: 'Workplace Experience' },
    { name: 'Miles Dyson',    email: 'head@assetflow.io',     role: 'DEPARTMENT_HEAD', dept: 'Product & Engineering'},
    { name: 'Kyle Reese',     email: 'user@assetflow.io',     role: 'EMPLOYEE',        dept: 'Product & Engineering'},
    { name: 'John Connor',    email: 'jconnor@assetflow.io',  role: 'DEPARTMENT_HEAD', dept: 'Sales & Revenue'      },
    { name: 'Kate Brewster',  email: 'kbrewster@assetflow.io',role: 'ASSET_MANAGER',   dept: 'Corporate Finance'    },
    { name: 'Danny Dixon',    email: 'ddixon@assetflow.io',   role: 'DEPARTMENT_HEAD', dept: 'People Operations'    },
    { name: 'Grace Harper',   email: 'gharper@assetflow.io',  role: 'EMPLOYEE',        dept: 'People Operations'    },
    { name: 'Dani Ramos',     email: 'dramos@assetflow.io',   role: 'EMPLOYEE',        dept: 'Sales & Revenue'      },
    { name: 'Rev-9 Unit',     email: 'rev9@assetflow.io',     role: 'EMPLOYEE',        dept: 'Cloud Infrastructure' },
    { name: 'Alex Murphy',    email: 'amurphy@assetflow.io',  role: 'EMPLOYEE',        dept: 'Legal & Compliance'   },
    { name: 'Ellen Ripley',   email: 'eripley@assetflow.io',  role: 'DEPARTMENT_HEAD', dept: 'Customer Success'     },
  ];

  const users = {};
  const userArr = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, departmentId: depts[u.dept]?.id },
      create: { name: u.name, email: u.email, passwordHash: pw, role: u.role, departmentId: depts[u.dept]?.id, status: 'ACTIVE' },
    });
    users[u.email] = user;
    userArr.push(user);
  }

  // ─── Categories ──────────────────────────────────────────────
  const categoryData = [
    { name: 'Computing Devices', fields: [{ fieldKey: 'ram_gb', fieldType: 'number' }, { fieldKey: 'storage_gb', fieldType: 'number' }] },
    { name: 'Office Ergonomics', fields: [{ fieldKey: 'material', fieldType: 'text' }] },
    { name: 'Network Infrastructure', fields: [{ fieldKey: 'mac_address', fieldType: 'text' }] },
    { name: 'Video Conferencing', fields: [{ fieldKey: 'resolution', fieldType: 'text' }] },
    { name: 'Company Vehicles', fields: [{ fieldKey: 'license_plate', fieldType: 'text' }, { fieldKey: 'mileage_km', fieldType: 'number' }] },
    { name: 'Mobile Devices', fields: [{ fieldKey: 'imei', fieldType: 'text' }] },
  ];
  const cats = {};
  for (const c of categoryData) {
    const cat = await prisma.assetCategory.upsert({ where: { name: c.name }, update: {}, create: { name: c.name } });
    cats[c.name] = cat;
  }

  // ─── Assets (Generate 55 Assets) ──────────────────────────────────────────
  const assetModels = [
    { name: 'MacBook Pro 16" M3 Max', cat: 'Computing Devices', cost: 3499, isBookable: false },
    { name: 'MacBook Air M2 13"', cat: 'Computing Devices', cost: 1199, isBookable: false },
    { name: 'Dell XPS 15', cat: 'Computing Devices', cost: 1899, isBookable: false },
    { name: 'Lenovo ThinkPad X1', cat: 'Computing Devices', cost: 1699, isBookable: false },
    { name: 'Herman Miller Aeron Chair', cat: 'Office Ergonomics', cost: 1250, isBookable: false },
    { name: 'Steelcase Gesture Chair', cat: 'Office Ergonomics', cost: 1100, isBookable: false },
    { name: 'Uplift V2 Standing Desk', cat: 'Office Ergonomics', cost: 850, isBookable: false },
    { name: 'Cisco Meraki MR56 AP', cat: 'Network Infrastructure', cost: 1100, isBookable: false },
    { name: 'Ubiquiti UniFi U6-Pro', cat: 'Network Infrastructure', cost: 150, isBookable: false },
    { name: 'Logitech Rally Bar', cat: 'Video Conferencing', cost: 3999, isBookable: true },
    { name: 'Poly Studio X50', cat: 'Video Conferencing', cost: 2800, isBookable: true },
    { name: 'Tesla Model 3 Long Range', cat: 'Company Vehicles', cost: 52000, isBookable: false },
    { name: 'Ford Transit Connect', cat: 'Company Vehicles', cost: 34000, isBookable: false },
    { name: 'iPhone 15 Pro Max', cat: 'Mobile Devices', cost: 1199, isBookable: false },
    { name: 'Samsung Galaxy S23 Ultra', cat: 'Mobile Devices', cost: 1199, isBookable: false },
  ];

  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const locations = ['HQ - Floor 1', 'HQ - Floor 2', 'HQ - Floor 3', 'HQ - Floor 4', 'HQ - Storage', 'Data Center A', 'Field Ops'];
  const statuses = ['AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE', 'RETIRED'];

  const assetsList = [];
  for (let i = 1; i <= 55; i++) {
    const model = assetModels[i % assetModels.length];
    const status = statuses[i % statuses.length];
    
    // Assign holder if allocated
    let holderUserId = null;
    let holderDeptId = null;
    if (status === 'ALLOCATED') {
      if (i % 3 === 0) {
        holderDeptId = depts[deptNames[i % deptNames.length]].id;
      } else {
        holderUserId = userArr[i % userArr.length].id;
      }
    }

    const asset = await prisma.asset.create({
      data: {
        assetTag: `AF-0${100 + i}`,
        name: model.name,
        serialNumber: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        categoryId: cats[model.cat].id,
        status: status,
        holderUserId: holderUserId,
        holderDepartmentId: holderDeptId,
        acquisitionDate: new Date(Date.now() - Math.random() * 100000000000),
        acquisitionCost: model.cost,
        condition: conditions[i % conditions.length],
        location: locations[i % locations.length],
        isBookable: model.isBookable,
      },
    });
    assetsList.push(asset);
  }
  console.log(`✅ Generated ${assetsList.length} assets`);

  // Create Allocations for all allocated assets
  const allocatedAssets = assetsList.filter(a => a.status === 'ALLOCATED');
  for (const a of allocatedAssets) {
    await prisma.allocation.create({
      data: {
        assetId: a.id,
        holderUserId: a.holderUserId,
        holderDepartmentId: a.holderDepartmentId,
        allocatedDate: new Date(Date.now() - Math.random() * 10000000000),
        status: 'ACTIVE',
        expectedReturnDate: Math.random() > 0.5 ? new Date(Date.now() + 86400000 * 30) : null
      }
    });
  }

  // Create some Maintenance Requests
  const maintenanceAssets = assetsList.filter(a => a.status === 'UNDER_MAINTENANCE');
  for (const a of maintenanceAssets) {
    await prisma.maintenanceRequest.create({
      data: {
        assetId: a.id,
        raisedById: users['admin@assetflow.io'].id,
        technicianId: users['manager@assetflow.io'].id,
        issueDescription: 'Routine checkup and reported wear and tear.',
        priority: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
        status: 'IN_PROGRESS'
      }
    });
  }

  console.log('🎉 Massive Seed complete!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
