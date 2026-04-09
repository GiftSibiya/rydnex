# fuel_prices (reference data)

National **retail fuel prices** by effective date, region, and fuel type. Used by the app to suggest cost per litre (v1: **inland** only; coastal rows may exist for future use).

Not tied to `vehicles`; rows are global reference data.

## Table: `fuel_prices`

| Column | Type | Notes |
|--------|------|--------|
| `id` | serial PK | |
| `effective_date` | date NOT NULL | Date the price applies (e.g. first Wednesday of the month) |
| `region` | varchar(20) NOT NULL | `inland` \| `coastal` (CHECK constraint) |
| `fuel_type` | varchar(50) NOT NULL | e.g. `petrol_93`, `petrol_95`, `diesel_50ppm`, `diesel_500ppm` |
| `price` | numeric NOT NULL | ZAR per litre |
| `created_at` | timestamptz NOT NULL, default now() | |

**Unique constraint:** `(effective_date, region, fuel_type)` — one row per combination.

## API

Same Skaftin table pattern as other tables:

- `POST /app-api/database/tables/fuel_prices/select` with body `{ "where": { "region": "inland" } }` (and optional filters).

Ensure **read** access is allowed for authenticated app users (RLS / roles in Skaftin).

## “Latest” prices in the app

1. Select rows for the desired region (`inland` in v1).
2. Compute the maximum `effective_date` among those rows (ISO date string comparison is sufficient).
3. Keep only rows where `effective_date` equals that maximum.
4. Build a map `fuel_type → price` for UI defaults (e.g. default cost/L uses `petrol_95` until vehicles store a preferred fuel type).

State lives in **`FuelPricesStore`** ([`src/stores/data/FuelPricesStore.ts`](../../src/stores/data/FuelPricesStore.ts)): `sync()` hydrates `rydnex_fuel_prices_cache` then refetches. [`FuelPricesSync`](../../src/components/boot/FuelPricesSync.tsx) runs `sync` when the auth session is active; the fuel log screen also calls `sync` on focus.
