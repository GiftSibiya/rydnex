# Organisations & Join Requests

Tables for fleet/organisation management added to schema `project_rydnex_1774282351763`.

---

## `organisations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `name` | text NOT NULL | Organisation display name |
| `owner_user_id` | int NOT NULL | Skaftin user id of the pro_user admin |
| `join_code` | varchar(6) UNIQUE NOT NULL | 6-char alphanumeric code drivers enter to request membership |
| `tier` | text NOT NULL | `bronze` / `silver` / `gold` / `platinum` |
| `vehicle_limit` | int | Max own vehicles for the admin; NULL = unlimited (platinum) |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

Indexes: `(join_code)` for O(1) code lookups.

Tier limits:
- Bronze: 10 vehicles
- Silver: 50 vehicles
- Gold: 100 vehicles
- Platinum: unlimited (NULL)

---

## `organisation_join_requests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `organisation_id` | int NOT NULL → `organisations(id)` ON DELETE CASCADE | |
| `user_id` | int NOT NULL | Skaftin user id of the requesting driver |
| `user_name` | text | Denormalised at request time for admin display |
| `user_email` | text | Denormalised at request time for admin display |
| `status` | text DEFAULT `pending` | `pending` / `approved` / `rejected` |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

Indexes: `(organisation_id, status)` for admin pending-list queries.

---

## User→Organisation Resolution

Organisation membership is **not** stored in user metadata. Instead it is derived at app load:
- **Pro admins**: query `organisations WHERE owner_user_id = userId` to get their org.
- **Driver members**: query `organisation_join_requests WHERE user_id = userId AND status = 'approved'` to get their org.

The resolved `organisation_id` is stored in `AuthStore.user.organisation_id` (in-memory + AsyncStorage via Zustand persist) for the session lifetime.
