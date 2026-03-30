import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  registration: string;
  color: string;
  image?: string;
  currentOdometer: number;
  createdAt: string;
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
  lastChecks: LastCheck[];
  partRules: PartRule[];
  licenseDisk: (vehicleId: string) => LicenseDisk | undefined;
  setActiveVehicle: (v: Vehicle) => void;
  addVehicle: (v: Omit<Vehicle, "id" | "createdAt">) => Promise<boolean>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addOdometerLog: (log: Omit<OdometerLog, "id">) => Promise<void>;
  addFuelLog: (log: Omit<FuelLog, "id">) => Promise<void>;
  addServiceLog: (log: Omit<ServiceLog, "id">) => Promise<void>;
  deleteServiceLog: (id: string) => Promise<void>;
  deleteFuelLog: (id: string) => Promise<void>;
  updateLastCheck: (vehicleId: string, field: keyof Omit<LastCheck, "vehicleId">, date: string) => Promise<void>;
  addPartRule: (rule: Omit<PartRule, "id">) => Promise<void>;
  updatePartRule: (id: string, data: Partial<PartRule>) => Promise<void>;
  deletePartRule: (id: string) => Promise<void>;
  upsertLicenseDisk: (disk: LicenseDisk) => Promise<void>;
  getEfficiencyMetrics: (vehicleId: string) => { avgKmPerL: number; avgCostPerKm: number; totalFuelCost: number };
  FREE_TIER_LIMIT: number;
};

const VehicleContext = createContext<VehicleContextType | null>(null);

const STORAGE_KEYS = {
  vehicles: "rydnex_vehicles",
  activeVehicleId: "rydnex_active_vehicle",
  odometerLogs: "rydnex_odometer_logs",
  fuelLogs: "rydnex_fuel_logs",
  serviceLogs: "rydnex_service_logs",
  lastChecks: "rydnex_last_checks",
  partRules: "rydnex_part_rules",
  licenseDisks: "rydnex_license_disks",
};

