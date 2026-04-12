import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import skaftinClient from "@/backend/client/SkaftinClient";
import {
  fetchRepairCatalogRows,
  fetchServiceCatalogRows,
  rowsToSlugIdMap,
  syncRepairLogJunction,
  syncServiceLogJunction,
} from "@/backend/maintenance/logCatalogLinks";
import { organisationService } from "@/backend/services/OrganisationService";
import routes from "@/constants/ApiRoutes";
import { ORG_TIER_LIMITS } from "@/types/Types";
import useAuthStore from "@/stores/data/AuthStore";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: string;
  trim?: string;
  vin: string;
  registration: string;
  color: string;
  image?: string;
  currentOdometer: number;
  createdAt: string;
  /** Internal — DB user_id; used to tag fleet vs own vehicles. */
  userId?: string;
};

export type OdometerLog = {
  id: string;
  vehicleId: string;
  reading: number;
  date: string;
  note?: string;
};

export type FuelLog = {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometer: number;
  fullTank: boolean;
};

export type ServiceLog = {
  id: string;
  vehicleId: string;
  date: string;
  type: "service" | "repair";
  description: string;
  cost: number;
  odometer: number;
  workshop?: string;
  notes?: string;
};

export type VehicleIssueStatus = "open" | "resolved";

export type VehicleIssue = {
  id: string;
  vehicleId: string;
  title: string;
  description?: string;
  status: VehicleIssueStatus;
  notedOdometerKm?: number;
  /** DB `repair_items.id` when linked to catalog */
  repairItemId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

type AddServiceLogInput = Omit<ServiceLog, "id"> & {
  selectedServiceItemSlugs?: string[];
  selectedRepairItemSlugs?: string[];
};

type UpdateServiceLogInput = Partial<Pick<ServiceLog, "description" | "cost" | "odometer" | "workshop" | "notes" | "date">> & {
  selectedServiceItemSlugs?: string[];
  selectedRepairItemSlugs?: string[];
};

type AddVehicleIssueInput = Omit<
  VehicleIssue,
  "id" | "createdAt" | "updatedAt" | "resolvedAt" | "repairItemId"
> & {
  /** Resolved to `repair_item_id` via `repair_items` (slug matches catalog `id`). */
  repairItemSlug?: string | null;
};

type UpdateVehicleIssueInput = Partial<
  Pick<VehicleIssue, "title" | "description" | "status" | "notedOdometerKm" | "resolvedAt" | "repairItemId">
> & {
  repairItemSlug?: string | null;
};

export type LastCheck = {
  vehicleId: string;
  oil: string | null;
  tyrePressure: string | null;
  coolant: string | null;
  spareWheel: string | null;
  lights: string | null;
};

export type PartRule = {
  id: string;
  vehicleId: string;
  partName: string;
  intervalKm: number;
  intervalDays: number;
  lastReplacedKm: number;
  lastReplacedDate: string;
};

export type LicenseDisk = {
  vehicleId: string;
  licenseNo: string;
  expiryDate: string;
  vin: string;
  engineNumber: string;
  licenseNumber: string;
  registerNumber: string;
  fees: number;
  dateOfTest: string;
};

type VehicleContextType = {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  odometerLogs: OdometerLog[];
  fuelLogs: FuelLog[];
  serviceLogs: ServiceLog[];
  vehicleIssues: VehicleIssue[];
  lastChecks: LastCheck[];
  partRules: PartRule[];
  licenseDisk: (vehicleId: string) => LicenseDisk | undefined;
  setActiveVehicle: (v: Vehicle) => void;
  addVehicle: (v: Omit<Vehicle, "id" | "createdAt">) => Promise<boolean>;
  isFleetMode: boolean;
  vehicleOwnership: (vehicleId: string) => 'own' | 'fleet';
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addOdometerLog: (log: Omit<OdometerLog, "id">) => Promise<void>;
  addFuelLog: (log: Omit<FuelLog, "id">) => Promise<void>;
  addServiceLog: (log: AddServiceLogInput) => Promise<void>;
  deleteServiceLog: (id: string) => Promise<void>;
  updateServiceLog: (id: string, data: UpdateServiceLogInput) => Promise<void>;
  addVehicleIssue: (issue: AddVehicleIssueInput) => Promise<void>;
  updateVehicleIssue: (id: string, data: UpdateVehicleIssueInput) => Promise<void>;
  deleteVehicleIssue: (id: string) => Promise<void>;
  getLatestServiceLogForItem: (vehicleId: string, itemSlug: string) => Promise<ServiceLog | null>;
  deleteFuelLog: (id: string) => Promise<void>;
  updateFuelLog: (id: string, data: Partial<Pick<FuelLog, "liters" | "costPerLiter" | "totalCost" | "odometer" | "date" | "fullTank">>) => Promise<void>;
  updateOdometerLog: (id: string, data: Partial<Pick<OdometerLog, "reading" | "date" | "note">>) => Promise<void>;
  updateLastCheck: (vehicleId: string, field: keyof Omit<LastCheck, "vehicleId">, date: string) => Promise<void>;
  addPartRule: (rule: Omit<PartRule, "id">) => Promise<void>;
  updatePartRule: (id: string, data: Partial<PartRule>) => Promise<void>;
  deletePartRule: (id: string) => Promise<void>;
  upsertLicenseDisk: (disk: LicenseDisk) => Promise<void>;
  getEfficiencyMetrics: (vehicleId: string) => { avgKmPerL: number; avgCostPerKm: number; totalFuelCost: number };
  refreshLogs: () => Promise<void>;
  FREE_TIER_LIMIT: number;
};

const VehicleContext = createContext<VehicleContextType | null>(null);

const STORAGE_KEYS = {
  activeVehicleId: "rydnex_active_vehicle",
  odometerLogs: "rydnex_odometer_logs",
  fuelLogs: "rydnex_fuel_logs",
  serviceLogs: "rydnex_service_logs",
  lastChecks: "rydnex_last_checks",
  partRules: "rydnex_part_rules",
  licenseDisks: "rydnex_license_disks",
  vehicleIssues: "rydnex_vehicle_issues",
};

const FREE_TIER_LIMIT = 2;

const LAST_CHECK_FIELD_TO_DB: Record<keyof Omit<LastCheck, "vehicleId">, string> = {
  oil: "oil",
  tyrePressure: "tyre_pressure",
  coolant: "coolant",
  spareWheel: "spare_wheel",
  lights: "lights",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/** Trim + uppercase for persisted string fields (registration, colour, etc.). */
function trimUpperStored(value: string | undefined | null): string {
  if (value == null) return "";
  return String(value).trim().toUpperCase();
}

function normalizeRegistration(value: string | undefined | null): string {
  return trimUpperStored(value);
}

function dbRowToVehicle(row: Record<string, any>): Vehicle {
  return {
    id: String(row.id),
    make: row.make ?? "",
    model: row.model ?? "",
    year: row.year ? String(row.year) : "",
    trim: row.trim ?? undefined,
    vin: row.vin ?? "",
    registration: normalizeRegistration(row.registration),
    color: trimUpperStored(row.color),
    currentOdometer: row.current_odometer ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    userId: row.user_id != null ? String(row.user_id) : undefined,
  };
}

function vehicleRowToLicenseDisk(row: Record<string, any>): LicenseDisk | null {
  const has =
    row.license_expiry_date != null ||
    row.license_disk_number != null ||
    row.license_engine_number != null ||
    row.license_fees != null ||
    row.license_test_date != null;
  if (!has) return null;
  const vehicleId = String(row.id);
  const expiry =
    row.license_expiry_date != null ? new Date(row.license_expiry_date).toISOString() : "";
  const test =
    row.license_test_date != null ? String(row.license_test_date).slice(0, 10) : "";
  return {
    vehicleId,
    licenseNo: row.license_disk_number ?? "",
    expiryDate: expiry,
    vin: row.vin ?? "",
    engineNumber: row.license_engine_number ?? "",
    licenseNumber: row.license_disk_number ?? "",
    registerNumber: normalizeRegistration(row.registration),
    fees: row.license_fees != null ? Number(row.license_fees) : 0,
    dateOfTest: test,
  };
}

function mergeLicenseDisks(rawVehicles: Record<string, any>[], cached: LicenseDisk[]): LicenseDisk[] {
  const fromDb = rawVehicles
    .map(vehicleRowToLicenseDisk)
    .filter((x): x is LicenseDisk => x != null);
  const byVid = new Map(fromDb.map((d) => [d.vehicleId, d]));
  for (const c of cached) {
    if (!byVid.has(c.vehicleId)) {
      byVid.set(c.vehicleId, { ...c, registerNumber: normalizeRegistration(c.registerNumber) });
    }
  }
  return [...byVid.values()];
}

function rowToOdometerLog(row: Record<string, any>): OdometerLog {
  return {
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    reading: Number(row.reading_km),
    date: row.logged_at,
    note: row.note ?? undefined,
  };
}

function rowToFuelLog(row: Record<string, any>): FuelLog {
  const litres = Number(row.litres);
  const totalCost = Number(row.cost);
  return {
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    date: row.logged_at,
    liters: litres,
    costPerLiter: litres > 0 ? totalCost / litres : 0,
    totalCost,
    odometer: Number(row.odometer_km),
    fullTank: row.fuel_level_percent != null && Number(row.fuel_level_percent) >= 95,
  };
}

function rowToServiceLog(row: Record<string, any>, kind: "service" | "repair"): ServiceLog {
  const prefix = kind === "service" ? "s" : "r";
  const date = kind === "service" ? row.service_date : row.repair_date;
  return {
    id: `${prefix}-${row.id}`,
    vehicleId: String(row.vehicle_id),
    date,
    type: kind === "service" ? "service" : "repair",
    description:
      kind === "service" ? (row.description ?? row.service_type ?? "") : (row.repair_type ?? ""),
    cost: Number(row.cost ?? 0),
    odometer: Number(kind === "service" ? row.service_km : row.repair_km),
    workshop: row.workshop_name ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function buildLastChecksFromRows(rows: Record<string, any>[]): LastCheck[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
  );
  const byVehicle = new Map<string, Partial<Record<string, string | null>>>();
  for (const r of sorted) {
    const vid = String(r.vehicle_id);
    const ct = r.check_type as string;
    if (!byVehicle.has(vid)) byVehicle.set(vid, {});
    const m = byVehicle.get(vid)!;
    if (m[ct] !== undefined) continue;
    m[ct] = r.checked_at;
  }
  const out: LastCheck[] = [];
  for (const [vehicleId, m] of byVehicle) {
    out.push({
      vehicleId,
      oil: m["oil"] ?? null,
      tyrePressure: m["tyre_pressure"] ?? null,
      coolant: m["coolant"] ?? null,
      spareWheel: m["spare_wheel"] ?? null,
      lights: m["lights"] ?? null,
    });
  }
  return out;
}

function rowToPartRule(row: Record<string, any>): PartRule {
  const dateStr =
    row.last_replaced_date != null ? String(row.last_replaced_date).slice(0, 10) : "";
  return {
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    partName: row.part_name ?? "",
    intervalKm: Number(row.expected_life_km ?? 0),
    intervalDays: Number(row.interval_days ?? 0),
    lastReplacedKm: Number(row.last_change_km ?? 0),
    lastReplacedDate: dateStr,
  };
}

function normalizeIssueStatus(raw: string | undefined | null): VehicleIssueStatus {
  return raw === "resolved" ? "resolved" : "open";
}

function rowToVehicleIssue(row: Record<string, any>): VehicleIssue {
  const status = normalizeIssueStatus(row.status);
  const resolvedRaw = row.resolved_at;
  const rid = row.repair_item_id;
  return {
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    title: row.title ?? "",
    description: row.description ?? undefined,
    status,
    notedOdometerKm:
      row.noted_odometer_km != null && row.noted_odometer_km !== ""
        ? Number(row.noted_odometer_km)
        : undefined,
    repairItemId: rid != null && rid !== "" ? String(rid) : undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    resolvedAt: resolvedRaw != null ? new Date(resolvedRaw).toISOString() : undefined,
  };
}

async function resolveRepairItemIdFromSlug(slug: string | null | undefined): Promise<number | null> {
  const s = slug != null ? String(slug).trim() : "";
  if (!s) return null;
  try {
    const rows = await fetchRepairCatalogRows();
    const id = rowsToSlugIdMap(rows).get(s);
    return id != null && !Number.isNaN(id) ? id : null;
  } catch {
    return null;
  }
}

function sortVehicleIssues(a: VehicleIssue, b: VehicleIssue): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

async function fetchRowsForVehicles(
  routeList: string,
  vehicleIds: number[]
): Promise<Record<string, any>[]> {
  if (vehicleIds.length === 0) return [];
  const results = await Promise.all(
    vehicleIds.map((vehicle_id) =>
      skaftinClient.post<Record<string, any>[]>(routeList, { where: { vehicle_id } })
    )
  );
  return results.flatMap((r) => (Array.isArray(r.data) ? r.data : []));
}

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
    return fallback;
  } catch {
    return fallback;
  }
}

async function save(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicleState] = useState<Vehicle | null>(null);
  const [odometerLogs, setOdometerLogs] = useState<OdometerLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [vehicleIssues, setVehicleIssues] = useState<VehicleIssue[]>([]);
  const [lastChecks, setLastChecks] = useState<LastCheck[]>([]);
  const [partRules, setPartRules] = useState<PartRule[]>([]);
  const [licenseDisks, setLicenseDisks] = useState<LicenseDisk[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [ownershipMap, setOwnershipMap] = useState<Map<string, 'own' | 'fleet'>>(new Map());
  const [isFleetMode, setIsFleetMode] = useState(false);

  useEffect(() => {
    (async () => {
      const userId = useAuthStore.getState().user_id;

      const [activeId, odo, fuel, svc, issues, checks, rules, disks] = await Promise.all([
        load<string | null>(STORAGE_KEYS.activeVehicleId, null),
        load<OdometerLog[]>(STORAGE_KEYS.odometerLogs, []),
        load<FuelLog[]>(STORAGE_KEYS.fuelLogs, []),
        load<ServiceLog[]>(STORAGE_KEYS.serviceLogs, []),
        load<VehicleIssue[]>(STORAGE_KEYS.vehicleIssues, []),
        load<LastCheck[]>(STORAGE_KEYS.lastChecks, []),
        load<PartRule[]>(STORAGE_KEYS.partRules, []),
        load<LicenseDisk[]>(STORAGE_KEYS.licenseDisks, []),
      ]);

      let nextOdo = odo;
      let nextFuel = fuel;
      let nextSvc = svc;
      let nextIssues = issues;
      let nextChecks = checks;
      let nextRules = rules;
      let nextDisks = disks;
      let nextVehicles: Vehicle[] = [];

      if (userId) {
        try {
          // Resolve organisation membership (sets organisation_id in AuthStore if found)
          const userIsPro = useAuthStore.getState().isPro();
          const resolvedOrgId = await organisationService.resolveOrganisationId(userId, userIsPro);
          if (resolvedOrgId != null) {
            useAuthStore.getState().setOrganisationId(resolvedOrgId);
          }

          // Determine which user IDs to load vehicles for
          let memberUserIds: number[] = [userId];
          let fleet = false;
          if (userIsPro && resolvedOrgId != null) {
            try {
              const approvedReqs = await skaftinClient.post<Record<string, any>[]>(
                routes.orgJoinRequests.list,
                { where: { organisation_id: resolvedOrgId, status: 'approved' } }
              );
              const memberIds = Array.isArray(approvedReqs.data)
                ? approvedReqs.data.map((r) => Number(r.user_id)).filter(Boolean)
                : [];
              memberUserIds = [userId, ...memberIds.filter((id) => id !== userId)];
              fleet = memberUserIds.length > 1;
            } catch {
              /* fall back to single-user load */
            }
          }
          setIsFleetMode(fleet);

          // Fetch vehicles for all member user IDs in parallel
          const vehicleResponses = await Promise.all(
            memberUserIds.map((uid) =>
              skaftinClient.post<Record<string, any>[]>(routes.vehicles.list, {
                where: { user_id: uid, is_active: true },
              })
            )
          );
          const allRawVehicles = vehicleResponses.flatMap((r) =>
            Array.isArray(r.data) ? r.data : []
          );
          nextVehicles = allRawVehicles.map(dbRowToVehicle);

          // Build ownership map
          const newOwnershipMap = new Map<string, 'own' | 'fleet'>();
          for (const v of nextVehicles) {
            newOwnershipMap.set(v.id, v.userId === String(userId) ? 'own' : 'fleet');
          }
          setOwnershipMap(newOwnershipMap);

          const vidNums = allRawVehicles.map((r) => r.id as number);

          if (vidNums.length > 0) {
            try {
              const [odoRows, fuelRows, svcRows, repRows, checkRows, ruleRows, issueRows] =
                await Promise.all([
                  fetchRowsForVehicles(routes.maintenance.odometerLogs.list, vidNums),
                  fetchRowsForVehicles(routes.maintenance.fuelLogs.list, vidNums),
                  fetchRowsForVehicles(routes.maintenance.serviceLogs.list, vidNums),
                  fetchRowsForVehicles(routes.maintenance.repairLogs.list, vidNums),
                  fetchRowsForVehicles(routes.maintenance.vehicleChecks.list, vidNums),
                  fetchRowsForVehicles(routes.maintenance.partsLifeRules.list, vidNums),
                  fetchRowsForVehicles(routes.maintenance.vehicleIssues.list, vidNums),
                ]);
              nextOdo = odoRows.map(rowToOdometerLog).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              nextFuel = fuelRows.map(rowToFuelLog).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              const svcMapped = [
                ...svcRows.map((r) => rowToServiceLog(r, "service")),
                ...repRows.map((r) => rowToServiceLog(r, "repair")),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              nextSvc = svcMapped;
              nextChecks = buildLastChecksFromRows(checkRows);
              nextRules = ruleRows.map(rowToPartRule);
              nextIssues = issueRows.map(rowToVehicleIssue).sort(sortVehicleIssues);
              nextDisks = mergeLicenseDisks(rawVehicles, disks);
            } catch {
              /* keep cached log state */
            }
          }

          setVehicles(nextVehicles);
          if (nextVehicles.length > 0) {
            const active = activeId
              ? nextVehicles.find((x) => x.id === activeId) ?? nextVehicles[0]
              : nextVehicles[0];
            setActiveVehicleState(active);
          }
        } catch {
          /* Failed to fetch vehicles */
        }
      }

      setOdometerLogs(nextOdo);
      setFuelLogs(nextFuel);
      setServiceLogs(nextSvc);
      setVehicleIssues(nextIssues);
      setLastChecks(nextChecks);
      setPartRules(nextRules);
      setLicenseDisks(nextDisks);
      await Promise.all([
        save(STORAGE_KEYS.odometerLogs, nextOdo),
        save(STORAGE_KEYS.fuelLogs, nextFuel),
        save(STORAGE_KEYS.serviceLogs, nextSvc),
        save(STORAGE_KEYS.vehicleIssues, nextIssues),
        save(STORAGE_KEYS.lastChecks, nextChecks),
        save(STORAGE_KEYS.partRules, nextRules),
        save(STORAGE_KEYS.licenseDisks, nextDisks),
      ]);

      setLoaded(true);
    })();
  }, []);

  const refreshLogs = useCallback(async () => {
    const vidNums = vehicles.map((v) => Number(v.id)).filter(Boolean);
    if (vidNums.length === 0) return;
    try {
      const [odoRows, fuelRows, svcRows, repRows, issueRows] = await Promise.all([
        fetchRowsForVehicles(routes.maintenance.odometerLogs.list, vidNums),
        fetchRowsForVehicles(routes.maintenance.fuelLogs.list, vidNums),
        fetchRowsForVehicles(routes.maintenance.serviceLogs.list, vidNums),
        fetchRowsForVehicles(routes.maintenance.repairLogs.list, vidNums),
        fetchRowsForVehicles(routes.maintenance.vehicleIssues.list, vidNums),
      ]);
      const nextOdo = odoRows.map(rowToOdometerLog).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const nextFuel = fuelRows.map(rowToFuelLog).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const nextSvc = [
        ...svcRows.map((r) => rowToServiceLog(r, "service")),
        ...repRows.map((r) => rowToServiceLog(r, "repair")),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const nextIssues = issueRows.map(rowToVehicleIssue).sort(sortVehicleIssues);
      setOdometerLogs(nextOdo);
      setFuelLogs(nextFuel);
      setServiceLogs(nextSvc);
      setVehicleIssues(nextIssues);
      await Promise.all([
        save(STORAGE_KEYS.odometerLogs, nextOdo),
        save(STORAGE_KEYS.fuelLogs, nextFuel),
        save(STORAGE_KEYS.serviceLogs, nextSvc),
        save(STORAGE_KEYS.vehicleIssues, nextIssues),
      ]);
    } catch {
      /* keep existing data on failure */
    }
  }, [vehicles]);

  const setActiveVehicle = useCallback((v: Vehicle) => {
    setActiveVehicleState(v);
    save(STORAGE_KEYS.activeVehicleId, v.id);
  }, []);

  const vehicleOwnership = useCallback((vehicleId: string): 'own' | 'fleet' => {
    return ownershipMap.get(vehicleId) ?? 'own';
  }, [ownershipMap]);

  const addVehicle = useCallback(async (data: Omit<Vehicle, "id" | "createdAt">): Promise<boolean> => {
    const authState = useAuthStore.getState();
    const userIsPro = authState.isPro();
    const orgId = authState.user?.organisation_id;
    if (userIsPro && orgId != null) {
      // Fleet mode: check tier limit against own vehicles only
      const org = await organisationService.fetchOwnedOrganisation(authState.user_id);
      const tierLimit = org ? ORG_TIER_LIMITS[org.tier] : FREE_TIER_LIMIT;
      const ownVehicles = vehicles.filter((v) => vehicleOwnership(v.id) === 'own');
      if (tierLimit !== null && ownVehicles.length >= tierLimit) return false;
    } else {
      if (vehicles.length >= FREE_TIER_LIMIT) return false;
    }
    const userId = useAuthStore.getState().user_id;
    try {
      const res = await skaftinClient.post<Record<string, any>>(routes.vehicles.create, {
        data: {
          user_id: userId,
          make: data.make,
          model: data.model,
          year: data.year,
          trim: data.trim ?? null,
          vin: data.vin || null,
          registration: normalizeRegistration(data.registration) || null,
          color: trimUpperStored(data.color) || null,
          current_odometer: data.currentOdometer ?? 0,
          is_active: true,
        },
      });
      if (!res.success || !res.data) return false;
      const newVehicle = dbRowToVehicle(res.data);
      const updated = [...vehicles, newVehicle];
      setVehicles(updated);
      setOwnershipMap((prev) => new Map(prev).set(newVehicle.id, 'own'));
      if (!activeVehicle) {
        setActiveVehicleState(newVehicle);
        await save(STORAGE_KEYS.activeVehicleId, newVehicle.id);
      }
      return true;
    } catch {
      return false;
    }
  }, [vehicles, activeVehicle, vehicleOwnership]);

  const updateVehicle = useCallback(
    async (id: string, data: Partial<Vehicle>) => {
      const normalized: Partial<Vehicle> = { ...data };
      if (data.registration !== undefined) {
        normalized.registration = normalizeRegistration(data.registration);
      }
      if (data.color !== undefined) {
        normalized.color = trimUpperStored(data.color);
      }
      const updated = vehicles.map((v) => (v.id === id ? { ...v, ...normalized } : v));
      setVehicles(updated);
      if (activeVehicle?.id === id) {
        const newActive = updated.find((v) => v.id === id) ?? null;
        setActiveVehicleState(newActive);
      }
      try {
        const dbPatch: Record<string, any> = {};
        if (data.make !== undefined) dbPatch.make = data.make;
        if (data.model !== undefined) dbPatch.model = data.model;
        if (data.year !== undefined) dbPatch.year = data.year;
        if (data.trim !== undefined) dbPatch.trim = data.trim;
        if (data.vin !== undefined) dbPatch.vin = data.vin;
        if (data.registration !== undefined) {
          dbPatch.registration = normalizeRegistration(data.registration) || null;
        }
        if (data.color !== undefined) {
          dbPatch.color = trimUpperStored(data.color) || null;
        }
        if (data.currentOdometer !== undefined) dbPatch.current_odometer = data.currentOdometer;
        if (Object.keys(dbPatch).length > 0) {
          dbPatch.updated_at = new Date().toISOString();
          await skaftinClient.put(routes.vehicles.update, {
            where: { id: parseInt(id, 10) },
            data: dbPatch,
          });
        }
      } catch {
        /* optimistic update already applied */
      }
    },
    [vehicles, activeVehicle]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      const updated = vehicles.filter((v) => v.id !== id);
      setVehicles(updated);
      if (activeVehicle?.id === id) {
        const next = updated[0] ?? null;
        setActiveVehicleState(next);
        await save(STORAGE_KEYS.activeVehicleId, next?.id ?? null);
      }
      try {
        await skaftinClient.delete(routes.vehicles.delete, {
          where: { id: parseInt(id, 10) },
        });
      } catch {
        /* vehicle already removed from local state */
      }
      const updatedOdo = odometerLogs.filter((l) => l.vehicleId !== id);
      const updatedFuel = fuelLogs.filter((l) => l.vehicleId !== id);
      const updatedSvc = serviceLogs.filter((l) => l.vehicleId !== id);
      const updatedChecks = lastChecks.filter((l) => l.vehicleId !== id);
      const updatedRules = partRules.filter((l) => l.vehicleId !== id);
      const updatedDisks = licenseDisks.filter((l) => l.vehicleId !== id);
      const updatedIssues = vehicleIssues.filter((l) => l.vehicleId !== id);
      setOdometerLogs(updatedOdo);
      setFuelLogs(updatedFuel);
      setServiceLogs(updatedSvc);
      setLastChecks(updatedChecks);
      setPartRules(updatedRules);
      setLicenseDisks(updatedDisks);
      setVehicleIssues(updatedIssues);
      await Promise.all([
        save(STORAGE_KEYS.odometerLogs, updatedOdo),
        save(STORAGE_KEYS.fuelLogs, updatedFuel),
        save(STORAGE_KEYS.serviceLogs, updatedSvc),
        save(STORAGE_KEYS.lastChecks, updatedChecks),
        save(STORAGE_KEYS.partRules, updatedRules),
        save(STORAGE_KEYS.licenseDisks, updatedDisks),
        save(STORAGE_KEYS.vehicleIssues, updatedIssues),
      ]);
    },
    [
      vehicles,
      activeVehicle,
      odometerLogs,
      fuelLogs,
      serviceLogs,
      lastChecks,
      partRules,
      licenseDisks,
      vehicleIssues,
    ]
  );

  const addOdometerLog = useCallback(
    async (log: Omit<OdometerLog, "id">) => {
      let newLog: OdometerLog = { ...log, id: generateId() };
      try {
        const res = await skaftinClient.post<Record<string, any>>(routes.maintenance.odometerLogs.create, {
          data: {
            vehicle_id: parseInt(log.vehicleId, 10),
            reading_km: log.reading,
            logged_at: log.date || new Date().toISOString(),
            note: log.note ?? null,
          },
        });
        if (res.success && res.data) {
          newLog = rowToOdometerLog(res.data as Record<string, any>);
        }
      } catch {
        /* local fallback id */
      }
      const updated = [newLog, ...odometerLogs];
      setOdometerLogs(updated);
      await save(STORAGE_KEYS.odometerLogs, updated);
      const vehicle = vehicles.find((v) => v.id === log.vehicleId);
      if (vehicle && log.reading > vehicle.currentOdometer) {
        await updateVehicle(log.vehicleId, { currentOdometer: log.reading });
      }
    },
    [odometerLogs, vehicles, updateVehicle]
  );

  const addFuelLog = useCallback(
    async (log: Omit<FuelLog, "id">) => {
      let newLog: FuelLog = { ...log, id: generateId() };
      try {
        const res = await skaftinClient.post<Record<string, any>>(routes.maintenance.fuelLogs.create, {
          data: {
            vehicle_id: parseInt(log.vehicleId, 10),
            odometer_km: log.odometer,
            litres: log.liters,
            cost: log.totalCost,
            fuel_level_percent: log.fullTank ? 100 : null,
            logged_at: log.date || new Date().toISOString(),
          },
        });
        if (res.success && res.data) {
          newLog = rowToFuelLog(res.data as Record<string, any>);
        }
      } catch {
        /* local fallback */
      }
      const updated = [newLog, ...fuelLogs];
      setFuelLogs(updated);
      await save(STORAGE_KEYS.fuelLogs, updated);
    },
    [fuelLogs]
  );

  const addServiceLog = useCallback(
    async (log: AddServiceLogInput) => {
      const vid = parseInt(log.vehicleId, 10);
      let newLog: ServiceLog = { ...log, id: generateId() };
      try {
        if (log.type === "repair") {
          const res = await skaftinClient.post<Record<string, any>>(routes.maintenance.repairLogs.create, {
            data: {
              vehicle_id: vid,
              repair_type: log.description,
              repair_km: log.odometer,
              repair_date: log.date || new Date().toISOString(),
              cost: log.cost,
              notes: log.notes ?? null,
            },
          });
          if (res.success && res.data) {
            const parsed = rowToServiceLog(res.data as Record<string, any>, "repair");
            newLog = { ...parsed, description: log.description };
            const newRepairLogId = Number((res.data as Record<string, any>).id);
            const selected = (log.selectedRepairItemSlugs ?? []).filter(Boolean);
            if (!Number.isNaN(newRepairLogId) && selected.length > 0) {
              await syncRepairLogJunction(newRepairLogId, selected);
            }
          }
        } else {
          const res = await skaftinClient.post<Record<string, any>>(routes.maintenance.serviceLogs.create, {
            data: {
              vehicle_id: vid,
              description: log.description,
              service_km: log.odometer,
              service_date: log.date || new Date().toISOString(),
              workshop_name: log.workshop ?? null,
              cost: log.cost,
              notes: log.notes ?? null,
            },
          });
          if (res.success && res.data) {
            const parsed = rowToServiceLog(res.data as Record<string, any>, "service");
            newLog = { ...parsed, description: log.description };
            const newServiceLogId = Number((res.data as Record<string, any>).id);
            const selected = (log.selectedServiceItemSlugs ?? []).filter(Boolean);
            if (!Number.isNaN(newServiceLogId) && selected.length > 0) {
              await syncServiceLogJunction(newServiceLogId, selected);
            }
          }
        }
      } catch {
        /* local fallback */
      }
      const updated = [newLog, ...serviceLogs];
      setServiceLogs(updated);
      await save(STORAGE_KEYS.serviceLogs, updated);
    },
    [serviceLogs]
  );

  const deleteServiceLog = useCallback(
    async (id: string) => {
      const isRepair = id.startsWith("r-");
      const isService = id.startsWith("s-");
      const numericId = isRepair || isService ? parseInt(id.slice(2), 10) : NaN;
      if (!Number.isNaN(numericId)) {
        try {
          if (isRepair) {
            await skaftinClient.delete(routes.maintenance.repairLogs.delete, { where: { id: numericId } });
          } else if (isService) {
            await skaftinClient.delete(routes.maintenance.serviceLogs.delete, { where: { id: numericId } });
          }
        } catch {
          /* still drop locally */
        }
      }
      const updated = serviceLogs.filter((l) => l.id !== id);
      setServiceLogs(updated);
      await save(STORAGE_KEYS.serviceLogs, updated);
    },
    [serviceLogs]
  );

  const updateServiceLog = useCallback(
    async (id: string, data: UpdateServiceLogInput) => {
      const {
        selectedServiceItemSlugs,
        selectedRepairItemSlugs,
        ...rowPatch
      } = data;
      const isRepair = id.startsWith("r-");
      const isService = id.startsWith("s-");
      const numericId = isRepair || isService ? parseInt(id.slice(2), 10) : NaN;
      if (!Number.isNaN(numericId)) {
        try {
          if (isRepair) {
            await skaftinClient.put(routes.maintenance.repairLogs.update, {
              data: {
                ...(rowPatch.description !== undefined && { repair_type: rowPatch.description }),
                ...(rowPatch.odometer !== undefined && { repair_km: rowPatch.odometer }),
                ...(rowPatch.date !== undefined && { repair_date: rowPatch.date }),
                ...(rowPatch.cost !== undefined && { cost: rowPatch.cost }),
                ...(rowPatch.notes !== undefined && { notes: rowPatch.notes ?? null }),
              },
              where: { id: numericId },
            });
            if (selectedRepairItemSlugs !== undefined) {
              await syncRepairLogJunction(numericId, selectedRepairItemSlugs.filter(Boolean));
            }
          } else if (isService) {
            await skaftinClient.put(routes.maintenance.serviceLogs.update, {
              data: {
                ...(rowPatch.description !== undefined && { description: rowPatch.description }),
                ...(rowPatch.odometer !== undefined && { service_km: rowPatch.odometer }),
                ...(rowPatch.date !== undefined && { service_date: rowPatch.date }),
                ...(rowPatch.cost !== undefined && { cost: rowPatch.cost }),
                ...(rowPatch.workshop !== undefined && { workshop_name: rowPatch.workshop ?? null }),
                ...(rowPatch.notes !== undefined && { notes: rowPatch.notes ?? null }),
              },
              where: { id: numericId },
            });
            if (selectedServiceItemSlugs !== undefined) {
              await syncServiceLogJunction(numericId, selectedServiceItemSlugs.filter(Boolean));
            }
          }
        } catch {
          /* update locally anyway */
        }
      }
      const updated = serviceLogs.map((l) => (l.id === id ? { ...l, ...rowPatch } : l));
      setServiceLogs(updated);
      await save(STORAGE_KEYS.serviceLogs, updated);
    },
    [serviceLogs]
  );

  const addVehicleIssue = useCallback(
    async (issue: AddVehicleIssueInput) => {
      const now = new Date().toISOString();
      const repairItemIdNum = await resolveRepairItemIdFromSlug(issue.repairItemSlug ?? null);
      let next: VehicleIssue = {
        vehicleId: issue.vehicleId,
        title: issue.title.trim(),
        description: issue.description?.trim() || undefined,
        status: issue.status,
        notedOdometerKm: issue.notedOdometerKm,
        repairItemId: repairItemIdNum != null ? String(repairItemIdNum) : undefined,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        resolvedAt: issue.status === "resolved" ? now : undefined,
      };
      try {
        const res = await skaftinClient.post<Record<string, any>>(routes.maintenance.vehicleIssues.create, {
          data: {
            vehicle_id: parseInt(issue.vehicleId, 10),
            title: issue.title.trim(),
            description: issue.description?.trim() || null,
            status: issue.status,
            noted_odometer_km: issue.notedOdometerKm ?? null,
            resolved_at: issue.status === "resolved" ? now : null,
            repair_item_id: repairItemIdNum,
          },
        });
        if (res.success && res.data) {
          next = rowToVehicleIssue(res.data as Record<string, any>);
        }
      } catch {
        /* local fallback id */
      }
      const updated = [...vehicleIssues, next].sort(sortVehicleIssues);
      setVehicleIssues(updated);
      await save(STORAGE_KEYS.vehicleIssues, updated);
    },
    [vehicleIssues]
  );

  const updateVehicleIssue = useCallback(
    async (id: string, data: UpdateVehicleIssueInput) => {
      const numericId = parseInt(id, 10);
      const now = new Date().toISOString();
      let resolvedRepairItemId: number | null | undefined;
      if (data.repairItemSlug !== undefined) {
        resolvedRepairItemId = await resolveRepairItemIdFromSlug(data.repairItemSlug);
      }
      if (!Number.isNaN(numericId)) {
        try {
          const patch: Record<string, any> = { updated_at: now };
          if (data.title !== undefined) patch.title = data.title.trim();
          if (data.description !== undefined) patch.description = data.description.trim() || null;
          if (data.notedOdometerKm !== undefined) {
            patch.noted_odometer_km = data.notedOdometerKm ?? null;
          }
          if (data.status !== undefined) {
            patch.status = data.status;
            patch.resolved_at = data.status === "resolved" ? (data.resolvedAt ?? now) : null;
          } else if (data.resolvedAt !== undefined) {
            patch.resolved_at = data.resolvedAt ?? null;
          }
          if (data.repairItemSlug !== undefined) {
            patch.repair_item_id = resolvedRepairItemId;
          } else if (data.repairItemId !== undefined) {
            const raw = data.repairItemId;
            patch.repair_item_id = raw != null && raw !== "" ? parseInt(raw, 10) : null;
          }
          await skaftinClient.put(routes.maintenance.vehicleIssues.update, {
            data: patch,
            where: { id: numericId },
          });
        } catch {
          /* local update */
        }
      }
      const updated = vehicleIssues
        .map((x) => {
          if (x.id !== id) return x;
          const title = data.title !== undefined ? data.title.trim() : x.title;
          const description =
            data.description !== undefined ? data.description.trim() || undefined : x.description;
          const status = data.status !== undefined ? data.status : x.status;
          const notedOdometerKm =
            data.notedOdometerKm !== undefined ? data.notedOdometerKm : x.notedOdometerKm;
          let resolvedAt = x.resolvedAt;
          if (data.status === "open") resolvedAt = undefined;
          else if (data.status === "resolved") resolvedAt = data.resolvedAt ?? now;
          else if (data.resolvedAt !== undefined) resolvedAt = data.resolvedAt;
          let repairItemId = x.repairItemId;
          if (data.repairItemSlug !== undefined) {
            repairItemId =
              resolvedRepairItemId != null ? String(resolvedRepairItemId) : undefined;
          } else if (data.repairItemId !== undefined) {
            repairItemId = data.repairItemId || undefined;
          }
          return { ...x, title, description, status, notedOdometerKm, resolvedAt, repairItemId, updatedAt: now };
        })
        .sort(sortVehicleIssues);
      setVehicleIssues(updated);
      await save(STORAGE_KEYS.vehicleIssues, updated);
    },
    [vehicleIssues]
  );

  const deleteVehicleIssue = useCallback(
    async (id: string) => {
      const numericId = parseInt(id, 10);
      if (!Number.isNaN(numericId)) {
        try {
          await skaftinClient.delete(routes.maintenance.vehicleIssues.delete, {
            where: { id: numericId },
          });
        } catch {
          /* still remove locally */
        }
      }
      const updated = vehicleIssues.filter((x) => x.id !== id);
      setVehicleIssues(updated);
      await save(STORAGE_KEYS.vehicleIssues, updated);
    },
    [vehicleIssues]
  );

  const updateFuelLog = useCallback(
    async (id: string, data: Partial<Pick<FuelLog, "liters" | "costPerLiter" | "totalCost" | "odometer" | "date" | "fullTank">>) => {
      const numericId = parseInt(id, 10);
      if (!Number.isNaN(numericId)) {
        try {
          await skaftinClient.put(routes.maintenance.fuelLogs.update, {
            data: {
              ...(data.liters !== undefined && { litres: data.liters }),
              ...(data.totalCost !== undefined && { cost: data.totalCost }),
              ...(data.odometer !== undefined && { odometer_km: data.odometer }),
              ...(data.fullTank !== undefined && { fuel_level_percent: data.fullTank ? 100 : null }),
              ...(data.date !== undefined && { logged_at: data.date }),
            },
            where: { id: numericId },
          });
        } catch {
          /* update locally anyway */
        }
      }
      const updated = fuelLogs.map((l) => (l.id === id ? { ...l, ...data } : l));
      setFuelLogs(updated);
      await save(STORAGE_KEYS.fuelLogs, updated);
    },
    [fuelLogs]
  );

  const updateOdometerLog = useCallback(
    async (id: string, data: Partial<Pick<OdometerLog, "reading" | "date" | "note">>) => {
      const numericId = parseInt(id, 10);
      if (!Number.isNaN(numericId)) {
        try {
          await skaftinClient.put(routes.maintenance.odometerLogs.update, {
            data: {
              ...(data.reading !== undefined && { reading_km: data.reading }),
              ...(data.date !== undefined && { logged_at: data.date }),
              ...(data.note !== undefined && { note: data.note ?? null }),
            },
            where: { id: numericId },
          });
        } catch {
          /* update locally anyway */
        }
      }
      const updated = odometerLogs.map((l) => (l.id === id ? { ...l, ...data } : l));
      setOdometerLogs(updated);
      await save(STORAGE_KEYS.odometerLogs, updated);
    },
    [odometerLogs]
  );

  const getLatestServiceLogForItem = useCallback(
    async (vehicleId: string, itemSlug: string): Promise<ServiceLog | null> => {
      const vid = parseInt(vehicleId, 10);
      if (Number.isNaN(vid) || !itemSlug.trim()) return null;
      try {
        const catalog = await fetchServiceCatalogRows();
        const itemRow = catalog.find((r) => r.slug === itemSlug.trim());
        const itemId = itemRow?.id != null ? Number(itemRow.id) : NaN;
        if (Number.isNaN(itemId)) return null;

        const linksRes = await skaftinClient.post<Record<string, any>[]>(
          routes.maintenance.serviceLogItems.list,
          { where: { service_item_id: itemId } }
        );
        const links = Array.isArray(linksRes.data) ? linksRes.data : [];
        if (links.length === 0) return null;

        const rows = await Promise.all(
          links.map(async (link) => {
            try {
              const logRes = await skaftinClient.post<Record<string, any>[]>(
                routes.maintenance.serviceLogs.list,
                { where: { id: Number(link.service_log_id), vehicle_id: vid } }
              );
              return Array.isArray(logRes.data) && logRes.data.length > 0 ? logRes.data[0] : null;
            } catch {
              return null;
            }
          })
        );

        const mapped = rows
          .filter((row): row is Record<string, any> => row != null)
          .map((row) => rowToServiceLog(row, "service"))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return mapped[0] ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteFuelLog = useCallback(
    async (id: string) => {
      const numericId = parseInt(id, 10);
      if (!Number.isNaN(numericId)) {
        try {
          await skaftinClient.delete(routes.maintenance.fuelLogs.delete, { where: { id: numericId } });
        } catch {
          /* local */
        }
      }
      const updated = fuelLogs.filter((l) => l.id !== id);
      setFuelLogs(updated);
      await save(STORAGE_KEYS.fuelLogs, updated);
    },
    [fuelLogs]
  );

  const updateLastCheck = useCallback(
    async (vehicleId: string, field: keyof Omit<LastCheck, "vehicleId">, date: string) => {
      try {
        await skaftinClient.post(routes.maintenance.vehicleChecks.create, {
          data: {
            vehicle_id: parseInt(vehicleId, 10),
            check_type: LAST_CHECK_FIELD_TO_DB[field],
            status: "good",
            checked_at: date,
            note: null,
          },
        });
      } catch {
        /* still update local */
      }
      const existing = lastChecks.find((c) => c.vehicleId === vehicleId);
      let updated: LastCheck[];
      if (existing) {
        updated = lastChecks.map((c) =>
          c.vehicleId === vehicleId ? { ...c, [field]: date } : c
        );
      } else {
        const newCheck: LastCheck = {
          vehicleId,
          oil: null,
          tyrePressure: null,
          coolant: null,
          spareWheel: null,
          lights: null,
          [field]: date,
        };
        updated = [...lastChecks, newCheck];
      }
      setLastChecks(updated);
      await save(STORAGE_KEYS.lastChecks, updated);
    },
    [lastChecks]
  );

  const addPartRule = useCallback(
    async (rule: Omit<PartRule, "id">) => {
      let newRule: PartRule = { ...rule, id: generateId() };
      try {
        const res = await skaftinClient.post<Record<string, any>>(routes.maintenance.partsLifeRules.create, {
          data: {
            vehicle_id: parseInt(rule.vehicleId, 10),
            part_name: rule.partName,
            last_change_km: rule.lastReplacedKm,
            expected_life_km: rule.intervalKm,
            warning_threshold_km: Math.max(0, Math.floor(rule.intervalKm * 0.9)),
            interval_days: rule.intervalDays,
            last_replaced_date: rule.lastReplacedDate
              ? rule.lastReplacedDate.slice(0, 10)
              : null,
          },
        });
        if (res.success && res.data) {
          newRule = rowToPartRule(res.data as Record<string, any>);
        }
      } catch {
        /* local */
      }
      const updated = [...partRules, newRule];
      setPartRules(updated);
      await save(STORAGE_KEYS.partRules, updated);
    },
    [partRules]
  );

  const updatePartRule = useCallback(
    async (id: string, data: Partial<PartRule>) => {
      const updated = partRules.map((r) => (r.id === id ? { ...r, ...data } : r));
      setPartRules(updated);
      await save(STORAGE_KEYS.partRules, updated);
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) return;
      const dbPatch: Record<string, any> = {};
      if (data.partName !== undefined) dbPatch.part_name = data.partName;
      if (data.intervalKm !== undefined) {
        dbPatch.expected_life_km = data.intervalKm;
        dbPatch.warning_threshold_km = Math.max(0, Math.floor(data.intervalKm * 0.9));
      }
      if (data.intervalDays !== undefined) dbPatch.interval_days = data.intervalDays;
      if (data.lastReplacedKm !== undefined) dbPatch.last_change_km = data.lastReplacedKm;
      if (data.lastReplacedDate !== undefined) {
        dbPatch.last_replaced_date = data.lastReplacedDate.slice(0, 10) || null;
      }
      if (Object.keys(dbPatch).length === 0) return;
      try {
        await skaftinClient.put(routes.maintenance.partsLifeRules.update, {
          where: { id: numericId },
          data: dbPatch,
        });
      } catch {
        /* local already saved */
      }
    },
    [partRules]
  );

  const deletePartRule = useCallback(
    async (id: string) => {
      const updated = partRules.filter((r) => r.id !== id);
      setPartRules(updated);
      await save(STORAGE_KEYS.partRules, updated);
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) return;
      try {
        await skaftinClient.delete(routes.maintenance.partsLifeRules.delete, { where: { id: numericId } });
      } catch {
        /* local */
      }
    },
    [partRules]
  );

  const upsertLicenseDisk = useCallback(
    async (disk: LicenseDisk) => {
      const regUpper = normalizeRegistration(disk.registerNumber);
      const diskNorm: LicenseDisk = { ...disk, registerNumber: regUpper };
      const exists = licenseDisks.some((d) => d.vehicleId === diskNorm.vehicleId);
      const updated = exists
        ? licenseDisks.map((d) => (d.vehicleId === diskNorm.vehicleId ? diskNorm : d))
        : [...licenseDisks, diskNorm];
      setLicenseDisks(updated);
      await save(STORAGE_KEYS.licenseDisks, updated);
      const data: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (diskNorm.expiryDate) data.license_expiry_date = diskNorm.expiryDate;
      else data.license_expiry_date = null;
      if (diskNorm.engineNumber) data.license_engine_number = diskNorm.engineNumber;
      else data.license_engine_number = null;
      data.license_fees =
        diskNorm.fees != null && !Number.isNaN(Number(diskNorm.fees))
          ? Number(Number(diskNorm.fees).toFixed(2))
          : null;
      if (diskNorm.dateOfTest) data.license_test_date = diskNorm.dateOfTest.slice(0, 10);
      else data.license_test_date = null;
      const diskNo = diskNorm.licenseNo || diskNorm.licenseNumber;
      if (diskNo) data.license_disk_number = diskNo;
      else data.license_disk_number = null;
      if (diskNorm.vin) data.vin = diskNorm.vin;
      if (regUpper) data.registration = regUpper;
      try {
        await skaftinClient.put(routes.vehicles.update, {
          where: { id: parseInt(diskNorm.vehicleId, 10) },
          data,
        });
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === diskNorm.vehicleId
              ? {
                  ...v,
                  ...(diskNorm.vin ? { vin: diskNorm.vin } : {}),
                  ...(regUpper ? { registration: regUpper } : {}),
                }
              : v
          )
        );
        if (activeVehicle?.id === diskNorm.vehicleId) {
          setActiveVehicleState((a) => {
            if (!a || a.id !== diskNorm.vehicleId) return a;
            return {
              ...a,
              ...(diskNorm.vin ? { vin: diskNorm.vin } : {}),
              ...(regUpper ? { registration: regUpper } : {}),
            };
          });
        }
      } catch {
        /* local saved */
      }
    },
    [licenseDisks, activeVehicle]
  );

  const licenseDisk = useCallback((vehicleId: string) => {
    return licenseDisks.find((d) => d.vehicleId === vehicleId);
  }, [licenseDisks]);

  const getEfficiencyMetrics = useCallback(
    (vehicleId: string) => {
      const vFuel = fuelLogs.filter((f) => f.vehicleId === vehicleId);
      if (vFuel.length === 0) return { avgKmPerL: 0, avgCostPerKm: 0, totalFuelCost: 0 };
      const totalFuelCost = vFuel.reduce((sum, f) => sum + f.totalCost, 0);
      const fullTankLogs = vFuel.filter((f) => f.fullTank).sort((a, b) => a.odometer - b.odometer);
      let avgKmPerL = 0;
      if (fullTankLogs.length >= 2) {
        let totalKm = 0;
        let totalLiters = 0;
        for (let i = 1; i < fullTankLogs.length; i++) {
          totalKm += fullTankLogs[i].odometer - fullTankLogs[i - 1].odometer;
          totalLiters += fullTankLogs[i].liters;
        }
        avgKmPerL = totalLiters > 0 ? totalKm / totalLiters : 0;
      }
      const totalKmDriven = (() => {
        const v = vehicles.find((x) => x.id === vehicleId);
        if (!v) return 0;
        const oLogs = odometerLogs
          .filter((o) => o.vehicleId === vehicleId)
          .sort((a, b) => a.reading - b.reading);
        if (oLogs.length === 0) return v.currentOdometer;
        return oLogs[oLogs.length - 1].reading - oLogs[0].reading;
      })();
      const avgCostPerKm = totalKmDriven > 0 ? totalFuelCost / totalKmDriven : 0;
      return { avgKmPerL, avgCostPerKm, totalFuelCost };
    },
    [fuelLogs, odometerLogs, vehicles]
  );

  if (!loaded) return null;

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        odometerLogs,
        fuelLogs,
        serviceLogs,
        vehicleIssues,
        lastChecks,
        partRules,
        setActiveVehicle,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addOdometerLog,
        addFuelLog,
        addServiceLog,
        deleteServiceLog,
        updateServiceLog,
        addVehicleIssue,
        updateVehicleIssue,
        deleteVehicleIssue,
        getLatestServiceLogForItem,
        deleteFuelLog,
        updateFuelLog,
        updateOdometerLog,
        updateLastCheck,
        addPartRule,
        updatePartRule,
        deletePartRule,
        upsertLicenseDisk,
        licenseDisk,
        getEfficiencyMetrics,
        refreshLogs,
        FREE_TIER_LIMIT,
        isFleetMode,
        vehicleOwnership,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error("useVehicle must be used inside VehicleProvider");
  return ctx;
}
