# Feature Guide

## Authentication

- Entry: `src/app/index.tsx` and `src/app/login.tsx`
- Local session stored via `AuthContext` + AsyncStorage
- Login requires basic valid email format; password is currently non-blocking for mock flow

## Dashboard (Home)

- File: `src/app/(tabs)/index.tsx`
- Shows active vehicle overview, efficiency summary, quick logging actions
- Highlights overdue parts rules and links to reminders
- Includes recent service/fuel activity cards
- Vehicle carousel card CTA opens `/vehicle-details`

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
- Coming-soon cards for future partner and premium capabilities
