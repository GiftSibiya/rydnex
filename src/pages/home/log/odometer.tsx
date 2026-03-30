import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import GoldButton from "@/components/elements/GoldButton";
import LuxInput from "@/components/elements/LuxInput";
import Colors from "../../src/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

export default function OdometerLogScreen() {
  const { activeVehicle, addOdometerLog } = useVehicle();
  const router = useRouter();
  const [form, setForm] = useState({
    reading: activeVehicle ? String(activeVehicle.currentOdometer) : "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const prev = activeVehicle?.currentOdometer ?? 0;
  const newReading = Number(form.reading) || 0;
  const diff = newReading - prev;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.reading || isNaN(Number(form.reading))) e.reading = "Enter a reading";
    if (Number(form.reading) < prev) e.reading = `Must be ≥ ${prev.toLocaleString()} km`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!activeVehicle) return;
    if (!validate()) return;
    setLoading(true);
    await addOdometerLog({
      vehicleId: activeVehicle.id,
      reading: newReading,
      date: new Date(form.date).toISOString(),
      note: form.note.trim() || undefined,
    });
    setLoading(false);
    router.back();
  };

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.iconRow}>
        <View style={styles.icon}>
          <Feather name="activity" size={28} color={C.success} />
        </View>
        <Text style={styles.title}>Odometer Reading</Text>
        <Text style={styles.sub}>Previous: {prev.toLocaleString()} km</Text>
      </View>

      {diff > 0 && (
        <View style={styles.diffBanner}>
          <Feather name="navigation" size={14} color={C.success} />
          <Text style={styles.diffText}>+{diff.toLocaleString()} km since last reading</Text>
        </View>
      )}

      <View style={styles.form}>
        <LuxInput
          label="New Odometer Reading (km)"
          placeholder={String(prev)}
          value={form.reading}
          onChangeText={(t) => setForm(f => ({ ...f, reading: t }))}
          keyboardType="numeric"
          error={errors.reading}
        />
        <LuxInput
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form.date}
          onChangeText={(t) => setForm(f => ({ ...f, date: t }))}
        />
        <LuxInput
          label="Note (optional)"
          placeholder="e.g. Before long trip"
          value={form.note}
          onChangeText={(t) => setForm(f => ({ ...f, note: t }))}
        />
      </View>

      <GoldButton label="Save Reading" onPress={handleSave} loading={loading} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 24, gap: 20 },
  iconRow: { alignItems: "center", gap: 8, paddingTop: 8 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  diffBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(46,204,113,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  diffText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.success },
  form: { gap: 14 },
});
