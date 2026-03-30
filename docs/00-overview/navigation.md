# Navigation Structure

## Router Type

The app uses Expo Router with a root stack (`src/app/_layout.tsx`) and a tab group (`src/app/(tabs)/_layout.tsx`).

## Root Stack

Defined in `src/app/_layout.tsx`.

- `index` -> splash/get-started entry
- `login` -> login screen
- `(tabs)` -> main authenticated tab shell
- `reminders` -> reminders feature screen
- `vehicle-details` -> active vehicle details screen
- `service-details` -> service interval and service history screen
- `log/fuel` -> modal fuel log form
- `log/service` -> modal service/repair log form
- `log/odometer` -> modal odometer log form
- `account/edit` -> modal account edit screen

## Bottom Tabs

Defined in `src/app/(tabs)/_layout.tsx`.

Two tab renderers exist:

- `NativeTabLayout` for compatible iOS/Liquid Glass environments
- `ClassicTabLayout` for Android, web, and fallback iOS

Current tab routes:

| Tab | Route | Notes |
|---|---|---|
| Home | `(tabs)/index` | Dashboard, quick logging, activity summary |
| Garage | `(tabs)/garage` | Vehicle CRUD, free-tier limit handling, tap card to open active vehicle details |
| Logbook | `(tabs)/logbook` | Unified timeline + filters |
| Checks | `(tabs)/checks` | Last check tracking + maintenance tips for active vehicle only |
| Reminders | `(tabs)/reminders` | Parts life reminders tab entry |
| Profile | `(tabs)/profile` | Account, links, sign out, coming-soon items |

## Additional Routes

- `/reminders` is also exposed as a top-level route via `src/app/reminders.tsx` (feature screen export).
- Profile includes a direct navigation entry to `/reminders` in addition to tab access.
- `/vehicle-details` is exposed via `src/app/vehicle-details.tsx` and is used by both Home and Garage flows.
- `/service-details` is exposed via `src/app/service-details.tsx` and is linked from vehicle details.

## Auth-Aware Flow

- Entry point is `src/app/index.tsx`.
- If session exists (`useAuth().isLoggedIn`), app redirects to `/(tabs)`.
- If no session, user is prompted to continue to `/login`.
