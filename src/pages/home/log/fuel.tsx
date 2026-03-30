import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import GoldButton from "@/components/elements/GoldButton";
import LuxInput from "@/components/elements/LuxInput";
import Colors from "../../src/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

export default function FuelLogScreen() {
  const { activeVehicle, addFuelLog } = useVehicle();
  const router = useRouter();
  const [form, setForm] = useState({
    liters: "",
    costPerLiter: "",
    odometer: activeVehicle ? String(activeVehicle.currentOdometer) : "",
    fullTank: true,
    date: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const totalCost = (Number(form.liters) || 0) * (Number(form.costPerLiter) || 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.liters || isNaN(Number(form.liters)) || Number(form.liters) <= 0) e.liters = "Enter litres";
    if (!form.costPerLiter || isNaN(Number(form.costPerLiter)) || Number(form.costPerLiter) <= 0) e.costPerLiter = "Enter cost/L";
    if (!form.odometer || isNaN(Number(form.odometer))) e.odometer = "Enter odometer";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!activeVehicle) return;
    if (!validate()) return;
    setLoading(true);
    await addFuelLog({
      vehicleId: activeVehicle.id,
      date: new Date(form.date).toISOString(),
      liters: Number(form.liters),
      costPerLiter: Number(form.costPerLiter),
      totalCost: totalCost,
      odometer: Number(form.odometer),
      fullTank: form.fullTank,
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
          <Feather name="droplet" size={28} color={C.info} />
        </View>
        <Text style={styles.title}>Fuel Log</Text>
        <Text style={styles.sub}>Log a refuel for {activeVehicle?.make} {activeVehicle?.model}</Text>
      </View>

      {totalCost > 0 && (
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalValue}>R{totalCost.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.form}>
        <LuxInput
          label="Litres"
          placeholder="e.g. 45.5"
          value={form.liters}
          onChangeText={(t) => setForm(f => ({ ...f, liters: t }))}
          keyboardType="decimal-pad"
          error={errors.liters}
        />
        <LuxInput
          label="Cost per Litre (R)"
          placeholder="e.g. 22.50"
          value={form.costPerLiter}
          onChangeText={(t) => setForm(f => ({ ...f, costPerLiter: t }))}
          keyboardType="decimal-pad"
          error={errors.costPerLiter}
        />
        <LuxInput
          label="Odometer (km)"
          placeholder="Current reading"
          value={form.odometer}
          onChangeText={(t) => setForm(f => ({ ...f, odometer: t }))}
          keyboardType="numeric"
          error={errors.odometer}
        />
        <LuxInput
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form.date}
          onChangeText={(t) => setForm(f => ({ ...f, date: t }))}
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Full Tank</Text>
            <Text style={styles.switchSub}>Required for fuel efficiency calculation</Text>
          </View>
          <Switch
            value={form.fullTank}
            onValueChange={(v) => setForm(f => ({ ...f, fullTank: v }))}
            thumbColor={form.fullTank ? C.info : C.textSubtle}
            trackColor={{ false: C.surfaceBorder, true: "rgba(52,152,219,0.4)" }}
          />
        </View>
      </View>

      <GoldButton label="Save Fuel Log" onPress={handleSave} loading={loading} />
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
    backgroundColor: "rgba(52,152,219,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(52,152,219,0.2)",
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  totalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(52,152,219,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(52,152,219,0.2)",
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.info },
  totalValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.info },
  form: { gap: 14 },
  switchRow: {
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
  switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  switchSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
});
