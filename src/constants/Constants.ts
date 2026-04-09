/** Metro resolves font assets from project root (see expo-font / useFonts). */
const poppinsRegular = require('../../assets/fonts/poppins/Poppins-Regular.ttf');

export const COLORS = {
  primary: "#281C59",
  secondary: "#4E8D9C",
  tertiary: "#85C79A",
  quaternary: "#EDF7BD",
  background: "#F5F5F5",
  Grey: '#999999',
  lightGrey: '#E5E5E5',
  text: "#212121",
  white: "#FFFFFF",
  black: "#1D1D1D",
  transparent: 'transparent',
  danger: "#E74C3C",
};

export const ADDRESS_FIELDS = [
  { key: 'street', label: 'Street', placeholder: 'Enter street address' },
  { key: 'town', label: 'Town', placeholder: 'Enter town' },
  { key: 'city', label: 'City', placeholder: 'Enter city' },
  { key: 'state', label: 'State', placeholder: 'Enter state' },
  { key: 'postal_code', label: 'Postal Code', placeholder: 'Enter postal code' },
  { key: 'country', label: 'Country', placeholder: 'Enter country' },
]

export const RADIUS = {
  small: 5,
  medium: 10,
  large: 15,
  extraLarge: 20,
};

export const FONT = {
  POPPIN_REGULAR: poppinsRegular
};

export const FONT_FAMILY = {
  poppinsRegular: 'Poppins-Regular',
};

export const FONT_SIZE = {
  extraSmall: 12,
  small: 14,
  medium: 16,
  large: 18,
  extraLarge: 32,
}

export const FONT_WIDTH = {
  extraSmall: 100,
  small: 200,
  medium: 300,
  large: 700,
  extraLarge: 800,
}

export const STATUS_OPTIONS = [
  'Inactive',
  'Active',
];

export const LOCATION_TYPES = [
  {
    "id": 1,
    "name": "Transport",
    "description": "Transportation facilities",
    "status": "inactive",
    "icon": "storefront-outline",

  },
  {
    "id": 2,
    "name": "Shop",
    "description": "Property rentals or sales",
    "status": "active",
    "icon": "storefront-outline"
  },
  {
    "id": 3,
    "name": "Property",
    "description": "Property rentals or sales",
    "status": "active",
    "icon": "home-outline"
  },
  // {
  //   "id": 4,
  //   "name": "Venues",
  //   "description": "Service facilities",
  //   "status": "active",
  //   "icon": "party-popper"
  // },
  {
    "id": 5,
    "name": "Service",
    "description": "Service facilities",
    "status": "active",
    "icon": "car-wash"
  },
  {
    "id": 6,
    "name": "Taxi Rank",
    "description": "Taxi rank or transport hub",
    "status": "active",
    "icon": "taxi"
  }
];

export const INTERNET_OPTIONS = [
  'No Internet provided',
  'Fiber',
  'Wifi',
  'Mobile Data',
  'Satellite'
];

export const PARKING_OPTIONS = [
  'No Parking provided',
  '1 Car',
  '2 Cars',
  '3 Cars',
  '4 Cars',
];

export const PETS_OPTIONS = [
  'No Pets allowed',
  'Pets allowed',
  'Pets allowed on approval',
];

export const BATHROOM_OPTIONS = [
  'No Bathroom provided',
  'Bathroom with Bathtub',
  'Bathroom with Shower',
  'Bathroom with Bathtub and Shower',
];

export const TOILET_OPTIONS = [
  'No Toilet provided',
  'Outside Toilet',
  'Seperate Inside Toilet',
  'Toilet inside bathroom',
];

export const FURNISHED_OPTIONS = [
  'No Furnished provided',
  'Inbuilt Wardrobe',
  'Fully Furnished',
  'Partly Furnished',
];

export const STATUS_COLOR: Record<string, string> = {
  good: "#2ECC71",
  warn: "#F39C12",
  danger: "#E74C3C",
  unknown: "#5C7265",
};

export const STATUS_BG = {
  good: "rgba(46,204,113,0.12)",
  warn: "rgba(243,156,18,0.12)",
  danger: "rgba(231,76,60,0.12)",
  unknown: "rgba(92,114,101,0.12)",
};

export const STATUS_LABEL = {
  good: "All Good",
  warn: "Attention",
  danger: "Action Required",
  unknown: "No Data",
};

/** Stable keys for service checklist categories (service log UI). */
export type ServiceItemCategoryId =
  | "engine_fluids"
  | "wear_tear"
  | "ignition"
  | "electrical"
  | "tyres_alignment"
  | "cooling_air";

