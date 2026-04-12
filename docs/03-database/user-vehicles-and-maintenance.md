# User vehicles and maintenance (Skaftin)

This document describes project tables that store **per-user vehicles** and **maintenance data** linked to those vehicles. Catalog reference tables (`vehicle_*_catalog`) are documented in [vehicle-catalog-import.md](./vehicle-catalog-import.md).

## `vehicles`

One row per vehicle owned by an app user.

| Column | Type | Notes |
|--------|------|--------|
| `id` | integer PK | |
| `user_id` | integer NOT NULL | App user id from Skaftin auth |
| `make`, `model` | varchar(100) NOT NULL | Display / identity (may mirror catalog labels) |
| `year` | varchar(10) nullable | |
| `trim` | varchar(100) nullable | |
| `vin` | varchar(50) nullable | |
| `registration` | varchar(50) nullable | **Licence plate** (not `registration_number`) |
| `color` | varchar(50) nullable | |
| `current_odometer` | integer NOT NULL, default 0 | Snapshot for UI; history lives in `odometer_logs` |
| `is_active` | boolean NOT NULL, default true | |
| `notes` | text nullable | Optional |
| `engine` | varchar(100) nullable | Optional |
| **License disk (denormalised on vehicle)** | | Simple path: no separate disk table |
| `license_expiry_date` | timestamptz nullable | |
| `license_engine_number` | varchar(100) nullable | |
| `license_fees` | numeric(12,2) nullable | Decimal fee amount (not currency-formatted in UI) |
| `license_test_date` | date nullable | |
| `license_disk_number` | varchar(100) nullable | |
| `created_at`, `updated_at` | timestamptz NOT NULL | |

Deleting a vehicle row **cascades** to all child tables below (FK `ON DELETE CASCADE`).

## Maintenance tables

All use `vehicle_id` → `vehicles.id`.

### `odometer_logs`

| Column | Type |
|--------|------|
| `id` | serial PK |
| `vehicle_id` | integer FK |
| `reading_km` | integer NOT NULL |
| `logged_at` | timestamptz NOT NULL |
| `note` | text nullable |

### `fuel_logs`

| Column | Type |
|--------|------|
| `id` | serial PK |
| `vehicle_id` | integer FK |
| `odometer_km` | integer NOT NULL |
| `litres` | numeric(10,2) NOT NULL |
| `cost` | numeric(12,2) NOT NULL |
| `fuel_level_percent` | integer nullable |
| `logged_at` | timestamptz NOT NULL |

### `service_logs` / `repair_logs`

Service and repair are separate tables; the app maps them into a single UI list with ids prefixed `s-` / `r-`.

- **service_logs**: `description`, `service_km`, `service_date`, `workshop_name`, `cost`, `notes`
- **repair_logs**: `repair_type`, `repair_km`, `repair_date`, `cost`, `notes`
- Detailed service schema and join-table usage: [`service-logs.md`](./service-logs.md)

### `service_logs_items`

Join table from service log entries to service catalog items.

| Column | Type |
|--------|------|
| `id` | serial PK |
| `service_log_id` | integer FK -> `service_logs.id` |
| `service_item_id` | integer FK -> `service_items.id` |
| `created_at` | timestamptz NOT NULL default `now()` |

Constraint: unique pair on (`service_log_id`, `service_item_id`).

Migration note: legacy `service_logs.service_type` text was backfilled into `service_logs.description`; existing rows are not auto-linked in `service_logs_items`.

### `repair_logs_items`

Join table from repair log entries to repair catalog items.

| Column | Type |
|--------|------|
| `id` | serial PK |
| `repair_log_id` | integer FK -> `repair_logs.id` |
| `repair_item_id` | integer FK -> `repair_items.id` |
| `created_at` | timestamptz NOT NULL default `now()` |

Constraint: unique pair on (`repair_log_id`, `repair_item_id`).

### `vehicle_checks`

Row per check event (not a single wide row per vehicle). Latest row per `(vehicle_id, check_type)` drives “last check” UI.

- `check_type`: `oil`, `tyre_pressure`, `coolant`, `spare_wheel`, `lights`
- `status`: e.g. `good` | `attention` | `critical`
- `checked_at`, `note`

### `parts_life_rules`

| Column | Type |
|--------|------|
| `part_name` | varchar(200) |
| `last_change_km` | integer |
| `expected_life_km` | integer |
| `warning_threshold_km` | integer |
| `interval_days` | integer NOT NULL default 0 |
| `last_replaced_date` | date nullable |

### `part_reminders`

Defined for generated reminders; API routes exist under `routes.maintenance.partReminders`. The Garage `VehicleContext` may not sync this table yet.

### `vehicle_issues`

User-managed backlog (“look at later”) per vehicle: title, optional description, `open` / `resolved`, optional odometer when noted, optional `repair_item_id` link to `repair_items`. See [`vehicle-issues.md`](./vehicle-issues.md).

## API routes (app client)

Table CRUD uses Skaftin paths:

- `vehicles`: `/app-api/database/tables/vehicles/{select|insert|update|delete}`
- Each maintenance table: `/app-api/database/tables/<table_name>/{select|insert|update|delete}`

See [`src/constants/ApiRoutes.ts`](../../src/constants/ApiRoutes.ts).

Reference data for default fuel cost hints: [`fuel-prices.md`](./fuel-prices.md) (`fuel_prices` table, `routes.reference.fuelPrices`).

Service checklist catalog (seeded reference): [`service-items.md`](./service-items.md) (`service_items`, `routes.reference.serviceItems`; UI source of truth is `SERVICE_ITEM_CATALOG` in Constants until a fetch path is added).

## Naming note

The database, API, and `src/fixtures/vehicles.json` all use **`registration`** for the licence plate. Older code or copies may still say `registration_number`; treat that as the same concept with the wrong column name.
