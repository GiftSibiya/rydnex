import { staticDataStore, getNextId } from '@/fixtures/staticData';
import { calculatePartReminders } from '@/features/efficiency/utils/efficiency';
import type { ApiResponseType } from '@/types/Types';
import { STATIC_DATA_MODE } from '@/constants/AppConfig';
import type {
  FuelLog,
  OdometerLog,
  PartLifeRule,
  PartReminder,
  RepairLog,
  ServiceLog,
  Vehicle,
  VehicleCheck,
} from '@/types/Types';

const ok = <T>(data: T): ApiResponseType<T> => {
  if (!STATIC_DATA_MODE) {
    throw new Error('Static data mode disabled. Re-enable Skaftin repository implementation.');
  }
  return { success: true, data };
};

const nowIso = () => new Date().toISOString();

const refreshRemindersForVehicle = (vehicleId: number) => {
  const odometerLogs = staticDataStore.odometerLogs.filter((item) => item.vehicle_id === vehicleId);
  const partRules = staticDataStore.partRules.filter((item) => item.vehicle_id === vehicleId);
  const generated = calculatePartReminders(odometerLogs, partRules);

  const untouched = staticDataStore.partReminders.filter((item) => item.vehicle_id !== vehicleId);
  staticDataStore.partReminders = [...untouched, ...generated];
};

export const vehicleRepository = {
  async listVehicles(userId: number) {
    const data = staticDataStore.vehicles.filter((item) => item.user_id === userId);
    return ok(data);
  },
  async createVehicle(data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
    const created: Vehicle = {
      ...data,
      registration: String(data.registration ?? '').trim().toUpperCase(),
      id: getNextId(staticDataStore.vehicles),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    staticDataStore.vehicles.unshift(created);
    return ok(created);
  },
  async listOdometerLogs(vehicleId: number) {
    return ok(staticDataStore.odometerLogs.filter((item) => item.vehicle_id === vehicleId));
  },
  async addOdometerLog(data: Omit<OdometerLog, 'id'>) {
    const created: OdometerLog = {
      ...data,
      id: getNextId(staticDataStore.odometerLogs),
    };
    staticDataStore.odometerLogs.unshift(created);
    refreshRemindersForVehicle(data.vehicle_id);
    return ok(created);
  },
  async listServiceLogs(vehicleId: number) {
    return ok(staticDataStore.serviceLogs.filter((item) => item.vehicle_id === vehicleId));
  },
  async addServiceLog(data: Omit<ServiceLog, 'id'>) {
    const created: ServiceLog = {
      ...data,
      id: getNextId(staticDataStore.serviceLogs),
    };
    staticDataStore.serviceLogs.unshift(created);
    return ok(created);
  },
  async listRepairLogs(vehicleId: number) {
    return ok(staticDataStore.repairLogs.filter((item) => item.vehicle_id === vehicleId));
  },
  async addRepairLog(data: Omit<RepairLog, 'id'>) {
    const created: RepairLog = {
      ...data,
      id: getNextId(staticDataStore.repairLogs),
    };
    staticDataStore.repairLogs.unshift(created);
    return ok(created);
  },
  async listFuelLogs(vehicleId: number) {
    return ok(staticDataStore.fuelLogs.filter((item) => item.vehicle_id === vehicleId));
  },
  async addFuelLog(data: Omit<FuelLog, 'id'>) {
    const created: FuelLog = {
      ...data,
      id: getNextId(staticDataStore.fuelLogs),
    };
    staticDataStore.fuelLogs.unshift(created);
    return ok(created);
  },
  async listVehicleChecks(vehicleId: number) {
    return ok(staticDataStore.vehicleChecks.filter((item) => item.vehicle_id === vehicleId));
  },
  async addVehicleCheck(data: Omit<VehicleCheck, 'id'>) {
    const created: VehicleCheck = {
      ...data,
      id: getNextId(staticDataStore.vehicleChecks),
    };
    staticDataStore.vehicleChecks.unshift(created);
    return ok(created);
  },
  async listPartLifeRules(vehicleId: number) {
    return ok(staticDataStore.partRules.filter((item) => item.vehicle_id === vehicleId));
  },
  async addPartLifeRule(data: Omit<PartLifeRule, 'id'>) {
    const created: PartLifeRule = {
      ...data,
      id: getNextId(staticDataStore.partRules),
    };
    staticDataStore.partRules.unshift(created);
    refreshRemindersForVehicle(data.vehicle_id);
    return ok(created);
  },
  async listPartReminders(vehicleId: number) {
    refreshRemindersForVehicle(vehicleId);
    return ok(staticDataStore.partReminders.filter((item) => item.vehicle_id === vehicleId));
  },
  async addPartReminder(data: Omit<PartReminder, 'id'>) {
    const created: PartReminder = {
      ...data,
      id: getNextId(staticDataStore.partReminders),
    };
    staticDataStore.partReminders.unshift(created);
    return ok(created);
  },
  async uploadDocument(formData: FormData) {
    void formData;
    return ok({
      bucket: 'rydnex-documents',
      path: `mock/${Date.now()}`,
      message: 'Document stored in local static mode.',
    });
  },
};
