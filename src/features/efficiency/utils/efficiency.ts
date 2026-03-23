import type { FuelLog, OdometerLog, PartLifeRule, PartReminder } from '@/types/Types';

export const calculateKmPerLitre = (fuelLogs: FuelLog[]) => {
  if (fuelLogs.length < 2) return 0;
  const sorted = [...fuelLogs].sort((a, b) => a.odometer_km - b.odometer_km);
  const distance = sorted[sorted.length - 1].odometer_km - sorted[0].odometer_km;
  const litres = sorted.reduce((sum, log) => sum + log.litres, 0);
  return litres > 0 ? Number((distance / litres).toFixed(2)) : 0;
};

export const calculateCostPerKm = (fuelLogs: FuelLog[]) => {
  if (fuelLogs.length < 2) return 0;
  const sorted = [...fuelLogs].sort((a, b) => a.odometer_km - b.odometer_km);
  const distance = sorted[sorted.length - 1].odometer_km - sorted[0].odometer_km;
  const cost = sorted.reduce((sum, log) => sum + log.cost, 0);
  return distance > 0 ? Number((cost / distance).toFixed(2)) : 0;
};

export const calculatePartReminders = (
  odometerLogs: OdometerLog[],
  partRules: PartLifeRule[]
): PartReminder[] => {
  const currentKm = odometerLogs.length
    ? Math.max(...odometerLogs.map((entry) => entry.reading_km))
    : 0;

  return partRules.map((rule, index) => {
    const dueAtKm = rule.last_change_km + rule.expected_life_km;
    const remainingKm = dueAtKm - currentKm;
    const status = remainingKm <= 0 ? 'due' : remainingKm <= rule.warning_threshold_km ? 'warning' : 'ok';

    return {
      id: rule.id ?? index + 1,
      vehicle_id: rule.vehicle_id,
      part_name: rule.part_name,
      due_at_km: dueAtKm,
      remaining_km: remainingKm,
      status,
    };
  });
};
