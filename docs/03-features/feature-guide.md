# Feature Guide

## Authentication

- Entry: `src/app/index.tsx`, `src/app/login.tsx`, `src/app/register.tsx`, `src/app/register-otp.tsx`
- Session: `AuthContext` gates navigation after Zustand rehydration; JWT and user live in `AuthStore` (persist key `user-store`) so `SkaftinClient` can send `Authorization: Bearer`.
- With `STATIC_DATA_MODE === true` (`src/constants/AppConfig.ts`), `authService` uses stubs. With `false`, login uses `POST /app-api/auth/auth/login`, register uses `POST /app-api/auth/auth/register`, OTP verification uses `POST /app-api/auth/auth/verify-otp` with `{ user_id, otp }`, and OTP resend uses `POST /app-api/auth/auth/resend-otp` (see `client-sdk-mobile/requests/01-AUTH-REQUESTS.md`).
- Expo Router auth screens (`src/app/register.tsx`, `src/app/register-otp.tsx`) now initiate backend registration before OTP step routing; register returns OTP continuation metadata (`requiresOtp`, `userId`) used to continue verification.
- `src/app/register-otp.tsx` verifies codes via `POST /app-api/auth/auth/verify-otp` with `{ user_id, otp }`, supports resend via `POST /app-api/auth/auth/resend-otp`, and stores the verified session in `AuthStore`.
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
