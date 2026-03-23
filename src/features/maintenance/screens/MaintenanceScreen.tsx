import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import { useAppTheme } from '@/themes/AppTheme';
import useVehicleStore from '@/features/vehicles/store/useVehicleStore';
import { ToastStateStore } from '@/stores/StoresIndex';
import { FONT_FAMILY } from '@/constants/Fonts';

const MaintenanceScreen = () => {
  const { colors } = useAppTheme();
  const { showToast } = ToastStateStore();
  const { activeVehicleId, addOdometerLog, addServiceLog, addRepairLog, addCheck } = useVehicleStore();
  const [odometer, setOdometer] = useState('');
  const [serviceType, setServiceType] = useState('Oil Service');
  const [repairType, setRepairType] = useState('General Repair');

  const vehicleId = activeVehicleId ?? 0;

  const safeNumber = (v: string) => Number(v) || 0;

  const onSaveLogs = async () => {
    if (!vehicleId) {
      showToast({ message: 'Select a vehicle before logging maintenance.', type: 'warning' });
      return;
    }
    const now = new Date().toISOString();
    try {
      await addOdometerLog({ vehicle_id: vehicleId, reading_km: safeNumber(odometer), logged_at: now });
      await addServiceLog({
        vehicle_id: vehicleId,
        service_type: serviceType,
        service_km: safeNumber(odometer),
        service_date: now,
      });
      await addRepairLog({
        vehicle_id: vehicleId,
        repair_type: repairType,
        repair_km: safeNumber(odometer),
        repair_date: now,
      });
      await addCheck({ vehicle_id: vehicleId, check_type: 'oil', status: 'good', checked_at: now, note: 'Logged from maintenance quick action' });
      showToast({ message: 'Maintenance logs saved.', type: 'success' });
    } catch (error: any) {
      showToast({ message: error?.message ?? 'Could not save logs.', type: 'error' });
    }
  };

  return (
    <ScreenScaffold title="Maintenance" subtitle="Log odometer, service, repairs, and checks">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput value={odometer} onChangeText={setOdometer} keyboardType="numeric" placeholder="Odometer km" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <TextInput value={serviceType} onChangeText={setServiceType} placeholder="Service type" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <TextInput value={repairType} onChangeText={setRepairType} placeholder="Repair type" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onSaveLogs}>
          <Text style={styles.buttonText}>Save maintenance log</Text>
        </Pressable>
      </View>
      <Text style={{ color: colors.textMuted }}>
        Last checks covered: oil, tyre pressure, coolant, spare wheel, and lights.
      </Text>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 10, fontFamily: FONT_FAMILY.poppinsRegular },
  button: { borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontFamily: FONT_FAMILY.nexaBold },
});

export default MaintenanceScreen;
