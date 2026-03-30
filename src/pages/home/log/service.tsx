import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import GoldButton from "@/components/elements/GoldButton";
import LuxInput from "@/components/elements/LuxInput";
import Colors from "@/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

export default function ServiceLogScreen() {
  const { activeVehicle, addServiceLog } = useVehicle();
  const router = useRouter();
  const [type, setType] = useState<"service" | "repair">("service");
  const [form, setForm] = useState({
    description: "",
    cost: "",
    odometer: activeVehicle ? String(activeVehicle.currentOdometer) : "",
    workshop: "",
    notes: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = "Required";
    if (!form.cost || isNaN(Number(form.cost))) e.cost = "Enter a cost";
    if (!form.odometer || isNaN(Number(form.odometer))) e.odometer = "Enter odometer reading";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!activeVehicle) return;
    if (!validate()) return;
    setLoading(true);
    await addServiceLog({
      vehicleId: activeVehicle.id,
      date: new Date(form.date).toISOString(),
      type,
      description: form.description.trim(),
      cost: Number(form.cost),
      odometer: Number(form.odometer),
      workshop: form.workshop.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setLoading(false);
    router.back();
  };

  const iconColor = type === "repair" ? C.danger : C.tint;

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.iconRow}>
        <View style={[styles.icon, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}30` }]}>
          <Feather name="tool" size={28} color={iconColor} />
        </View>
        <Text style={styles.title}>{type === "service" ? "Service" : "Repair"} Log</Text>
      </View>

      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "service" && styles.typeBtnActive]}
          onPress={() => setType("service")}
          activeOpacity={0.7}
        >
          <Feather name="settings" size={14} color={type === "service" ? C.tint : C.textMuted} />
          <Text style={[styles.typeBtnText, type === "service" && { color: C.tint }]}>Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "repair" && styles.typeBtnRepair]}
          onPress={() => setType("repair")}
          activeOpacity={0.7}
        >
          <Feather name="alert-triangle" size={14} color={type === "repair" ? C.danger : C.textMuted} />
          <Text style={[styles.typeBtnText, type === "repair" && { color: C.danger }]}>Repair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <LuxInput
          label="Description"
          placeholder="e.g. Full service, brake pads replaced"
          value={form.description}
          onChangeText={(t) => setForm(f => ({ ...f, description: t }))}
          error={errors.description}
          autoCapitalize="sentences"
        />
        <LuxInput
          label="Cost (R)"
          placeholder="e.g. 1500"
          value={form.cost}
          onChangeText={(t) => setForm(f => ({ ...f, cost: t }))}
          keyboardType="numeric"
          error={errors.cost}
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
          label="Workshop (optional)"
          placeholder="e.g. Mike's Auto"
          value={form.workshop}
          onChangeText={(t) => setForm(f => ({ ...f, workshop: t }))}
          autoCapitalize="words"
        />
        <LuxInput
          label="Notes (optional)"
          placeholder="Any additional notes..."
          value={form.notes}
          onChangeText={(t) => setForm(f => ({ ...f, notes: t }))}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: "top" }}
        />
        <LuxInput
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form.date}
          onChangeText={(t) => setForm(f => ({ ...f, date: t }))}
        />
      </View>

      <GoldButton label="Save Entry" onPress={handleSave} loading={loading} />
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  typeBtnActive: {
    borderColor: C.tint,
    backgroundColor: "rgba(46,204,113,0.08)",
  },
  typeBtnRepair: {
    borderColor: C.danger,
    backgroundColor: "rgba(231,76,60,0.08)",
  },
  typeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textMuted },
  form: { gap: 14 },
});
