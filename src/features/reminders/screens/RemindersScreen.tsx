import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import useVehicleStore from '@/features/vehicles/store/useVehicleStore';
import { calculatePartReminders } from '@/features/efficiency/utils/efficiency';
import { useAppTheme } from '@/themes/AppTheme';
import { FONT_FAMILY } from '@/constants/Fonts';
import { ToastStateStore } from '@/stores/StoresIndex';

const RemindersScreen = () => {
  const { colors } = useAppTheme();
  const { showToast } = ToastStateStore();
  const { activeVehicleId, odometerLogs, partRules, addPartRule } = useVehicleStore();
  const [partName, setPartName] = useState('Brake Pads');
  const [lastChangeKm, setLastChangeKm] = useState('');
  const [expectedLifeKm, setExpectedLifeKm] = useState('10000');
  const [warningThresholdKm, setWarningThresholdKm] = useState('4000');

  const reminders = useMemo(() => calculatePartReminders(odometerLogs, partRules), [odometerLogs, partRules]);

  const onAddRule = async () => {
    if (!activeVehicleId) {
      showToast({ message: 'Select a vehicle first.', type: 'warning' });
      return;
    }
    await addPartRule({
      vehicle_id: activeVehicleId,
      part_name: partName,
      last_change_km: Number(lastChangeKm) || 0,
      expected_life_km: Number(expectedLifeKm) || 0,
      warning_threshold_km: Number(warningThresholdKm) || 0,
    });
    showToast({ message: 'Parts life rule added.', type: 'success' });
  };

  return (
    <ScreenScaffold title="Reminders" subtitle="Parts life and next replacement warnings">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput value={partName} onChangeText={setPartName} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Part name" placeholderTextColor={colors.textMuted} />
        <TextInput value={lastChangeKm} onChangeText={setLastChangeKm} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Last replacement km" keyboardType="numeric" placeholderTextColor={colors.textMuted} />
        <TextInput value={expectedLifeKm} onChangeText={setExpectedLifeKm} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Expected life km" keyboardType="numeric" placeholderTextColor={colors.textMuted} />
        <TextInput value={warningThresholdKm} onChangeText={setWarningThresholdKm} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Warning threshold km" keyboardType="numeric" placeholderTextColor={colors.textMuted} />
        <Pressable onPress={onAddRule} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonText}>Save rule</Text>
        </Pressable>
      </View>
      <FlatList
        data={reminders}
        keyExtractor={(item) => `${item.id}-${item.part_name}`}
        renderItem={({ item }) => (
          <View style={[styles.reminderRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.partName, { color: colors.text }]}>{item.part_name}</Text>
            <Text style={{ color: colors.textMuted }}>
              {item.remaining_km <= 0
                ? `Due now`
                : `Likely needs replacement in ${item.remaining_km} km`}
            </Text>
          </View>
        )}
      />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 10, fontFamily: FONT_FAMILY.poppinsRegular },
  button: { borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontFamily: FONT_FAMILY.nexaBold },
  reminderRow: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  partName: { fontFamily: FONT_FAMILY.nexaBold, marginBottom: 4 },
});

export default RemindersScreen;
