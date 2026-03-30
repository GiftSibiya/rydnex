import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GoldButton from "@/components/elements/GoldButton";
import LuxCard from "@/components/elements/LuxCard";
import LuxInput from "@/components/elements/LuxInput";
import Colors from "@/constants/colors";
import { Vehicle, useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

const MAKES = [
  "Audi",
  "BMW",
  "Ford",
  "Honda",
  "Hyundai",
  "Kia",
  "Land Rover",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Renault",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

const currentYear = new Date().getFullYear();

export default function GarageScreen() {
  const { vehicles, addVehicle, deleteVehicle, setActiveVehicle, FREE_TIER_LIMIT } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: String(currentYear),
    vin: "",
    registration: "",
    color: "",
    currentOdometer: "0",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.make.trim()) e.make = "Required";
    if (!form.model.trim()) e.model = "Required";
    if (!form.year || isNaN(Number(form.year))) e.year = "Enter a valid year";
    if (!form.registration.trim()) e.registration = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);
    const success = await addVehicle({
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year.trim(),
      vin: form.vin.trim(),
      registration: form.registration.trim().toUpperCase(),
      color: form.color.trim(),
      currentOdometer: Number(form.currentOdometer) || 0,
    });
    setLoading(false);
    if (!success) {
      Alert.alert("Free Tier Limit", `You can only track ${FREE_TIER_LIMIT} vehicles on the free plan.`);
      return;
    }
    setShowAdd(false);
    setForm({
      make: "",
      model: "",
      year: String(currentYear),
      vin: "",
      registration: "",
      color: "",
      currentOdometer: "0",
    });
    setErrors({});
  };

  const handleDelete = (v: Vehicle) => {
    Alert.alert("Remove Vehicle", `Remove ${v.year} ${v.make} ${v.model}? All logs will be deleted.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteVehicle(v.id) },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>My Garage</Text>
          <TouchableOpacity
            style={[styles.addBtn, vehicles.length >= FREE_TIER_LIMIT && styles.addBtnDisabled]}
            onPress={() => vehicles.length < FREE_TIER_LIMIT && setShowAdd(true)}
            activeOpacity={0.8}
          >
            <Feather
              name="plus"
              size={18}
              color={vehicles.length >= FREE_TIER_LIMIT ? C.textSubtle : C.tint}
            />
          </TouchableOpacity>
        </View>

        {vehicles.length >= FREE_TIER_LIMIT && (
          <View style={styles.limitBanner}>
            <Feather name="info" size={14} color={C.warning} />
            <Text style={styles.limitText}>Free tier: {FREE_TIER_LIMIT} vehicles max</Text>
          </View>
        )}

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="truck" size={32} color={C.tint} />
            </View>
            <Text style={styles.emptyTitle}>No Vehicles</Text>
            <Text style={styles.emptyText}>Add your first car to get started</Text>
            <GoldButton
              label="Add Vehicle"
              onPress={() => setShowAdd(true)}
              style={{ marginTop: 8 }}
            />
          </View>
        ) : (
          vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              activeOpacity={0.85}
              onPress={() => {
                setActiveVehicle(v);
                router.push("/");
              }}
            >
              <LuxCard style={styles.vehicleCard}>
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleIcon}>
                    <Feather name="truck" size={22} color={C.tint} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>
                      {v.year} {v.make}
                    </Text>
                    <Text style={styles.vehicleModel}>{v.model}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(v)}
                    style={styles.delBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color={C.danger} />
                  </TouchableOpacity>
                </View>
                <View style={styles.vehicleMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Registration</Text>
                    <Text style={styles.metaValue}>{v.registration || "—"}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Odometer</Text>
                    <Text style={styles.metaValue}>{v.currentOdometer.toLocaleString()} km</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Color</Text>
                    <Text style={styles.metaValue}>{v.color || "—"}</Text>
                  </View>
                </View>
                {v.vin ? <Text style={styles.vin}>VIN: {v.vin}</Text> : null}
              </LuxCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <KeyboardAwareScrollView
          style={styles.modal}
          contentContainerStyle={styles.modalContent}
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Vehicle</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)} activeOpacity={0.7}>
              <Feather name="x" size={22} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGrid}>
            <LuxInput
              label="Make"
              placeholder="e.g. Toyota"
              value={form.make}
              onChangeText={(t) => setForm((f) => ({ ...f, make: t }))}
              error={errors.make}
              autoCapitalize="words"
            />
            <LuxInput
              label="Model"
              placeholder="e.g. Corolla"
              value={form.model}
              onChangeText={(t) => setForm((f) => ({ ...f, model: t }))}
              error={errors.model}
              autoCapitalize="words"
            />
            <LuxInput
              label="Year"
              placeholder="e.g. 2021"
              value={form.year}
              onChangeText={(t) => setForm((f) => ({ ...f, year: t }))}
              keyboardType="numeric"
              error={errors.year}
            />
            <LuxInput
              label="Registration"
              placeholder="e.g. CA123456"
              value={form.registration}
              onChangeText={(t) => setForm((f) => ({ ...f, registration: t }))}
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
              placeholder="e.g. Pearl White"
              value={form.color}
              onChangeText={(t) => setForm((f) => ({ ...f, color: t }))}
              autoCapitalize="words"
            />
            <LuxInput
              label="Current Odometer (km)"
              placeholder="0"
              value={form.currentOdometer}
              onChangeText={(t) => setForm((f) => ({ ...f, currentOdometer: t }))}
              keyboardType="numeric"
            />
          </View>

          <GoldButton
            label="Save Vehicle"
            onPress={handleAdd}
            loading={loading}
          />
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 14 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingTop: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  addBtnDisabled: { opacity: 0.4 },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(243,156,18,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  limitText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.warning },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(46,204,113,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.15)",
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted },
  vehicleCard: { gap: 14 },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  vehicleInfo: { flex: 1 },
  vehicleName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  vehicleModel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },
  delBtn: { padding: 8 },
  vehicleMeta: {
    flexDirection: "row",
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    paddingTop: 12,
  },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  vin: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    fontVariant: ["tabular-nums"],
  },
  modal: { flex: 1, backgroundColor: C.surface },
  modalContent: {
    padding: 24,
    paddingTop: 32,
    gap: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  formGrid: { gap: 14 },
});

