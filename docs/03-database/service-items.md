# service_items (reference catalog)

Static checklist of common **service parts and tasks**. Seeded to match [`SERVICE_ITEM_CATALOG`](../../src/constants/Constants.ts) (`item.id` = `slug`). The mobile app reads the catalog from **Constants** in v1; this table supports admin tools and future API-driven lists.

## Table: `service_items`

| Column | Type | Notes |
|--------|------|--------|
| `id` | serial PK | |
| `slug` | varchar(100) NOT NULL UNIQUE | Stable key; matches catalog item `id` |
| `name` | varchar(100) NOT NULL | Display label |
| `category` | varchar(50) NOT NULL | e.g. `engine_fluids`, `wear_tear`, `ignition`, `electrical`, `tyres_alignment`, `cooling_air` |
| `default_interval_km` | int NULL | Suggested km interval (optional) |
| `default_interval_months` | int NULL | Suggested month interval (optional) |
| `created_at` | timestamptz NOT NULL, default now() | |

Odometer for a specific vehicle belongs on **`service_logs.service_km`** or **`parts_life_rules`**, not on this catalog.

## API

- `POST /app-api/database/tables/service_items/select` — list/filter rows when the app switches to server-driven catalog.

See [`routes.reference.serviceItems`](../../src/constants/ApiRoutes.ts).

## Service log UI

[`ServiceLogScreen`](../../src/pages/home/log/service.tsx) composes ticked item **names** plus optional free text into `service_logs.service_type` via `buildServiceDescriptionFromSelection`.
