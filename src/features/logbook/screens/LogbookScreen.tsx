import React, { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import useVehicleStore from '@/features/vehicles/store/useVehicleStore';
import { useAppTheme } from '@/themes/AppTheme';

type Entry = { id: string; type: string; date: string; details: string };

const LogbookScreen = () => {
  const { colors } = useAppTheme();
  const { serviceLogs, repairLogs, fuelLogs, odometerLogs } = useVehicleStore();

  const entries = useMemo<Entry[]>(() => {
    const mapped: Entry[] = [
      ...serviceLogs.map((item) => ({
        id: `s-${item.id}`,
        type: 'Service',
        date: item.service_date,
        details: `${item.service_type} at ${item.service_km} km`,
      })),
      ...repairLogs.map((item) => ({
        id: `r-${item.id}`,
        type: 'Repair',
        date: item.repair_date,
        details: `${item.repair_type} at ${item.repair_km} km`,
      })),
      ...fuelLogs.map((item) => ({
        id: `f-${item.id}`,
        type: 'Fuel',
        date: item.logged_at,
        details: `${item.litres}L at ${item.odometer_km} km`,
      })),
      ...odometerLogs.map((item) => ({
        id: `o-${item.id}`,
        type: 'Odometer',
        date: item.logged_at,
        details: `${item.reading_km} km`,
      })),
    ];
    return mapped.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [serviceLogs, repairLogs, fuelLogs, odometerLogs]);

  return (
    <ScreenScaffold title="Logbook" subtitle="Unified timeline of your vehicle history">
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: colors.textMuted }}>No entries yet.</Text>}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{item.type}</Text>
            <Text style={{ color: colors.textMuted }}>{new Date(item.date).toLocaleString()}</Text>
            <Text style={{ color: colors.text }}>{item.details}</Text>
          </View>
        )}
      />
    </ScreenScaffold>
  );
};

export default LogbookScreen;
