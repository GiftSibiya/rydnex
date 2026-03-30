import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GoldButton from "components/GoldButton";
import LuxInput from "components/LuxInput";
import ReminderItem from "components/ReminderItem";
import VehicleSelector from "components/VehicleSelector";
import Colors from "../../src/constants/colors";
import { useVehicle } from "contexts/VehicleContext";

const C = Colors.dark;

const PRESET_PARTS = [
  { name: "Engine Oil", intervalKm: 10000, intervalDays: 365 },
  { name: "Oil Filter", intervalKm: 10000, intervalDays: 365 },
  { name: "Air Filter", intervalKm: 30000, intervalDays: 730 },
  { name: "Spark Plugs", intervalKm: 40000, intervalDays: 1095 },
  { name: "Brake Pads", intervalKm: 50000, intervalDays: 1460 },
  { name: "Timing Belt", intervalKm: 80000, intervalDays: 2190 },
  { name: "Tyres", intervalKm: 60000, intervalDays: 2555 },
  { name: "Cabin Air Filter", intervalKm: 20000, intervalDays: 730 },
  { name: "Gearbox Oil", intervalKm: 40000, intervalDays: 1460 },
  { name: "Coolant Flush", intervalKm: 50000, intervalDays: 1825 },
];

export default function RemindersScreen() {
  const { activeVehicle, partRules, addPartRule, updatePartRule, deletePartRule, vehicles } = useVehicle();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [usePreset, setUsePreset] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PARTS[0]);
  const [form, setForm] = useState({ partName: "", intervalKm: "10000", intervalDays: "365" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const vRules = activeVehicle ? partRules.filter((r) => r.vehicleId === activeVehicle.id) : [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!usePreset && !form.partName.trim()) e.partName = "Required";
    if (!usePreset && (!form.intervalKm || isNaN(Number(form.intervalKm)))) e.intervalKm = "Enter a number";
    if (!usePreset && (!form.intervalDays || isNaN(Number(form.intervalDays)))) e.intervalDays = "Enter a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!activeVehicle) return;
    if (!validate()) return;
    const data = usePreset ? selectedPreset : {
      name: form.partName.trim(),
      intervalKm: Number(form.intervalKm),
      intervalDays: Number(form.intervalDays),
    };
    await addPartRule({
      vehicleId: activeVehicle.id,
      partName: usePreset ? selectedPreset.name : form.partName.trim(),
      intervalKm: usePreset ? selectedPreset.intervalKm : Number(form.intervalKm),
      intervalDays: usePreset ? selectedPreset.intervalDays : Number(form.intervalDays),
      lastReplacedKm: activeVehicle.currentOdometer,
      lastReplacedDate: new Date().toISOString(),
    });
    setShowAdd(false);
    setForm({ partName: "", intervalKm: "10000", intervalDays: "365" });
    setErrors({});
  };

  const handleMarkReplaced = async (ruleId: string) => {
    if (!activeVehicle) return;
    await updatePartRule(ruleId, {
      lastReplacedKm: activeVehicle.currentOdometer,
      lastReplacedDate: new Date().toISOString(),
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Reminders</Text>
          <View style={styles.topActions}>
            <VehicleSelector />
            {activeVehicle && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
                <Feather name="plus" size={18} color={C.tint} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!activeVehicle || vehicles.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={36} color={C.textSubtle} />
            <Text style={styles.emptyTitle}>No Vehicle</Text>
            <Text style={styles.emptyText}>Select or add a vehicle first</Text>
          </View>
        ) : vRules.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell" size={36} color={C.textSubtle} />
            <Text style={styles.emptyTitle}>No Reminders</Text>
            <Text style={styles.emptyText}>Add part replacement reminders to track your service schedule</Text>
            <GoldButton label="Add Reminder" onPress={() => setShowAdd(true)} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{vRules.filter(r => {
                  const kmSince = activeVehicle.currentOdometer - r.lastReplacedKm;
                  const daysSince = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
                  return kmSince >= r.intervalKm || daysSince >= r.intervalDays;
                }).length}</Text>
                <Text style={[styles.statLabel, { color: C.danger }]}>Overdue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{vRules.filter(r => {
                  const kmSince = activeVehicle.currentOdometer - r.lastReplacedKm;
                  const daysSince = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
                  const maxPct = Math.max(r.intervalKm > 0 ? kmSince / r.intervalKm : 0, r.intervalDays > 0 ? daysSince / r.intervalDays : 0);
                  return maxPct >= 0.8 && maxPct < 1;
                }).length}</Text>
                <Text style={[styles.statLabel, { color: C.warning }]}>Due Soon</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{vRules.filter(r => {
                  const kmSince = activeVehicle.currentOdometer - r.lastReplacedKm;
                  const daysSince = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
                  const maxPct = Math.max(r.intervalKm > 0 ? kmSince / r.intervalKm : 0, r.intervalDays > 0 ? daysSince / r.intervalDays : 0);
                  return maxPct < 0.8;
                }).length}</Text>
                <Text style={[styles.statLabel, { color: C.success }]}>Good</Text>
              </View>
            </View>
            {vRules.map((rule) => (
              <ReminderItem
                key={rule.id}
                rule={rule}
                vehicle={activeVehicle}
                onMarkReplaced={() => handleMarkReplaced(rule.id)}
                onDelete={() => deletePartRule(rule.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAwareScrollView
          style={styles.modal}
          contentContainerStyle={styles.modalContent}
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)} activeOpacity={0.7}>
              <Feather name="x" size={22} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Use preset</Text>
            <Switch
              value={usePreset}
              onValueChange={setUsePreset}
              thumbColor={usePreset ? C.tint : C.textSubtle}
              trackColor={{ false: C.surfaceBorder, true: "rgba(46,204,113,0.4)" }}
            />
          </View>

          {usePreset ? (
            <View style={styles.presets}>
              {PRESET_PARTS.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={[styles.presetItem, selectedPreset.name === p.name && styles.presetSelected]}
                  onPress={() => setSelectedPreset(p)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetName, selectedPreset.name === p.name && { color: C.tint }]}>{p.name}</Text>
                  <Text style={styles.presetMeta}>{(p.intervalKm / 1000).toFixed(0)}k km · {Math.round(p.intervalDays / 30)}mo</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.formGrid}>
              <LuxInput label="Part Name" placeholder="e.g. Engine Oil" value={form.partName} onChangeText={(t) => setForm(f => ({ ...f, partName: t }))} error={errors.partName} />
              <LuxInput label="Interval (km)" placeholder="e.g. 10000" value={form.intervalKm} onChangeText={(t) => setForm(f => ({ ...f, intervalKm: t }))} keyboardType="numeric" error={errors.intervalKm} />
              <LuxInput label="Interval (days)" placeholder="e.g. 365" value={form.intervalDays} onChangeText={(t) => setForm(f => ({ ...f, intervalDays: t }))} keyboardType="numeric" error={errors.intervalDays} />
            </View>
          )}

          <GoldButton label="Add Reminder" onPress={handleAdd} />
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 14, paddingTop: 12 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  modal: { flex: 1, backgroundColor: C.surface },
  modalContent: { padding: 24, paddingTop: 32, gap: 20 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  presets: { gap: 8 },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  presetSelected: {
    borderColor: C.tint,
    backgroundColor: "rgba(46,204,113,0.08)",
  },
  presetName: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  presetMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  formGrid: { gap: 14 },
});
