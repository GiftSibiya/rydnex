# repair_items (reference catalog)

Static checklist of common **repair parts and tasks**. Seeded to match [`REPAIR_ITEM_CATALOG`](../../src/constants/Constants.ts) (`item.id` = `slug`). The mobile app reads the catalog from **Constants** in v1; this table supports admin tools and future API-driven lists.

## Table: `repair_items`

| Column | Type | Notes |
|--------|------|--------|
| `id` | serial PK | |
| `slug` | varchar(100) NOT NULL UNIQUE | Stable key; matches catalog item `id` |
| `name` | varchar(100) NOT NULL | Display label |
| `category` | varchar(50) NOT NULL | e.g. `engine_repair`, `brakes_steering`, `suspension_drivetrain`, `electrical_sensors`, `body_glass`, `exhaust_fuel` |
| `created_at` | timestamptz NOT NULL, default now() | |

No interval columns — repair items are fault-driven, not scheduled. Interval data belongs on `service_items` or `parts_life_rules`.

## API

- `POST /app-api/database/tables/repair_items/select` — list/filter rows when the app switches to server-driven catalog.

See [`routes.reference.repairItems`](../../src/constants/ApiRoutes.ts).

## Repair log UI

[`ServiceLogScreen`](../../src/pages/home/log/service.tsx) (repair tab) composes ticked item **names** plus optional free text into `repair_logs.repair_type` via `buildRepairDescriptionFromSelection`.
Selected repair checklist items are also persisted in `repair_logs_items` (`repair_log_id` + `repair_item_id`) so item-based repair lookups do not need to parse summary text.

## Categories

| Category slug | Title | Items |
|---|---|---|
| `engine_repair` | Engine | Head gasket, Engine mount, Valve/lifter, Timing chain, Turbocharger, EGR valve, Oil leak |
| `brakes_steering` | Brakes & Steering | Caliper, Drum, Handbrake cable, ABS sensor/module, Rack & pinion, Steering pump, Tie rod ends |
| `suspension_drivetrain` | Suspension & Drivetrain | Ball joints, Control arm, CV joint/boot, Driveshaft, Differential, Gearbox, Clutch hydraulics |
| `electrical_sensors` | Electrical & Sensors | ECU/BCM, O2/lambda, MAF/MAP, Crank/cam sensor, Wiring, Alternator, Starter motor |
| `body_glass` | Body & Glass | Windscreen, Door handle, Side mirror, Window regulator, Door lock, Dent repair |
| `exhaust_fuel` | Exhaust & Fuel System | Exhaust manifold, Catalytic converter, DPF, Fuel pump, Injector, Throttle body |
