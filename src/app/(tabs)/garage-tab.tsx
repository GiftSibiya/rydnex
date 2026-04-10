import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GoldButton from "@/components/buttons/GoldButton";
import LuxCard from "@/components/elements/LuxCard";
import LuxInput from "@/components/forms/LuxInput";
import VehiclePickerModal from "@/components/modals/VehiclePickerModal";
import { getCarLogo } from "@/constants/carLogos";
import { Vehicle, useVehicle, LicenseDisk } from "@/contexts/VehicleContext";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

const currentYear = new Date().getFullYear();

function isLicenseDiskExpired(disk: LicenseDisk): boolean {
  return !!disk.expiryDate && new Date(disk.expiryDate) < new Date();
}

function isLicenseDiskExpiringSoon(disk: LicenseDisk): boolean {
  if (!disk.expiryDate) return false;
  const diff = (new Date(disk.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

export default function garageTab() {
  const { colors: C } = useAppTheme();
  const {
    vehicles,
    addVehicle,
    deleteVehicle,
    setActiveVehicle,
    FREE_TIER_LIMIT,
    licenseDisk,
    refreshLogs,
  } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createStyles(C), [C]);
  const [showAdd, setShowAdd] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLogs();
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);
    const success = await addVehicle({
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year.trim(),
      trim: form.trim.trim(),
      vin: form.vin.trim(),
      registration: form.registration.trim().toUpperCase(),
      color: form.color.trim().toUpperCase(),
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
      trim: "",
      vin: "",
      registration: "",
      color: "",
      currentOdometer: "",
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
    <View style={styles.screen}>
      <View style={[styles.fixedHeader, { paddingTop: topPad + 12 }]}>
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
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.tint}
            colors={[C.tint]}
          />
        }
      >
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
                router.push("/garage/vehicle-details-page");
              }}
            >
              <LuxCard style={styles.vehicleCard}>
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleIcon}>
                    {getCarLogo(v.make) ? (
                      <Image source={getCarLogo(v.make)!} style={styles.vehicleLogoImg} resizeMode="contain" />
                    ) : (
                      <Feather name="truck" size={22} color={C.tint} />
                    )}
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>
                      {v.year} {v.make}
                    </Text>
                    <Text style={styles.vehicleModel}>
                      {v.model}{v.trim ? ` ${v.trim}` : ""}
                    </Text>
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
                <TouchableOpacity
                  style={[
                    styles.diskBtn,
                    licenseDisk(v.id) && isLicenseDiskExpiringSoon(licenseDisk(v.id)!) && styles.diskBtnWarning,
                    licenseDisk(v.id) && isLicenseDiskExpired(licenseDisk(v.id)!) && styles.diskBtnDanger,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setActiveVehicle(v);
                    router.push("/log/license-disk");
                  }}
                  activeOpacity={0.75}
                >
                  <Feather
                    name="file-text"
                    size={13}
                    color={
                      licenseDisk(v.id) && isLicenseDiskExpired(licenseDisk(v.id)!)
                        ? C.danger
                        : licenseDisk(v.id) && isLicenseDiskExpiringSoon(licenseDisk(v.id)!)
                        ? C.warning
                        : C.tint
                    }
                  />
                  <Text
                    style={[
                      styles.diskBtnText,
                      licenseDisk(v.id) && isLicenseDiskExpired(licenseDisk(v.id)!) && { color: C.danger },
                      licenseDisk(v.id) && isLicenseDiskExpiringSoon(licenseDisk(v.id)!) && { color: C.warning },
                    ]}
                  >
                    {licenseDisk(v.id)
                      ? isLicenseDiskExpired(licenseDisk(v.id)!)
                        ? "License Expired"
                        : isLicenseDiskExpiringSoon(licenseDisk(v.id)!)
                        ? "Expiring Soon"
                        : `Expires ${licenseDisk(v.id)!.expiryDate}`
                      : "Add License Disk"}
                  </Text>
                  <Feather name="chevron-right" size={13} color={C.textSubtle} />
                </TouchableOpacity>
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
        <VehiclePickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onConfirm={(make, model, year, trim) =>
            setForm((f) => ({ ...f, make, model, year: String(year), trim }))
          }
        />
        <ScrollView
          style={styles.modal}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Vehicle</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)} activeOpacity={0.7}>
              <Feather name="x" size={22} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.pickerFieldWrap}>
              <Text style={styles.pickerFieldLabel}>Vehicle</Text>
              <TouchableOpacity
                style={[
                  styles.pickerField,
                  (errors.make || errors.model || errors.year || errors.trim) &&
                    styles.pickerFieldError,
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
              placeholder="Optional — defaults to 0"
              value={form.currentOdometer}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, currentOdometer: t.replace(/\D/g, "") }))
              }
              keyboardType="numeric"
            />
          </View>

          <GoldButton
            label="Save Vehicle"
            onPress={handleAdd}
            loading={loading}
          />
        </ScrollView>
      </Modal>
    </View>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  fixedHeader: {
    backgroundColor: C.background,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  content: { paddingHorizontal: 20, gap: 14 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
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
  vehicleLogoImg: { width: 30, height: 30 },
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
  diskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(46,204,113,0.06)",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.18)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  diskBtnWarning: {
    backgroundColor: "rgba(243,156,18,0.06)",
    borderColor: "rgba(243,156,18,0.25)",
  },
  diskBtnDanger: {
    backgroundColor: "rgba(231,76,60,0.06)",
    borderColor: "rgba(231,76,60,0.25)",
  },
  diskBtnText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.tint,
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
