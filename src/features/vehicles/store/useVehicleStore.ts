import { create } from 'zustand';
import { vehicleRepository } from '@/backend';
import { staticDataStore } from '@/fixtures/staticData';
import type {
  FuelLog,
  OdometerLog,
  PartLifeRule,
  RepairLog,
  ServiceLog,
  Vehicle,
  VehicleCheck,
} from '@/types/Types';

type CreateVehiclePayload = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

interface VehicleState {
  vehicles: Vehicle[];
  activeVehicleId: number | null;
  odometerLogs: OdometerLog[];
  serviceLogs: ServiceLog[];
  repairLogs: RepairLog[];
  fuelLogs: FuelLog[];
  checks: VehicleCheck[];
  partRules: PartLifeRule[];
  loading: boolean;
  error: string | null;
  setActiveVehicle: (vehicleId: number) => void;
  fetchVehicles: (userId: number) => Promise<void>;
  createVehicle: (payload: CreateVehiclePayload) => Promise<void>;
  addOdometerLog: (payload: Omit<OdometerLog, 'id'>) => Promise<void>;
  addServiceLog: (payload: Omit<ServiceLog, 'id'>) => Promise<void>;
  addRepairLog: (payload: Omit<RepairLog, 'id'>) => Promise<void>;
  addFuelLog: (payload: Omit<FuelLog, 'id'>) => Promise<void>;
  addCheck: (payload: Omit<VehicleCheck, 'id'>) => Promise<void>;
  addPartRule: (payload: Omit<PartLifeRule, 'id'>) => Promise<void>;
}

const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [...staticDataStore.vehicles],
  activeVehicleId: staticDataStore.vehicles[0]?.id ?? null,
  odometerLogs: [...staticDataStore.odometerLogs],
  serviceLogs: [...staticDataStore.serviceLogs],
  repairLogs: [...staticDataStore.repairLogs],
  fuelLogs: [...staticDataStore.fuelLogs],
  checks: [...staticDataStore.vehicleChecks],
  partRules: [...staticDataStore.partRules],
  loading: false,
  error: null,
  setActiveVehicle: (activeVehicleId) => set({ activeVehicleId }),
  fetchVehicles: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await vehicleRepository.listVehicles(userId);
      set({
        vehicles: response.data ?? [],
        loading: false,
        activeVehicleId: response.data?.[0]?.id ?? null,
      });
    } catch (error: any) {
      set({ loading: false, error: error?.message ?? 'Unable to load vehicles.' });
    }
  },
  createVehicle: async (payload) => {
    const currentVehicles = get().vehicles;
    if (currentVehicles.length >= 2) {
      throw new Error('Free tier allows up to 2 vehicles.');
    }
    const response = await vehicleRepository.createVehicle(payload);
    set({ vehicles: [response.data, ...currentVehicles], activeVehicleId: response.data.id });
  },
  addOdometerLog: async (payload) => {
    const response = await vehicleRepository.addOdometerLog(payload);
    set((state) => ({ odometerLogs: [response.data, ...state.odometerLogs] }));
  },
  addServiceLog: async (payload) => {
    const response = await vehicleRepository.addServiceLog(payload);
    set((state) => ({ serviceLogs: [response.data, ...state.serviceLogs] }));
  },
  addRepairLog: async (payload) => {
    const response = await vehicleRepository.addRepairLog(payload);
    set((state) => ({ repairLogs: [response.data, ...state.repairLogs] }));
  },
  addFuelLog: async (payload) => {
    const response = await vehicleRepository.addFuelLog(payload);
    set((state) => ({ fuelLogs: [response.data, ...state.fuelLogs] }));
  },
  addCheck: async (payload) => {
    const response = await vehicleRepository.addVehicleCheck(payload);
    set((state) => ({ checks: [response.data, ...state.checks] }));
  },
  addPartRule: async (payload) => {
    const response = await vehicleRepository.addPartLifeRule(payload);
    set((state) => ({ partRules: [response.data, ...state.partRules] }));
  },
}));

export default useVehicleStore;
