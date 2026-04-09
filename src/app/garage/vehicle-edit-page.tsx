import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GoldButton from "@/components/buttons/GoldButton";
import LuxInput from "@/components/forms/LuxInput";
import VehiclePickerModal from "@/components/modals/VehiclePickerModal";
import Colors from "@/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;
const currentYear = new Date().getFullYear();

export default function VehicleEditPage() {
  const { activeVehicle, updateVehicle } = useVehicle();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [pickerVisible, setPickerVisible] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: String(currentYear),
    trim: "",
    vin: "",
    registration: "",
    color: "",
    currentOdometer: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activeVehicle) return;
    setForm({
      make: activeVehicle.make,
      model: activeVehicle.model,
      year: activeVehicle.year,
      trim: activeVehicle.trim ?? "",
      vin: activeVehicle.vin ?? "",
      registration: activeVehicle.registration ?? "",
      color: activeVehicle.color ?? "",
      currentOdometer: String(activeVehicle.currentOdometer ?? 0),
    });
  }, [activeVehicle?.id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.make.trim()) e.make = "Required";
    if (!form.model.trim()) e.model = "Required";
    if (!form.year || isNaN(Number(form.year))) e.year = "Enter a valid year";
    if (!form.trim.trim()) e.trim = "Required";
    if (!form.registration.trim()) e.registration = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!activeVehicle || !validate()) return;
    setLoading(true);
    try {
      await updateVehicle(activeVehicle.id, {
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year.trim(),
        trim: form.trim.trim(),
        vin: form.vin.trim(),
        registration: form.registration.trim(),
        color: form.color.trim(),
        currentOdometer: Number(form.currentOdometer) || 0,
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (!activeVehicle) {
    return (
      <View style={[styles.fallback, { paddingTop: topPad + 16 }]}>
        <Text style={styles.fallbackText}>No vehicle selected.</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.fallbackLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <VehiclePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={(make, model, year, trim) =>
          setForm((f) => ({ ...f, make, model, year: String(year), trim }))
        }
      />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Vehicle</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <View style={styles.formGrid}>
        <View style={styles.pickerFieldWrap}>
          <Text style={styles.pickerFieldLabel}>Vehicle</Text>
          <TouchableOpacity
            style={[
              styles.pickerField,
              (errors.make || errors.model || errors.year || errors.trim) && styles.pickerFieldError,
              !!(form.make && form.model && form.year && form.trim) && styles.pickerFieldFilled,
            ]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.pickerFieldText,
                !(form.make && form.model && form.year && form.trim) && styles.pickerFieldPlaceholder,
              ]}
              numberOfLines={1}
            >
              {form.make && form.model && form.year && form.trim
                ? `${form.year} ${form.make} ${form.model} ${form.trim}`
                : "Select make, model, year & trim"}
            </Text>
            <View style={styles.pickerFieldRight}>
              {form.make ? (
                <TouchableOpacity
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      make: "",
                      model: "",
                      year: String(currentYear),
                      trim: "",
                    }))
                  }
                  hitSlop={8}
                >
                  <Feather name="x" size={14} color={C.textMuted} />
                </TouchableOpacity>
              ) : null}
              <Feather name="chevron-right" size={16} color={form.make ? C.tint : C.textSubtle} />
            </View>
          </TouchableOpacity>
          {(errors.make || errors.model || errors.year || errors.trim) && (
            <Text style={styles.pickerFieldErrorText}>
              {errors.make || errors.model || errors.year || errors.trim}
            </Text>
          )}
        </View>

        <LuxInput
          label="Registration"
          placeholder="e.g. CA123456"
          value={form.registration}
          onChangeText={(t) => setForm((f) => ({ ...f, registration: t.toUpperCase() }))}
          autoCapitalize="characters"
          error={errors.registration}
        />
        <LuxInput
          label="VIN (optional)"
          placeholder="17-char VIN"
          value={form.vin}
          onChangeText={(t) => setForm((f) => ({ ...f, vin: t }))}
          autoCapitalize="characters"
        />
        <LuxInput
          label="Color (optional)"
          placeholder="e.g. PEARL WHITE"
          value={form.color}
          onChangeText={(t) => setForm((f) => ({ ...f, color: t.toUpperCase() }))}
          autoCapitalize="characters"
        />
        <LuxInput
          label="Current Odometer (km)"
          placeholder="0"
          value={form.currentOdometer}
          onChangeText={(t) => setForm((f) => ({ ...f, currentOdometer: t.replace(/\D/g, "") }))}
          keyboardType="numeric"
        />
      </View>

      <GoldButton label="Save changes" onPress={handleSave} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 20 },
  fallback: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 24,
    gap: 12,
  },
  fallbackText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textMuted },
  fallbackLink: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.tint },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  backBtnPlaceholder: { width: 38, height: 38 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  formGrid: { gap: 14 },
  pickerFieldWrap: { gap: 6 },
  pickerFieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
  },
  pickerFieldError: { borderColor: C.danger },
  pickerFieldFilled: { borderColor: "rgba(46,204,113,0.35)" },
  pickerFieldText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  pickerFieldPlaceholder: { color: C.textSubtle },
  pickerFieldRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  pickerFieldErrorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.dangerLight,
  },
});
