# vehicle_issues

Per-vehicle backlog for problems or follow-ups the user wants to revisit later (separate from completed service/repair log entries).

## Table: `vehicle_issues`

| Column | Type | Notes |
|--------|------|--------|
| `id` | serial PK | |
| `vehicle_id` | integer FK | References `vehicles.id`, `ON DELETE CASCADE` |
| `title` | varchar(200) NOT NULL | Short label |
| `description` | text nullable | Optional detail |
| `status` | varchar(20) NOT NULL default `open` | App uses `open` \| `resolved` |
| `noted_odometer_km` | integer nullable | Odometer when the issue was noted |
| `repair_item_id` | integer nullable FK | References `repair_items.id`, `ON DELETE SET NULL` (optional catalog link) |
| `created_at` | timestamptz NOT NULL default `now()` | |
| `updated_at` | timestamptz NOT NULL default `now()` | Set on each update from the app |
| `resolved_at` | timestamptz nullable | Set when status becomes `resolved`; cleared when reopened |

Indexes:

- `idx_vehicle_issues_vehicle_id_status` on (`vehicle_id`, `status`)
- `idx_vehicle_issues_vehicle_id_updated` on (`vehicle_id`, `updated_at` DESC)
- `idx_vehicle_issues_repair_item_id` on (`repair_item_id`)

## API routes

- `routes.maintenance.vehicleIssues` → `/app-api/database/tables/vehicle_issues/{select|insert|update|delete}`

See [`ApiRoutes.ts`](../../src/constants/ApiRoutes.ts).

## App usage

[`VehicleContext`](../../src/contexts/VehicleContext.tsx) loads issues with other maintenance data, caches them in AsyncStorage, and exposes CRUD helpers. UI: Garage stack screens under `src/app/garage/vehicle-issues.tsx` and `vehicle-issue-edit.tsx`, linked from [`vehicle-details-page`](../../src/app/garage/vehicle-details-page.tsx).
