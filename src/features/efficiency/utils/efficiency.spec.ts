import {
  calculateCostPerKm,
  calculateKmPerLitre,
  calculatePartReminders,
} from '@/features/efficiency/utils/efficiency';

describe('efficiency utilities', () => {
  it('calculates km per litre', () => {
    const value = calculateKmPerLitre([
      { id: 1, vehicle_id: 1, odometer_km: 1000, litres: 20, cost: 500, logged_at: '2026-03-20' },
      { id: 2, vehicle_id: 1, odometer_km: 1300, litres: 25, cost: 620, logged_at: '2026-03-22' },
    ]);
    expect(value).toBeCloseTo(6.67, 2);
  });

  it('calculates cost per km', () => {
    const value = calculateCostPerKm([
      { id: 1, vehicle_id: 1, odometer_km: 1000, litres: 20, cost: 500, logged_at: '2026-03-20' },
      { id: 2, vehicle_id: 1, odometer_km: 1300, litres: 25, cost: 620, logged_at: '2026-03-22' },
    ]);
    expect(value).toBeCloseTo(3.73, 2);
  });

  it('creates due and warning reminders', () => {
    const reminders = calculatePartReminders(
      [{ id: 1, vehicle_id: 1, reading_km: 56000, logged_at: '2026-03-22' }],
      [
        { id: 1, vehicle_id: 1, part_name: 'Brake Pads', last_change_km: 50000, expected_life_km: 10000, warning_threshold_km: 4000 },
        { id: 2, vehicle_id: 1, part_name: 'Spark Plugs', last_change_km: 45000, expected_life_km: 10000, warning_threshold_km: 2500 },
      ]
    );
    expect(reminders[0].status).toBe('warning');
    expect(reminders[1].status).toBe('due');
  });
});
