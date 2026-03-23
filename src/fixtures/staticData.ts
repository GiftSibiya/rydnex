import vehiclesSeed from '@/fixtures/vehicles.json';
import odometerSeed from '@/fixtures/odometerLogs.json';
import serviceSeed from '@/fixtures/serviceLogs.json';
import repairSeed from '@/fixtures/repairLogs.json';
import fuelSeed from '@/fixtures/fuelLogs.json';
import checksSeed from '@/fixtures/vehicleChecks.json';
import partRulesSeed from '@/fixtures/partRules.json';
import partRemindersSeed from '@/fixtures/partReminders.json';
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

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const staticDataStore = {
  vehicles: clone(vehiclesSeed as Vehicle[]),
  odometerLogs: clone(odometerSeed as OdometerLog[]),
  serviceLogs: clone(serviceSeed as ServiceLog[]),
  repairLogs: clone(repairSeed as RepairLog[]),
  fuelLogs: clone(fuelSeed as FuelLog[]),
  vehicleChecks: clone(checksSeed as VehicleCheck[]),
  partRules: clone(partRulesSeed as PartLifeRule[]),
  partReminders: clone(partRemindersSeed as PartReminder[]),
};

export const getNextId = <T extends { id: number }>(items: T[]): number => {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
};
