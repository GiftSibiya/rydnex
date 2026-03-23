import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import MetricCard from '@/shared/ui/MetricCard';
import { useAppTheme } from '@/themes/AppTheme';
import useVehicleStore from '@/features/vehicles/store/useVehicleStore';
import { calculateCostPerKm, calculateKmPerLitre } from '@/features/efficiency/utils/efficiency';
import { FONT_FAMILY } from '@/constants/Fonts';
import { ToastStateStore } from '@/stores/StoresIndex';

const InsightsScreen = () => {
  const { colors } = useAppTheme();
  const { showToast } = ToastStateStore();
  const { fuelLogs, activeVehicleId, addFuelLog } = useVehicleStore();
  const [odometer, setOdometer] = useState('');
  const [litres, setLitres] = useState('');
  const [cost, setCost] = useState('');
  const [fuelLevelPercent, setFuelLevelPercent] = useState('');

  const kmPerLitre = useMemo(() => calculateKmPerLitre(fuelLogs), [fuelLogs]);
  const costPerKm = useMemo(() => calculateCostPerKm(fuelLogs), [fuelLogs]);

  const onSaveFuel = async () => {
    if (!activeVehicleId) {
      showToast({ message: 'Select a vehicle first.', type: 'warning' });
      return;
    }
    try {
      await addFuelLog({
        vehicle_id: activeVehicleId,
        odometer_km: Number(odometer) || 0,
        litres: Number(litres) || 0,
        cost: Number(cost) || 0,
        fuel_level_percent: Number(fuelLevelPercent) || 0,
        logged_at: new Date().toISOString(),
      });
      showToast({ message: 'Fuel entry logged.', type: 'success' });
    } catch (error: any) {
      showToast({ message: error?.message ?? 'Could not save fuel log.', type: 'error' });
    }
  };

  return (
    <ScreenScaffold title="Insights" subtitle="Track efficiency with fuel and odometer logs">
      <MetricCard label="Average km/L" value={`${kmPerLitre || 0}`} />
      <MetricCard label="Cost per km" value={`${costPerKm || 0}`} />
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput value={odometer} onChangeText={setOdometer} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Odometer km" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        <TextInput value={litres} onChangeText={setLitres} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Litres" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        <TextInput value={cost} onChangeText={setCost} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Fuel cost" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        <TextInput value={fuelLevelPercent} onChangeText={setFuelLevelPercent} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Fuel level %" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onSaveFuel}>
          <Text style={styles.buttonText}>Log fuel entry</Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 12 },
  input: { borderWidth: 1, borderRadius: 10, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 10, fontFamily: FONT_FAMILY.poppinsRegular },
  button: { borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontFamily: FONT_FAMILY.nexaBold },
});

export default InsightsScreen;
