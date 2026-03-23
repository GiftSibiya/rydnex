# rydnex

Luxury-themed React Native vehicle information app built with Expo.

## MVP Features

- Vehicle profiles (VIN, registration, make/model) with free-tier limit of 2 cars.
- Odometer, service, repair, and fuel logging.
- Last checks logging (oil, tyre pressure, coolant, spare wheel, lights).
- Efficiency metrics (km/L and cost/km).
- Parts life rules and reminder generation.
- Unified logbook timeline.
- Profile with coming-soon placeholders for insurance and mechanic partner features.

## Architecture

- `App.tsx`: root providers and navigation bootstrap.
- `src/navigation/RootNavigator.tsx`: auth flow and main tabs.
- `src/features/*`: feature-first modules (auth, vehicles, maintenance, efficiency, reminders, logbook, profile).
- `src/backend/client/SkaftinClient.ts`: shared API client with auth header injection and retry-on-401.
- `src/backend/repositories/VehicleRepository.ts`: typed data access for vehicle domain.
- `src/stores/*`: auth/session and UI stores (zustand).
- `src/themes/*`: monochrome luxury design tokens + navigation theme bridge.

## Static JSON Mode (Current)

The app currently runs on local fixture data and does not require Skaftin for day-to-day UI development.

- Data source toggle: `src/constants/AppConfig.ts` (`STATIC_DATA_MODE`)
- Fixture files live in `src/fixtures/*.json`
- Typed fixture adapter: `src/fixtures/staticData.ts`
- Repository implementation: `src/backend/repositories/VehicleRepository.ts`
- Mock auth implementation: `src/backend/services/AuthService.ts`
- Login behavior: sign-in uses local mock session and routes into `MainTabs`/Dashboard.

You can adjust vehicles/logs/checks/reminder starter data by editing these JSON files:

- `src/fixtures/vehicles.json`
- `src/fixtures/odometerLogs.json`
- `src/fixtures/serviceLogs.json`
- `src/fixtures/repairLogs.json`
- `src/fixtures/fuelLogs.json`
- `src/fixtures/vehicleChecks.json`
- `src/fixtures/partRules.json`
- `src/fixtures/partReminders.json`

## Skaftin Setup (Prepared for Later Migration)

Environment variables in `.env`:

- `EXPO_PUBLIC_SKAFTIN_API_URL`
- `EXPO_PUBLIC_SKAFTIN_API_KEY`
- `EXPO_PUBLIC_SKAFTIN_ACCESS_TOKEN`
- `EXPO_PUBLIC_SKAFTIN_BUCKET_NAME`

Provisioned schema:

- `vehicles`
- `odometer_logs`
- `service_logs`
- `repair_logs`
- `fuel_logs`
- `vehicle_checks`
- `parts_life_rules`
- `part_reminders`
- `documents`

Storage bucket:

- `rydnex-documents`

## Run

```bash
npx expo start
```

## Tests and Checks

- Lint diagnostics: clean for changed files.
- Unit tests prepared for efficiency/reminder logic in `src/features/efficiency/utils/efficiency.spec.ts`.
- If local node tooling is available, run:

```bash
npm run test
npm run typecheck
```
