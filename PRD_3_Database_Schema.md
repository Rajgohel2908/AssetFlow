# PRD 3 — Database Schema Design (PostgreSQL)
**Project:** AssetFlow — Enterprise Asset & Resource Management System
**Owner:** Database/schema teammate
**Priority:** Finish this FIRST — every other PRD depends on these tables being locked early (hour 1-2 of the hackathon).

---

## 1. Objective
Design a normalized PostgreSQL schema that captures all relationships in the problem statement, enforces conflict/overlap rules at the database level where possible (constraints, indexes), and avoids painful refactors mid-hackathon.

## 2. Tech Notes
- Use an ORM: **Prisma** (recommended for speed + auto-generated migrations) or Sequelize.
- Use proper foreign keys everywhere — no polymorphic "any-type" columns. Where an entity can point to either a User or a Department (asset holder), use two nullable FK columns + a CHECK constraint ensuring exactly one is set.
- Use native Postgres `ENUM` types for status fields — cleaner than string columns with app-level validation only.

## 3. Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID / serial PK | |
| name, email, password_hash | text | email unique |
| role | ENUM(Employee, DepartmentHead, AssetManager, Admin) | default Employee. Only changed via one controlled endpoint |
| department_id | FK -> departments.id | nullable |
| status | ENUM(Active, Inactive) | |

### departments
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | text | |
| head_id | FK -> users.id | nullable |
| parent_department_id | FK -> departments.id (self-ref) | nullable, supports hierarchy |
| status | ENUM(Active, Inactive) | |

### asset_categories
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | text | e.g. Electronics, Furniture, Vehicles |

### category_custom_fields
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| category_id | FK -> asset_categories.id | |
| field_key | text | e.g. "warranty_period" |
| field_type | text | e.g. "number", "date", "text" |

> Separate table instead of a JSON blob keeps it queryable and Postgres-native. A `jsonb` column on `asset_categories` is a fine shortcut if short on time.

### assets
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name, serial_number | text | |
| asset_tag | text, unique | Auto-generated AF-0001 via a Postgres SEQUENCE, not string-parsing |
| category_id | FK -> asset_categories.id | |
| status | ENUM(Available, Allocated, Reserved, UnderMaintenance, Lost, Retired, Disposed) | |
| holder_user_id | FK -> users.id | nullable |
| holder_department_id | FK -> departments.id | nullable |
| acquisition_date | date | |
| acquisition_cost | numeric | reporting only, no accounting linkage |
| condition, location | text | |
| is_bookable | boolean | |

**Constraint:** `CHECK (NOT (holder_user_id IS NOT NULL AND holder_department_id IS NOT NULL))` - an asset is held by a user OR a department, never both.

### asset_tag_seq
A Postgres `SEQUENCE` (not a table). Use `nextval('asset_tag_seq')` and format as `'AF-' || LPAD(nextval('asset_tag_seq')::text, 4, '0')`.

### allocations
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| asset_id | FK -> assets.id | |
| holder_user_id | FK -> users.id | nullable |
| holder_department_id | FK -> departments.id | nullable |
| allocated_date, expected_return_date, returned_date | date | |
| condition_checkin_notes | text | filled on return |
| status | ENUM(Active, Returned, Overdue) | |

### transfer_requests
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| asset_id | FK -> assets.id | |
| from_holder_user_id / from_holder_department_id | FK, nullable | |
| to_holder_user_id / to_holder_department_id | FK, nullable | |
| status | ENUM(Requested, Approved, Rejected, Reallocated) | |
| requested_by_id, approved_by_id | FK -> users.id | |

### bookings
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| resource_id | FK -> assets.id (where is_bookable=true) | |
| booked_by_id | FK -> users.id | |
| start_time, end_time | timestamptz | Index this pair |
| status | ENUM(Upcoming, Ongoing, Completed, Cancelled) | |

**Overlap constraint (does it right at the DB level):** use a Postgres exclusion constraint with the `btree_gist` extension:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status != 'Cancelled');
```

This makes the database itself reject overlapping bookings, no race conditions even under concurrent requests. If short on time, do the overlap check in application code instead (`start_time < newEnd AND end_time > newStart`), but the constraint is the more "clean architecture" flex for judges.

### maintenance_requests
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| asset_id | FK -> assets.id | |
| raised_by_id | FK -> users.id | |
| issue_description, priority, photo_url | text | |
| status | ENUM(Pending, Approved, Rejected, TechnicianAssigned, InProgress, Resolved) | |
| technician_id | FK -> users.id | nullable |
| approved_by_id | FK -> users.id | nullable |

### audit_cycles
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| department_id | FK -> departments.id | nullable (scope) |
| location | text | nullable (scope) |
| date_range_start, date_range_end | date | |
| status | ENUM(Open, Closed) | |

### audit_cycle_auditors (junction table, many-to-many)
| Column | Type | Notes |
|---|---|---|
| audit_cycle_id | FK -> audit_cycles.id | |
| user_id | FK -> users.id | |
| PK | (audit_cycle_id, user_id) | composite key |

### audit_items
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| audit_cycle_id | FK -> audit_cycles.id | |
| asset_id | FK -> assets.id | |
| result | ENUM(Verified, Missing, Damaged) | |
| notes | text | |

### notifications
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK -> users.id | |
| type | text | |
| message | text | |
| read | boolean | default false |
| created_at | timestamptz | |

### activity_logs
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| actor_id | FK -> users.id | |
| action | text | |
| entity_type | text | |
| entity_id | uuid/int | |
| timestamp | timestamptz | |

## 4. Indexing Priorities
- `assets`: index on `asset_tag`, `serial_number`, `status`, `category_id`, `location`
- `bookings`: GiST index (from the exclusion constraint above) covers overlap checks; also index `resource_id`
- `allocations`: index on `expected_return_date` for overdue queries
- `notifications`: composite index on `(user_id, read)`

## 5. Relationship Diagram
Deliver an ERD (mermaid.js `erDiagram`, or export from your Postgres tool / dbdiagram.io) showing all foreign keys above — shared reference doc for backend and frontend teammates.

## 6. Deliverables
- Prisma schema (`schema.prisma`) or SQL migration files for all tables above
- Seed script with sample data across every table
- ERD diagram shared with the team by hour 2

## 7. Out of Scope
- Read replicas / sharding (single Postgres instance is fine for a hackathon)
- Full-text search extensions (basic `ILIKE`/indexed filtering is sufficient at this scale)
