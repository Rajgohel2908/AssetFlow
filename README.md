# ⚡ AssetFlow — Enterprise Asset & Resource Management ERP

AssetFlow is a production-ready, database-driven enterprise resource management application built to manage interconnected entities like departments, employees, assets, allocations, bookings, maintenance, and audits. It is optimized for speed, reliability, and clean UX.

---

## 🏗️ Tech Stack

* **Frontend**: React (Vite, React Router, TailwindCSS/PostCSS)
* **Backend**: Express.js (Node.js)
* **Database**: PostgreSQL (hosted via Neon DB)
* **ORM**: Prisma
* **Validation**: Zod (backend schemas)

---

## 🚀 Features & Business Logic Implemented

### 1. Dashboard
* Dynamically calculates KPIs: Total Assets, Allocated, Available, Under Maintenance, Overdue Returns.
* Dynamic charts for asset utilization trends.
* Real-time notifications and recent activity streams.

### 2. Asset Directory & Registration
* Full CRUD for assets.
* Synchronized custom sequence generator (`AF-xxxx`) ensuring zero duplicate asset tags.
* Image uploads and category lookups.

### 3. Allocations & Transfers
* Prevents duplicate allocations (checks if asset is already allocated).
* Implements department-to-employee transfer workflows.
* Real-time history tracking for allocations.

### 4. Resource Booking
* Supports booking room and equipment assets.
* Overlap checker algorithm ensures no double-bookings for the same time window.

### 5. Maintenance Board
* Interactive Kanban workflow (Pending -> Approved -> Technician Assigned -> In Progress -> Resolved).
* Automatically transitions the underlying asset state between `AVAILABLE` and `UNDER_MAINTENANCE`.

### 6. Asset Audit Cycle
* Dynamically generates audit cycles.
* Allows auditors to mark assets as `Verified`, `Missing`, or `Damaged`.
* Generates discrepancy reports and auto-transitions missing assets to the `LOST` status upon audit closure.

---

## 🛠️ Setup Instructions

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the `.env` file with your `DATABASE_URL` (Neon PostgreSQL) and JWT secrets.
4. Sync the database:
   ```bash
   npx prisma db push
   ```
5. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
6. Run the database seed:
   ```bash
   npm run db:seed
   ```
7. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:5173` (or `http://localhost:5174` if port 5173 is occupied).

---

## 👤 Quick Demo Accounts

You can log in instantly using the quick buttons on the sign-in screen:
* **Admin**: `admin@assetflow.io` (password: `password`)
* **Asset Manager**: `manager@assetflow.io` (password: `password`)
* **Department Head**: `head@assetflow.io` (password: `password`)
* **Employee**: `user@assetflow.io` (password: `password`)
