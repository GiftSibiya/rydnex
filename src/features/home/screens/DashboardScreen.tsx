import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import MetricCard from '@/shared/ui/MetricCard';
import useVehicleStore from '@/features/vehicles/store/useVehicleStore';
import { calculateCostPerKm, calculateKmPerLitre, calculatePartReminders } from '@/features/efficiency/utils/efficiency';

const DashboardScreen = () => {
  const { vehicles, fuelLogs, odometerLogs, partRules } = useVehicleStore();
  const kmPerLitre = useMemo(() => calculateKmPerLitre(fuelLogs), [fuelLogs]);
  const costPerKm = useMemo(() => calculateCostPerKm(fuelLogs), [fuelLogs]);
  const reminders = useMemo(() => calculatePartReminders(odometerLogs, partRules), [odometerLogs, partRules]);
  const dueCount = reminders.filter((item) => item.status !== 'ok').length;

  return (
    <ScreenScaffold title="Dashboard" subtitle="Luxury vehicle command centre">
      <ScrollView>
        <MetricCard label="Vehicles" value={`${vehicles.length}`} hint="Free tier supports up to 2" />
        <MetricCard label="Efficiency" value={`${kmPerLitre || 0} km/L`} hint={`${costPerKm || 0} currency / km`} />
        <MetricCard label="Parts alerts" value={`${dueCount}`} hint="Based on odometer progression" />
        <View>
          <Text style={{ opacity: 0.75 }}>
            Insurance and mechanic partnerships are prepared as “coming soon” sections in Profile.
          </Text>
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
};

export default DashboardScreen;
