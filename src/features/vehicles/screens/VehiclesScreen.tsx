import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import { AuthStore, ToastStateStore } from '@/stores/StoresIndex';
import { useAppTheme } from '@/themes/AppTheme';
import useVehicleStore from '@/features/vehicles/store/useVehicleStore';
import { FONT_FAMILY } from '@/constants/Fonts';

const VehiclesScreen = () => {
  const { colors } = useAppTheme();
  const { user } = AuthStore();
  const { showToast } = ToastStateStore();
  const { vehicles, fetchVehicles, createVehicle, setActiveVehicle, activeVehicleId } = useVehicleStore();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const canAddMore = vehicles.length < 2;
  const activeVehicle = useMemo(
    () => vehicles.find((item) => item.id === activeVehicleId) ?? null,
    [vehicles, activeVehicleId]
  );

  const onLoad = async () => {
    if (!user?.id) return;
    await fetchVehicles(user.id);
  };

  const onCreate = async () => {
    if (!user?.id) return;
    try {
      await createVehicle({
        user_id: user.id,
        make,
        model,
        vin,
        registration_number: registrationNumber,
        is_active: true,
      });
      showToast({ message: 'Vehicle added to your logbook.', type: 'success' });
      setMake('');
      setModel('');
      setVin('');
      setRegistrationNumber('');
    } catch (error: any) {
      showToast({ message: error?.message ?? 'Could not add vehicle.', type: 'warning' });
    }
  };

  return (
    <ScreenScaffold title="Vehicles" subtitle="Create and manage your vehicle profiles">
      <View style={{ marginBottom: 12 }}>
        <Pressable onPress={onLoad} style={[styles.button, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.buttonText, { color: colors.text }]}>Refresh vehicles</Text>
        </Pressable>
      </View>
      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput value={make} onChangeText={setMake} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Make" placeholderTextColor={colors.textMuted} />
        <TextInput value={model} onChangeText={setModel} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Model" placeholderTextColor={colors.textMuted} />
        <TextInput value={vin} onChangeText={setVin} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="VIN number" placeholderTextColor={colors.textMuted} />
        <TextInput value={registrationNumber} onChangeText={setRegistrationNumber} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Registration" placeholderTextColor={colors.textMuted} />
        <Pressable onPress={onCreate} disabled={!canAddMore} style={[styles.button, { backgroundColor: canAddMore ? colors.primary : colors.Grey }]}>
          <Text style={styles.buttonText}>{canAddMore ? 'Add vehicle' : 'Upgrade to add more vehicles'}</Text>
        </Pressable>
      </View>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <Pressable onPress={() => setActiveVehicle(item.id)} style={[styles.vehicleRow, { backgroundColor: item.id === activeVehicleId ? colors.surfaceAlt : colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.vehicleName, { color: colors.text }]}>{item.make} {item.model}</Text>
            <Text style={{ color: colors.textMuted }}>{item.registration_number}</Text>
          </Pressable>
        )}
      />
      {activeVehicle ? <Text style={{ color: colors.textMuted, marginTop: 8 }}>Active vehicle: {activeVehicle.make} {activeVehicle.model}</Text> : null}
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  formCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 10, fontFamily: FONT_FAMILY.poppinsRegular },
  button: { borderRadius: 10, paddingVertical: 10, borderWidth: 1, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontFamily: FONT_FAMILY.nexaBold },
  vehicleRow: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  vehicleName: { fontFamily: FONT_FAMILY.nexaBold, fontSize: 16 },
});

export default VehiclesScreen;
