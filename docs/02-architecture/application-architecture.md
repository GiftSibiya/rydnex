# Application Architecture

## High-Level Layout

- `src/app/*`: Expo Router route files (current primary UI entry path)
- `src/components/*`: reusable UI pieces and popups
- `src/contexts/*`: context-based app state and persistence
- `src/features/*`: feature modules (screens, utils, zustand store path)
- `src/backend/*`: repository + service abstractions
- `src/fixtures/*`: JSON seed fixtures and in-memory static store
- `src/themes/*` and `src/constants/*`: theming and design tokens

## Root Providers

`src/app/_layout.tsx` configures:

- Safe area provider
- Error boundary
- React Query client provider
- Gesture handler and keyboard providers
- Auth and Vehicle context providers

## Two Active State/Data Paths

The codebase currently has two parallel patterns:

1. **Context + persistence path**
   - `src/contexts/AuthContext.tsx` (Expo Router auth gate; delegates login/logout to `authService` + `AuthStore`)
   - `src/contexts/VehicleContext.tsx`
   - Used directly by many route screens under `src/app/(tabs)/*`
   - Vehicle state uses AsyncStorage keys; auth session uses Zustand persist (`user-store`) for JWT + user profile

2. **Zustand + Repository path**
   - `src/features/vehicles/store/useVehicleStore.ts`
   - `src/backend/repositories/VehicleRepository.ts`
   - `src/fixtures/staticData.ts`
   - Used by modular feature screens under `src/features/*`
   - Uses in-memory static fixture-backed repository operations

Both patterns are functional today. Contributors should stay consistent with the path used by the file they are editing.

## Backend/Repository Notes

- `src/backend/repositories/VehicleRepository.ts` exposes typed CRUD-like methods for vehicles, logs, checks, and reminders.
- In static mode, operations mutate `staticDataStore` and return `ApiResponseType<T>`.
- Reminder generation is recalculated from odometer logs + part rules using `calculatePartReminders`.

## Theming and UI

- Dark luxury palette from `src/constants/colors.ts`
- Shared cards/inputs/buttons under `src/components/elements/*`
- Screen-level wrappers in `src/shared/ui/*` for feature-module screens
