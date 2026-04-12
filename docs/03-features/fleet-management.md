# Fleet Management

Allows a `pro_user` to create an organisation, issue a 6-character join code, and manage a fleet of drivers' vehicles from a single account.

---

## Roles

| Role | key | id |
|------|-----|----|
| Admin | `admin` | 1 |
| Regular user | `user` | 2 |
| Pro user (fleet admin) | `pro_user` | 3 |

---

## User Journeys

### A — Pro Upgrade & Create Organisation

1. User opens **Profile → Organisation → Create Organisation**
2. `UpgradeProModal` slides up showing tier options: Bronze / Silver / Gold / Platinum
3. User selects a tier and confirms
4. App calls `POST /app-api/auth/roles/assign-user-role` to grant `pro_user` role
5. App navigates to `/organisation/create-organisation?tier=<tier>`
6. User enters organisation name and submits
7. App generates a unique 6-char join code and inserts a row in `organisations`
8. `AuthStore.setOrganisationId(org.id)` is called — fleet mode activates on next VehicleContext load
9. Profile now shows PRO badge, the join code, and **Organisation Members** plus **Organisation Requests** menu items

### B — Driver Links to Organisation

1. Driver opens **Profile → Organisation → Link to Organisation**
2. Driver enters the 6-char code from their fleet admin
3. App calls `findOrgByJoinCode(code)` → confirms org exists
4. App calls `submitJoinRequest(...)` → inserts a row in `organisation_join_requests` with `status: pending`
5. Driver sees a success screen: "Request sent to [Org Name]"

### C — Admin Approves a Driver

1. Admin opens **Profile → Organisation → Organisation Requests**
2. List of pending requests shown (user name, email, request date)
3. Admin taps **Approve** on a request
4. App calls `organisationService.approveRequest(requestId)` → updates `status = approved`
5. Row is removed from the list optimistically
6. On the driver's next app load, `VehicleContext` detects the approved membership and loads fleet vehicles

### D — Fleet Vehicle Loading

When a pro admin loads the app with an `organisation_id`:
1. `VehicleContext` fetches all approved `organisation_join_requests` for the org
2. Builds a list of member `user_id`s (including the admin's own)
3. Fetches vehicles for all members in parallel
4. Tags each vehicle: `own` (admin's) or `fleet` (driver's) via `vehicleOwnership(vehicleId)`
5. All maintenance logs (fuel, service, odometer, checks, etc.) are loaded for all fleet vehicles

### E — Garage: own vs organisation vehicles

- **Garage** lists **your vehicles** first, then a separator and **Organisation vehicles** (from `VehicleContext.vehicleOwnership`: `own` vs `fleet`).
- Tapping your vehicle opens full **Vehicle Details** (edit, delete, quick log). Tapping an organisation vehicle opens **Organisation vehicle** (`organisation-vehicle-details`): read-only metrics, license disk, checks (no “Mark OK”), recent activity — no edit/delete/quick log.
- The home carousel uses the same routing rule when opening details from a card.
- **Logbook (view only):** From organisation vehicle details, **View full logbook** opens `organisation-vehicle-logbook` (filters, list, pull-to-refresh; no add/delete). Each row opens `logbook-item-page` with `readOnly=1` (no Edit/Delete). Recent activity rows and **All logs** link into the same flows.

---

## Key Files

| File | Role |
|------|------|
| [src/backend/services/OrganisationService.ts](../src/backend/services/OrganisationService.ts) | All org API calls |
| [src/components/popups/UpgradeProModal.tsx](../src/components/popups/UpgradeProModal.tsx) | Tier selection bottom sheet |
| [src/app/organisation/create-organisation.tsx](../src/app/organisation/create-organisation.tsx) | Create org form |
| [src/app/organisation/join-organisation.tsx](../src/app/organisation/join-organisation.tsx) | Driver join code entry |
| [src/app/organisation/organisation-members.tsx](../src/app/organisation/organisation-members.tsx) | Admin view: owner + approved drivers |
| [src/app/organisation/organisation-requests.tsx](../src/app/organisation/organisation-requests.tsx) | Admin approve/reject requests |
| [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx) | Profile screen with org section |
| [src/contexts/VehicleContext.tsx](../src/contexts/VehicleContext.tsx) | Fleet vehicle loading, `vehicleOwnership` |
| [src/app/garage/organisation-vehicle-details.tsx](../src/app/garage/organisation-vehicle-details.tsx) | Read-only org / fleet vehicle details |
| [src/app/garage/organisation-vehicle-logbook.tsx](../src/app/garage/organisation-vehicle-logbook.tsx) | Read-only log timeline for a fleet vehicle |
| [src/utilities/logbookItemNavigation.ts](../src/utilities/logbookItemNavigation.ts) | Shared params for `logbook-item-page` (+ optional `readOnly`) |
| [src/app/(tabs)/garage-tab.tsx](../src/app/(tabs)/garage-tab.tsx) | Garage list with org separator |
| [src/stores/data/AuthStore.ts](../src/stores/data/AuthStore.ts) | `isPro()`, `isOrgAdmin()`, `setOrganisationId()` |
| [docs/03-database/organisations.md](../03-database/organisations.md) | DB schema reference |
