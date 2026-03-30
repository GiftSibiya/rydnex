# Data and Storage

## Domain Models

Two model sets are present:

- Context models in `src/contexts/VehicleContext.tsx` (string ids, context-specific shape)
- API-style models in `src/types/Types.ts` (numeric ids, repository shape)

When adding fields, update the model set used by the target flow instead of mixing schemas.

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

Auth context key:

- `rydnex_auth`

## Free Tier Rules

Current free-tier limit is 2 vehicles (implemented in both context and store flows).

## Efficiency and Reminder Calculations

Core utility file: `src/features/efficiency/utils/efficiency.ts`

- `calculateKmPerLitre`
- `calculateCostPerKm`
- `calculatePartReminders`

Existing tests: `src/features/efficiency/utils/efficiency.spec.ts`
