# PRD 1 — Frontend Design & UI/UX
**Project:** AssetFlow — Enterprise Asset & Resource Management System
**Owner:** Frontend teammate
**Depends on:** Backend PRDs (API contracts) — build against mock data first, wire up APIs as they land

---

## 1. Objective
Build a clean, responsive, role-aware UI for AssetFlow that makes a non-technical judge understand the product in under 60 seconds of screen time. Prioritize clarity over decoration — this is an ERP tool, not a marketing site.

## 2. Tech Stack
- React + Vite
- Tailwind CSS
- React Router (role-based route guards)
- Axios for API calls
- Chart library (Recharts or Chart.js) for Dashboard/Reports
- Optional: shadcn/ui or Headless UI for form primitives (modals, dropdowns, date pickers)

## 3. Design Principles
- One accent color + neutral grays. No gradients, no clutter.
- Every screen must clearly show: current role, current context (department/location), and primary action.
- Status values (Available, Allocated, Under Maintenance, Lost, Retired, Disposed) get consistent color-coded badges reused everywhere (table rows, cards, detail pages).
- Mobile-responsive is nice-to-have; desktop-first since this is an internal ops tool.

## 4. Screens to Build (in priority order)

| Priority | Screen | Key components |
|---|---|---|
| P0 | Login / Signup | Email+password form, forgot password link, error states |
| P0 | Dashboard | KPI cards (6), overdue-returns list, quick action buttons |
| P0 | Organization Setup (Admin) | 3-tab layout: Departments, Categories, Employee Directory (with promote-to-role action) |
| P0 | Asset Registration & Directory | Registration form, searchable/filterable table, asset detail drawer with history tabs |
| P0 | Asset Allocation & Transfer | Allocate form, conflict-block modal ("currently held by X" + Transfer button), transfer approval list |
| P1 | Resource Booking | Calendar view per resource, booking form with time slot picker, overlap-rejected state |
| P1 | Maintenance Management | Raise-request form, kanban-style status board (Pending → Approved → In Progress → Resolved) |
| P1 | Asset Audit | Create audit cycle form, auditor checklist (Verified/Missing/Damaged), discrepancy report view |
| P2 | Reports & Analytics | Charts: utilization trend, maintenance frequency, department allocation summary, export button |
| P2 | Activity Logs & Notifications | Notification bell dropdown, full activity log table with filters |

## 5. Role-Based UI Rules
- Employee: sees only their own allocations, can book resources, raise maintenance, request returns/transfers. No admin nav items visible.
- Department Head: adds department-scoped views + approve allocation/transfer requests.
- Asset Manager: adds asset registration, allocation, maintenance/transfer approval.
- Admin: full nav including Organization Setup and org-wide Reports.
- Hide nav items the role can't access — don't just disable them, remove them from the DOM.

## 6. Reusable Components (build these first, everything else composes from them)
- `StatusBadge` (color-coded per asset/booking/maintenance status)
- `DataTable` (sortable, filterable, paginated — reused across Asset Directory, Logs, Reports)
- `KPICard`
- `ConflictModal` (generic "blocked action, here's the alternative" pattern — reused for allocation conflicts and booking overlaps)
- `ApprovalWorkflowStepper` (visual progress: Pending → Approved → In Progress → Resolved)
- `RoleGuard` wrapper for route protection

## 7. Deliverables
- Fully clickable frontend (even with mock/stub API responses) by demo time
- At least P0 screens fully wired to real backend APIs
- One cohesive design system (colors, spacing, typography) applied consistently

## 8. Out of Scope
- Native mobile app
- Offline mode
- Multi-language support