/** Stable keys for repair checklist categories (repair log UI). */
export type RepairItemCategoryId =
  | "engine_repair"
  | "brakes_steering"
  | "suspension_drivetrain"
  | "electrical_sensors"
  | "body_glass"
  | "exhaust_fuel";

export type ServiceCatalogItem = {
  id: string;
  name: string;
  defaultIntervalKm?: number | null;
  defaultIntervalMonths?: number | null;
};

export type RepairCatalogItem = {
  id: string;
  name: string;
};

export type RepairCatalogCategory = {
  id: RepairItemCategoryId;
  title: string;
  items: RepairCatalogItem[];
};

export type ServiceCatalogCategory = {
  id: ServiceItemCategoryId;
  title: string;
  items: ServiceCatalogItem[];
};

/** Common service checklist; `id` doubles as DB `service_items.slug` when seeded. */
export const SERVICE_ITEM_CATALOG: ServiceCatalogCategory[] = [
  {
    id: "engine_fluids",
    title: "Engine and fluids",
    items: [
      { id: "engine_oil", name: "Engine oil", defaultIntervalKm: 10_000, defaultIntervalMonths: 12 },
      { id: "oil_filter", name: "Oil filter", defaultIntervalKm: 10_000, defaultIntervalMonths: 12 },
      { id: "air_filter", name: "Air filter", defaultIntervalKm: 20_000, defaultIntervalMonths: 24 },
      { id: "fuel_filter", name: "Fuel filter", defaultIntervalKm: 40_000 },
      { id: "cabin_filter", name: "Cabin (pollen) filter", defaultIntervalKm: 20_000, defaultIntervalMonths: 24 },
      { id: "coolant", name: "Coolant (antifreeze)", defaultIntervalKm: 40_000, defaultIntervalMonths: 24 },
      { id: "brake_fluid", name: "Brake fluid", defaultIntervalMonths: 24 },
      { id: "transmission_fluid", name: "Transmission fluid", defaultIntervalKm: 60_000 },
      { id: "power_steering_fluid", name: "Power steering fluid", defaultIntervalKm: 60_000 },
    ],
  },
  {
    id: "wear_tear",
    title: "Wear and tear parts",
    items: [
      { id: "brake_pads", name: "Brake pads", defaultIntervalKm: 30_000 },
      { id: "brake_discs", name: "Brake discs (rotors)", defaultIntervalKm: 60_000 },
      { id: "clutch_kit", name: "Clutch kit", defaultIntervalKm: 100_000 },
      { id: "timing_belt_chain", name: "Timing belt / timing chain", defaultIntervalKm: 100_000, defaultIntervalMonths: 60 },
      { id: "serpentine_belt", name: "Serpentine (drive) belt", defaultIntervalKm: 80_000 },
      { id: "shock_absorbers", name: "Shock absorbers", defaultIntervalKm: 80_000 },
      { id: "suspension_bushes", name: "Suspension bushes", defaultIntervalKm: 100_000 },
      { id: "wheel_bearings", name: "Wheel bearings", defaultIntervalKm: 120_000 },
    ],
  },
  {
    id: "ignition",
    title: "Ignition and engine performance",
    items: [
      { id: "spark_plugs", name: "Spark plugs", defaultIntervalKm: 30_000 },
      { id: "glow_plugs", name: "Glow plugs (diesel)", defaultIntervalKm: 100_000 },
      { id: "ignition_coils", name: "Ignition coils", defaultIntervalKm: 80_000 },
    ],
  },
  {
    id: "electrical",
    title: "Electrical components",
    items: [
      { id: "battery", name: "Battery", defaultIntervalMonths: 36 },
      { id: "alternator", name: "Alternator", defaultIntervalKm: 150_000 },
      { id: "starter_motor", name: "Starter motor", defaultIntervalKm: 150_000 },
      { id: "fuses_relays", name: "Fuses / relays" },
      { id: "lights", name: "Lights (headlights, brake lights)" },
    ],
  },
  {
    id: "tyres_alignment",
    title: "Tyres and alignment",
    items: [
      { id: "tyres", name: "Tyres", defaultIntervalKm: 40_000 },
      { id: "wheel_alignment", name: "Wheel alignment", defaultIntervalKm: 20_000 },
      { id: "wheel_balancing", name: "Wheel balancing", defaultIntervalKm: 20_000 },
    ],
  },
  {
    id: "cooling_air",
    title: "Cooling and air systems",
    items: [
      { id: "radiator", name: "Radiator", defaultIntervalKm: 150_000 },
      { id: "water_pump", name: "Water pump", defaultIntervalKm: 120_000 },
      { id: "thermostat", name: "Thermostat", defaultIntervalKm: 100_000 },
      { id: "ac_gas_refill", name: "Air conditioning gas refill", defaultIntervalMonths: 24 },
      { id: "ac_compressor", name: "AC compressor", defaultIntervalKm: 150_000 },
    ],
  },
];

