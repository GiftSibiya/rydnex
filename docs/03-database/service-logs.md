# service_logs and service_logs_items

Service history is stored in two related tables:

- `service_logs`: one row per service event for a vehicle
- `service_logs_items`: join rows that link each service event to one or more `service_items`

This structure keeps `service_logs.description` human-readable while enabling reliable item-based queries (for example, "when was `oil_filter` last serviced for vehicle X?").

## Table: `service_logs`

| Column | Type | Notes |
|--------|------|--------|
| `id` | serial PK | |
| `vehicle_id` | integer FK | References `vehicles.id` |
| `description` | text nullable | Saved display summary text |
| `service_km` | integer NOT NULL | Odometer at service time |
| `service_date` | timestamptz NOT NULL | |
| `workshop_name` | varchar(200) nullable | |
| `cost` | numeric nullable | |
| `notes` | text nullable | |

## Table: `service_logs_items`

| Column | Type | Notes |
|--------|------|--------|
| `id` | serial PK | |
| `service_log_id` | integer FK | References `service_logs.id` (`ON DELETE CASCADE`) |
| `service_item_id` | integer FK | References `service_items.id` |
| `created_at` | timestamptz NOT NULL default `now()` | |

Constraints:

- unique pair: (`service_log_id`, `service_item_id`)

## Query pattern: last service for item on vehicle

1. Resolve item slug from `service_items` (`slug -> id`).
2. Read `service_logs_items` by `service_item_id`.
3. Filter to logs whose `service_log_id` belongs to `service_logs` rows for target `vehicle_id`.
4. Sort by `service_date` descending and take first row.

## API routes

- `routes.maintenance.serviceLogs` -> `/app-api/database/tables/service_logs/{select|insert|update|delete}`
- `routes.maintenance.serviceLogItems` -> `/app-api/database/tables/service_logs_items/{select|insert|update|delete}`
- `routes.reference.serviceItems` -> `/app-api/database/tables/service_items/{select|insert|update|delete}`

## Migration note

Legacy `service_logs.service_type` values were migrated into `service_logs.description`.
No automatic backfill into `service_logs_items` was performed for historic rows.
Item links are guaranteed for newly created service logs after normalization.
