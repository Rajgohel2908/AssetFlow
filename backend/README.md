# AssetFlow — Backend API

A secure, role-based REST API built with **Node.js + Express + Prisma + PostgreSQL (Neon)**.

## Stack

| Tech | Purpose |
|---|---|
| Node.js + Express | HTTP server |
| Prisma ORM | Type-safe DB queries |
| PostgreSQL (Neon) | Cloud database |
| JWT | Access (15 min) + Refresh (7d, rotated) |
| bcryptjs | Password hashing |
| Zod | Runtime request validation |
| node-cron | Overdue allocation job (hourly) |
| csv-stringify | CSV export |

## Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Edit `backend/.env` and replace the `DATABASE_URL` with your Neon connection string:
```
DATABASE_URL="postgresql://USER:PASSWORD@your-project.neon.tech/assetflow?sslmode=require"
```
Get your connection string from [console.neon.tech](https://console.neon.tech).

### 3. Push schema to Neon
```bash
npm run db:push
```

### 4. Seed demo data
```bash
npm run db:seed
```

### 5. Start the dev server
```bash
npm run dev
```

Server runs on `http://localhost:5000`.

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| `admin@assetflow.io` | `password` | ADMIN |
| `manager@assetflow.io` | `password` | ASSET_MANAGER |
| `head@assetflow.io` | `password` | DEPARTMENT_HEAD |
| `user@assetflow.io` | `password` | EMPLOYEE |

---

## API Overview

Base URL: `http://localhost:5000/api`

### Auth
| Method | Path | Auth |
|---|---|---|
| POST | `/auth/signup` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Cookie |
| POST | `/auth/logout` | Cookie |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |
| GET | `/auth/me` | Bearer |

### Organization (P0)
| Method | Path | Min Role |
|---|---|---|
| GET/POST/PUT/DELETE | `/departments` | ADMIN (write) |
| GET/POST/PUT/DELETE | `/asset-categories` | ASSET_MANAGER (write) |
| GET | `/employees` | DEPARTMENT_HEAD |
| PATCH | `/employees/:id/role` | **ADMIN only** |
| PATCH | `/employees/:id/status` | ADMIN |

### Assets (P0)
| Method | Path | Min Role |
|---|---|---|
| GET | `/assets` | Any |
| GET | `/assets/:id` | Any |
| GET | `/assets/:id/history` | Any |
| POST | `/assets` | ASSET_MANAGER |
| PUT | `/assets/:id` | ASSET_MANAGER |
| PATCH | `/assets/:id/status` | ASSET_MANAGER |
| DELETE | `/assets/:id` | ADMIN |

### Allocations (P0)
| Method | Path | Notes |
|---|---|---|
| POST | `/allocations` | ASSET_MANAGER; 409 with `currentHolder` if not AVAILABLE |
| POST | `/allocations/:id/return` | Owner or ASSET_MANAGER |
| GET | `/allocations` | Employee sees own only |

### Transfer Requests (P0)
| Method | Path | Min Role |
|---|---|---|
| GET/POST | `/transfer-requests` | Any |
| PATCH | `/transfer-requests/:id/approve` | DEPARTMENT_HEAD |
| PATCH | `/transfer-requests/:id/reject` | DEPARTMENT_HEAD |

### Resource Booking (P1)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/bookings` | 409 on overlap (strict `<`/`>`) |
| PATCH | `/bookings/:id/cancel` | Owner or ASSET_MANAGER |
| PATCH | `/bookings/:id/reschedule` | Owner or ASSET_MANAGER |
| GET/POST/PUT/DELETE | `/resources` | ASSET_MANAGER (write) |

### Maintenance (P1)
| Method | Path | Min Role |
|---|---|---|
| GET/POST | `/maintenance-requests` | Any (POST) |
| PATCH | `/maintenance-requests/:id/approve` | ASSET_MANAGER |
| PATCH | `/maintenance-requests/:id/assign-technician` | ASSET_MANAGER |
| PATCH | `/maintenance-requests/:id/resolve` | ASSET_MANAGER |

### Audit (P1)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/audit-cycles` | ASSET_MANAGER (POST) |
| PATCH | `/audit-cycles/:id/items/:assetId` | Auditors |
| POST | `/audit-cycles/:id/close` | Irreversible — locks cycle |

### Dashboard & Reports (P2)
| Method | Path | Min Role |
|---|---|---|
| GET | `/dashboard/kpis` | DEPARTMENT_HEAD |
| GET | `/dashboard/quick-stats` | DEPARTMENT_HEAD |
| GET | `/reports/utilization` | ASSET_MANAGER |
| GET | `/reports/maintenance-frequency` | ASSET_MANAGER |
| GET | `/reports/department-summary` | ASSET_MANAGER |
| GET | `/reports/booking-heatmap` | ASSET_MANAGER |
| GET | `/reports/export?type=assets\|allocations\|maintenance\|audit` | ASSET_MANAGER |

### Notifications & Activity Logs (P2)
| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | Current user only |
| PATCH | `/notifications/:id/read` | — |
| PATCH | `/notifications/read-all` | — |
| GET | `/activity-logs` | ASSET_MANAGER+ |

---

## Business Rules (enforced server-side)

| # | Rule |
|---|---|
| 1 | `POST /auth/signup` **never** accepts a `role` — always defaults to EMPLOYEE |
| 2 | Only `PATCH /employees/:id/role` can change roles, and only ADMIN can call it |
| 3 | Asset status transitions go through `stateTransitions.js` — no direct overwrites |
| 4 | Allocation conflict returns **409** with `currentHolder` name and contact |
| 5 | Booking overlap uses strict `<`/`>` — back-to-back slots (10:00–11:00, 11:00–12:00) **allowed** |
| 6 | Maintenance must be **APPROVED** before asset flips to UNDER_MAINTENANCE |
| 7 | Closing an audit cycle is **irreversible** — second close returns 409 |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      ← All 17 models + enums
│   └── seed.js            ← Demo data
├── src/
│   ├── lib/
│   │   └── prisma.js      ← Singleton Prisma client
│   ├── controllers/       ← 15 controllers
│   ├── routes/            ← 15 route files
│   ├── middleware/
│   │   ├── auth.js        ← JWT verify → req.user
│   │   └── rbac.js        ← requireRole / requireMinRole
│   ├── services/
│   │   ├── notification.service.js
│   │   ├── activityLog.service.js
│   │   └── overdue.cron.js   ← Hourly overdue check
│   ├── utils/
│   │   ├── stateTransitions.js  ← Asset state machine
│   │   ├── assetTagGenerator.js ← Postgres SEQUENCE
│   │   ├── overlapChecker.js    ← Booking overlap
│   │   └── apiError.js
│   ├── app.js             ← Express setup
│   └── server.js          ← Entry point
├── .env                   ← Your Neon URL + JWT secrets
└── package.json
```
