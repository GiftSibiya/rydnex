# Data and Storage

## Domain Models

Two model sets are present:

- Context models in `src/contexts/VehicleContext.tsx` (string ids, context-specific shape)
- API-style models in `src/types/Types.ts` (numeric ids, repository shape)

When adding fields, update the model set used by the target flow instead of mixing schemas.

Skaftin-backed vehicle rows use the column **`registration`** (licence plate). Repository/fixture types use the same name; avoid `registration_number` for new code.

## Static Fixtures

Seed files in `src/fixtures/*.json` include:

- `vehicles.json`
- `odometerLogs.json`
- `serviceLogs.json`
- `repairLogs.json`
- `fuelLogs.json`
- `vehicleChecks.json`
- `partRules.json`
- `partReminders.json`

`src/fixtures/staticData.ts` clones these into `staticDataStore` for mutable in-memory operations.

## Repository Behavior

`src/backend/repositories/VehicleRepository.ts`:

- Returns typed `ApiResponseType<T>` wrappers
- Reads/writes to `staticDataStore` in static mode
- Recalculates part reminders when odometer logs or part rules change

## AsyncStorage Keys (Context Path)

Vehicle context persistence keys:

- `rydnex_vehicles`
- `rydnex_active_vehicle`
- `rydnex_odometer_logs`
- `rydnex_fuel_logs`
- `rydnex_service_logs`
- `rydnex_last_checks`
- `rydnex_part_rules`
- `rydnex_license_disks`
- `rydnex_fuel_prices_cache` — last fetched inland `fuel_prices` map (see [fuel-prices.md](../03-database/fuel-prices.md))

Service checklist catalog references:

- App source: `SERVICE_ITEM_CATALOG` in `src/constants/Constants.ts`
- DB mirror table: `service_items` (see `docs/03-database/service-items.md`)

## Session (auth)

- JWT and user profile for API calls are stored in the Zustand persist slice `user-store` (`src/stores/data/AuthStore.ts`). `AuthContext` reads hydration and the same store so Expo Router gating and `SkaftinClient` Bearer injection stay aligned.
- With `STATIC_DATA_MODE === false`, login and registration call Skaftin `/app-api/auth/*` via `authService` and populate that store.
- The legacy AsyncStorage key `rydnex_auth` is no longer the source of truth for signed-in state in the Expo Router flow.

## Free Tier Rules

Current free-tier limit is 2 vehicles (implemented in both context and store flows).

## Vehicle Catalog CSV Pipeline

- Source catalog data lives in `assets/json/vehicle*.json`.
- Export command `npm run export:vehicle-csv` converts those JSON assets into import-ready CSVs under `assets/csv/vehicle-catalog/`.
- Full DB table mapping and manual import order are documented in `docs/03-database/vehicle-catalog-import.md`.
- Vehicle picker runtime now fetches catalog records from DB-backed tables (`vehicle_makes_catalog`, `vehicle_models_catalog`, `vehicle_trims_catalog`) via Skaftin table select routes, with JSON assets as fallback.

## Efficiency and Reminder Calculations

Core utility file: `src/features/efficiency/utils/efficiency.ts`

- `calculateKmPerLitre`
- `calculateCostPerKm`
- `calculatePartReminders`

Existing tests: `src/features/efficiency/utils/efficiency.spec.ts`
