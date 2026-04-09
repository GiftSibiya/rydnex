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
| `license_fees` | integer nullable | |
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

- **service_logs**: `service_type`, `service_km`, `service_date`, `workshop_name`, `cost`, `notes`
- **repair_logs**: `repair_type`, `repair_km`, `repair_date`, `cost`, `notes`

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

## API routes (app client)

Table CRUD uses Skaftin paths:

- `vehicles`: `/app-api/database/tables/vehicles/{select|insert|update|delete}`
- Each maintenance table: `/app-api/database/tables/<table_name>/{select|insert|update|delete}`

See [`src/constants/ApiRoutes.ts`](../../src/constants/ApiRoutes.ts).

## Naming note

The database, API, and `src/fixtures/vehicles.json` all use **`registration`** for the licence plate. Older code or copies may still say `registration_number`; treat that as the same concept with the wrong column name.