export function buildServiceDescriptionFromSelection(
  selected: Record<string, boolean>,
  extra?: string
): string {
  const names = SERVICE_ITEM_CATALOG.flatMap((c) => c.items)
    .filter((i) => selected[i.id])
    .map((i) => i.name);
  const parts = [...names, (extra ?? "").trim()].filter(Boolean);
  return parts.join("; ");
}

/** Common repair checklist; `id` doubles as DB `repair_items.slug` when seeded. */
export const REPAIR_ITEM_CATALOG: RepairCatalogCategory[] = [
  {
    id: "engine_repair",
    title: "Engine",
    items: [
      { id: "head_gasket", name: "Head gasket" },
      { id: "engine_mount", name: "Engine mount" },
      { id: "valve_adjustment", name: "Valve / lifter adjustment" },
      { id: "timing_chain_replace", name: "Timing chain replacement" },
      { id: "turbocharger", name: "Turbocharger" },
      { id: "egr_valve", name: "EGR valve" },
      { id: "oil_leak_repair", name: "Oil leak repair" },
    ],
  },
  {
    id: "brakes_steering",
    title: "Brakes & Steering",
    items: [
      { id: "brake_caliper", name: "Brake caliper (seize / leak)" },
      { id: "brake_drum", name: "Brake drum" },
      { id: "handbrake_cable", name: "Handbrake cable" },
      { id: "abs_sensor", name: "ABS sensor" },
      { id: "abs_module", name: "ABS module" },
      { id: "steering_rack", name: "Rack and pinion / steering rack" },
      { id: "power_steering_pump", name: "Power steering pump" },
      { id: "tie_rod_ends", name: "Tie rod ends" },
    ],
  },
  {
    id: "suspension_drivetrain",
    title: "Suspension & Drivetrain",
    items: [
      { id: "ball_joints", name: "Ball joints" },
      { id: "control_arm", name: "Control arm" },
      { id: "cv_joint_boot", name: "CV joint / boot" },
      { id: "driveshaft", name: "Driveshaft" },
      { id: "differential", name: "Differential" },
      { id: "gearbox_overhaul", name: "Gearbox overhaul" },
      { id: "clutch_master_slave", name: "Clutch master / slave cylinder" },
    ],
  },
  {
    id: "electrical_sensors",
    title: "Electrical & Sensors",
    items: [
      { id: "ecu_bcm", name: "ECU / BCM" },
      { id: "o2_sensor", name: "O2 / lambda sensor" },
      { id: "maf_map_sensor", name: "MAF / MAP sensor" },
      { id: "crankshaft_sensor", name: "Crankshaft / camshaft sensor" },
      { id: "wiring_fault", name: "Wiring fault / harness repair" },
      { id: "alternator_fail", name: "Alternator failure" },
      { id: "starter_motor_fail", name: "Starter motor failure" },
    ],
  },
  {
    id: "body_glass",
    title: "Body & Glass",
    items: [
      { id: "windscreen", name: "Windscreen (crack / chip)" },
      { id: "door_handle", name: "Door handle" },
      { id: "side_mirror", name: "Side mirror" },
      { id: "window_regulator", name: "Window regulator" },
      { id: "door_lock_actuator", name: "Door lock actuator" },
      { id: "dent_repair", name: "Dent / panel repair" },
    ],
  },
  {
    id: "exhaust_fuel",
    title: "Exhaust & Fuel System",
    items: [
      { id: "exhaust_manifold", name: "Exhaust manifold" },
      { id: "catalytic_converter", name: "Catalytic converter" },
      { id: "dpf_clean_replace", name: "DPF clean / replace" },
      { id: "fuel_pump_fail", name: "Fuel pump failure" },
      { id: "fuel_injector", name: "Fuel injector (clog / fail)" },
      { id: "throttle_body", name: "Throttle body" },
    ],
  },
];

export function buildRepairDescriptionFromSelection(
  selected: Record<string, boolean>,
  extra?: string
): string {
  const names = REPAIR_ITEM_CATALOG.flatMap((c) => c.items)
    .filter((i) => selected[i.id])
    .map((i) => i.name);
  const parts = [...names, (extra ?? "").trim()].filter(Boolean);
  return parts.join("; ");
}
