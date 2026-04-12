# Feature Guide

## Authentication

- Entry: `src/app/index.tsx`, `src/app/auth/login-screen.tsx`, `src/app/auth/register-screen.tsx`, `src/app/auth/register-otp-screen.tsx`
- Session: `AuthContext` gates navigation after Zustand rehydration; JWT and user live in `AuthStore` (persist key `user-store`) so `SkaftinClient` can send `Authorization: Bearer`.
- With `STATIC_DATA_MODE === true` (`src/constants/AppConfig.ts`), `authService` uses stubs. With `false`, login uses `POST /app-api/auth/auth/login`, register uses `POST /app-api/auth/auth/register`, OTP verification uses `POST /app-api/auth/auth/verify-otp` with `{ user_id, otp }`, and OTP resend uses `POST /app-api/auth/auth/resend-otp` (see `client-sdk-mobile/requests/01-AUTH-REQUESTS.md`).
- Expo Router auth screens (`register-screen` → `register-otp-screen`) call `POST /app-api/auth/auth/register` then, when the API does not return a session, continue with OTP using `user_id` from the response body or top-level JSON. Verify uses `POST /app-api/auth/auth/verify-otp` with `{ user_id, otp }` where `otp` is a **string** (trimmed); resend uses `POST /app-api/auth/auth/resend-otp` with `{ user_id }`.
- `register-otp-screen`: if verify-otp returns a full session in `data`, it is stored in `AuthStore`. If `data` is empty but `success` is true (common), the app signs in with the password kept in memory between register and OTP (`registrationPendingLogin`), then navigates home; if that login fails or credentials were lost, it sends the user to the login screen.
- Legacy React Navigation auth screens (`src/pages/auth/RegistrationScreen.tsx`, `src/pages/auth/RegistrationOtpScreen.tsx`) also follow the backend register and OTP continuation flow.

## Dashboard (Home)

- File: `src/app/(tabs)/index.tsx`, screen: `src/pages/home/HomeScreen.tsx`
- Fixed header (greeting + vehicle count + garage shortcut) sits above a scrollable content area
- Vehicle carousel uses `VehicleSummaryItem` (`src/components/items/VehicleSummaryItem.tsx`) with `variant="full"` — shows status badge, odometer/registration/year stats, next service, license disk, and health checks
- Alert banners appear below the header for the active vehicle when license disk is expired/expiring or parts are overdue; link to `/log/license-disk` and `/reminders`
- Quick Log grid at the bottom shortcuts to fuel, service, odometer, and license disk logging routes
- Status constants (`STATUS_COLOR`, `STATUS_BG`, `STATUS_LABEL`) and shared helpers (`getDiskDaysLeft`, `getNextService`, `getStatusLevel`) live in `VehicleSummaryItem` and `src/constants/Constants.ts`

## Garage

- File: `src/app/(tabs)/garage.tsx`
- Add/delete/select vehicles
- Vehicle creation includes make/model/year picker and metadata fields
- Enforces free-tier cap (2 vehicles)
- Tapping a vehicle card sets active vehicle and navigates to `/vehicle-details`

## Vehicle Details

- Route: `/vehicle-details` via `src/app/vehicle-details.tsx`
- Feature screen: `src/pages/home/garage/subpages/VehicleDetailsPage.tsx`
- Shows active vehicle metrics, quick log actions, service interval preview, checks summary, recent activity
- Service quick action opens `/service-details`

## Service Details

- Route: `/service-details` via `src/app/service-details.tsx`
- Feature screen: `src/pages/home/garage/subpages/ServiceDetailsPage.tsx`
- Displays service interval status and recent service/repair history
- Includes explicit actions:
  - Log Service -> `/log/service?type=service`
  - Log Repair -> `/log/service?type=repair`

## Service Log

- Route export: `src/app/log/service.tsx`
- Primary implementation: `src/pages/home/log/service.tsx`
- In `service` mode, grouped checkboxes are rendered from `SERVICE_ITEM_CATALOG` in `src/constants/Constants.ts`
- Checked item labels plus optional typed description are merged and saved into `service_logs.description`
- Selected checklist items are also stored in `service_logs_items` for direct item-based history queries
- In `repair` mode, grouped checkboxes are rendered from `REPAIR_ITEM_CATALOG`; selected items are saved into `repair_logs_items` for item-based repair history queries
- The reference table `service_items` is documented in `docs/03-database/service-items.md`; current app source of truth stays constants

## Logbook

- File: `src/app/(tabs)/logbook.tsx`
- Unified timeline for:
  - Service/repair logs
  - Fuel logs
  - Odometer logs
- Filter chips for All, Service, Fuel, Odometer
- Quick add shortcuts to modal logging routes

## Checks

- File: `src/app/(tabs)/checks.tsx`
- Tracks latest timestamp for:
  - Oil
  - Tyre pressure
  - Coolant
  - Spare wheel
  - Lights
- Displays "all up to date" state when all checks are recent
- Uses active vehicle only (vehicle selector removed)
- Includes header back button for nested navigation flow

## Fuel Log

- Primary implementation: `src/pages/home/garage/subpages/FuelLogScreen.tsx`
- Route export: `src/app/log/fuel.tsx`
- Legacy screen path `src/pages/home/log/fuel.tsx` re-exports the garage subpage implementation

## Reminders

- Entry: tab route and `/reminders` route (`src/app/reminders.tsx`)
- Underlying feature screen: `src/features/reminders/screens/RemindersScreen.tsx`
- Supports part life rule creation and computed reminders (ok/warning/due)

## Profile

- File: `src/app/(tabs)/profile.tsx`
- Account summary and edit account navigation
- Reminders shortcut
- App actions (about/rate/share/feedback/sign out)
- Sign out clears session, navigates to splash (`/`), then routes to login (`/login`)
- Coming-soon cards for future partner and premium capabilities