const FREE_TIER_LIMIT = 2;

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
  } catch { }
}

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicleState] = useState<Vehicle | null>(null);
  const [odometerLogs, setOdometerLogs] = useState<OdometerLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [lastChecks, setLastChecks] = useState<LastCheck[]>([]);
  const [partRules, setPartRules] = useState<PartRule[]>([]);
  const [licenseDisks, setLicenseDisks] = useState<LicenseDisk[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [v, activeId, odo, fuel, svc, checks, rules, disks] = await Promise.all([
        load<Vehicle[]>(STORAGE_KEYS.vehicles, []),
        load<string | null>(STORAGE_KEYS.activeVehicleId, null),
        load<OdometerLog[]>(STORAGE_KEYS.odometerLogs, []),
        load<FuelLog[]>(STORAGE_KEYS.fuelLogs, []),
        load<ServiceLog[]>(STORAGE_KEYS.serviceLogs, []),
        load<LastCheck[]>(STORAGE_KEYS.lastChecks, []),
        load<PartRule[]>(STORAGE_KEYS.partRules, []),
        load<LicenseDisk[]>(STORAGE_KEYS.licenseDisks, []),
      ]);
      setVehicles(v);
      setOdometerLogs(odo);
      setFuelLogs(fuel);
      setServiceLogs(svc);
      setLastChecks(checks);
      setPartRules(rules);
      setLicenseDisks(disks);
      if (v.length > 0) {
        const active = activeId ? v.find((x) => x.id === activeId) ?? v[0] : v[0];
        setActiveVehicleState(active);
      }
      setLoaded(true);
    })();
  }, []);

  const setActiveVehicle = useCallback((v: Vehicle) => {
    setActiveVehicleState(v);
    save(STORAGE_KEYS.activeVehicleId, v.id);
  }, []);

  const addVehicle = useCallback(async (data: Omit<Vehicle, "id" | "createdAt">): Promise<boolean> => {
    if (vehicles.length >= FREE_TIER_LIMIT) return false;
    const newVehicle: Vehicle = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [...vehicles, newVehicle];
    setVehicles(updated);
    await save(STORAGE_KEYS.vehicles, updated);
    if (!activeVehicle) {
      setActiveVehicleState(newVehicle);
      await save(STORAGE_KEYS.activeVehicleId, newVehicle.id);
    }
    return true;
  }, [vehicles, activeVehicle]);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    const updated = vehicles.map((v) => v.id === id ? { ...v, ...data } : v);
    setVehicles(updated);
    await save(STORAGE_KEYS.vehicles, updated);
    if (activeVehicle?.id === id) {
      const newActive = updated.find((v) => v.id === id) ?? null;
      setActiveVehicleState(newActive);
    }
  }, [vehicles, activeVehicle]);

  const deleteVehicle = useCallback(async (id: string) => {
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);
    await save(STORAGE_KEYS.vehicles, updated);
    if (activeVehicle?.id === id) {
      const next = updated[0] ?? null;
      setActiveVehicleState(next);
      await save(STORAGE_KEYS.activeVehicleId, next?.id ?? null);
    }
    // Clean up logs
    const updatedOdo = odometerLogs.filter((l) => l.vehicleId !== id);
    const updatedFuel = fuelLogs.filter((l) => l.vehicleId !== id);
    const updatedSvc = serviceLogs.filter((l) => l.vehicleId !== id);
    const updatedChecks = lastChecks.filter((l) => l.vehicleId !== id);
    const updatedRules = partRules.filter((l) => l.vehicleId !== id);
    const updatedDisks = licenseDisks.filter((l) => l.vehicleId !== id);
    setOdometerLogs(updatedOdo);
    setFuelLogs(updatedFuel);
    setServiceLogs(updatedSvc);
    setLastChecks(updatedChecks);
    setPartRules(updatedRules);
    setLicenseDisks(updatedDisks);
    await Promise.all([
      save(STORAGE_KEYS.odometerLogs, updatedOdo),
      save(STORAGE_KEYS.fuelLogs, updatedFuel),
      save(STORAGE_KEYS.serviceLogs, updatedSvc),
      save(STORAGE_KEYS.lastChecks, updatedChecks),
      save(STORAGE_KEYS.partRules, updatedRules),
      save(STORAGE_KEYS.licenseDisks, updatedDisks),
    ]);
  }, [vehicles, activeVehicle, odometerLogs, fuelLogs, serviceLogs, lastChecks, partRules]);

  const addOdometerLog = useCallback(async (log: Omit<OdometerLog, "id">) => {
    const newLog: OdometerLog = { ...log, id: generateId() };
    const updated = [newLog, ...odometerLogs];
    setOdometerLogs(updated);
    await save(STORAGE_KEYS.odometerLogs, updated);
    // Update vehicle's current odometer
    const vehicle = vehicles.find((v) => v.id === log.vehicleId);
    if (vehicle && log.reading > vehicle.currentOdometer) {
      await updateVehicle(log.vehicleId, { currentOdometer: log.reading });
    }
  }, [odometerLogs, vehicles, updateVehicle]);

  const addFuelLog = useCallback(async (log: Omit<FuelLog, "id">) => {
    const newLog: FuelLog = { ...log, id: generateId() };
    const updated = [newLog, ...fuelLogs];
    setFuelLogs(updated);
    await save(STORAGE_KEYS.fuelLogs, updated);
  }, [fuelLogs]);

  const addServiceLog = useCallback(async (log: Omit<ServiceLog, "id">) => {
    const newLog: ServiceLog = { ...log, id: generateId() };
    const updated = [newLog, ...serviceLogs];
    setServiceLogs(updated);
    await save(STORAGE_KEYS.serviceLogs, updated);
  }, [serviceLogs]);

  const deleteServiceLog = useCallback(async (id: string) => {
    const updated = serviceLogs.filter((l) => l.id !== id);
    setServiceLogs(updated);
    await save(STORAGE_KEYS.serviceLogs, updated);
  }, [serviceLogs]);

  const deleteFuelLog = useCallback(async (id: string) => {
    const updated = fuelLogs.filter((l) => l.id !== id);
    setFuelLogs(updated);
    await save(STORAGE_KEYS.fuelLogs, updated);
  }, [fuelLogs]);

  const updateLastCheck = useCallback(async (vehicleId: string, field: keyof Omit<LastCheck, "vehicleId">, date: string) => {
    const existing = lastChecks.find((c) => c.vehicleId === vehicleId);
    let updated: LastCheck[];
    if (existing) {
      updated = lastChecks.map((c) => c.vehicleId === vehicleId ? { ...c, [field]: date } : c);
    } else {
      const newCheck: LastCheck = { vehicleId, oil: null, tyrePressure: null, coolant: null, spareWheel: null, lights: null, [field]: date };
      updated = [...lastChecks, newCheck];
    }
    setLastChecks(updated);
    await save(STORAGE_KEYS.lastChecks, updated);
  }, [lastChecks]);

  const addPartRule = useCallback(async (rule: Omit<PartRule, "id">) => {
    const newRule: PartRule = { ...rule, id: generateId() };
    const updated = [...partRules, newRule];
    setPartRules(updated);
    await save(STORAGE_KEYS.partRules, updated);
  }, [partRules]);

  const updatePartRule = useCallback(async (id: string, data: Partial<PartRule>) => {
    const updated = partRules.map((r) => r.id === id ? { ...r, ...data } : r);
    setPartRules(updated);
    await save(STORAGE_KEYS.partRules, updated);
  }, [partRules]);

  const deletePartRule = useCallback(async (id: string) => {
    const updated = partRules.filter((r) => r.id !== id);
    setPartRules(updated);
    await save(STORAGE_KEYS.partRules, updated);
  }, [partRules]);

  const upsertLicenseDisk = useCallback(async (disk: LicenseDisk) => {
    const exists = licenseDisks.some((d) => d.vehicleId === disk.vehicleId);
    const updated = exists
      ? licenseDisks.map((d) => d.vehicleId === disk.vehicleId ? disk : d)
      : [...licenseDisks, disk];
    setLicenseDisks(updated);
    await save(STORAGE_KEYS.licenseDisks, updated);
  }, [licenseDisks]);

  const licenseDisk = useCallback((vehicleId: string) => {
    return licenseDisks.find((d) => d.vehicleId === vehicleId);
  }, [licenseDisks]);

  const getEfficiencyMetrics = useCallback((vehicleId: string) => {
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
      const oLogs = odometerLogs.filter((o) => o.vehicleId === vehicleId).sort((a, b) => a.reading - b.reading);
      if (oLogs.length === 0) return v.currentOdometer;
      return oLogs[oLogs.length - 1].reading - oLogs[0].reading;
    })();
    const avgCostPerKm = totalKmDriven > 0 ? totalFuelCost / totalKmDriven : 0;
    return { avgKmPerL, avgCostPerKm, totalFuelCost };
  }, [fuelLogs, odometerLogs, vehicles]);

  if (!loaded) return null;

  return (
    <VehicleContext.Provider value={{
      vehicles, activeVehicle, odometerLogs, fuelLogs, serviceLogs, lastChecks, partRules,
      setActiveVehicle, addVehicle, updateVehicle, deleteVehicle,
      addOdometerLog, addFuelLog, addServiceLog, deleteServiceLog, deleteFuelLog,
      updateLastCheck, addPartRule, updatePartRule, deletePartRule,
      upsertLicenseDisk, licenseDisk,
      getEfficiencyMetrics, FREE_TIER_LIMIT,
    }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error("useVehicle must be used inside VehicleProvider");
  return ctx;
}
