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
import GoldButton from "@/components/elements/GoldButton";
import LuxCard from "@/components/elements/LuxCard";
import LuxInput from "@/components/elements/LuxInput";
import Colors from "@/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

export default function LicenseDiskScreen() {
  const { activeVehicle, licenseDisk, upsertLicenseDisk } = useVehicle();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const existing = activeVehicle ? licenseDisk(activeVehicle.id) : undefined;

  const [editing, setEditing] = useState(!existing);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    licenseNo: existing?.licenseNo ?? "",
    expiryDate: existing?.expiryDate ?? "",
    vin: existing?.vin ?? activeVehicle?.vin ?? "",
    engineNumber: existing?.engineNumber ?? "",
    licenseNumber: existing?.licenseNumber ?? "",
    registerNumber: existing?.registerNumber ?? activeVehicle?.registration ?? "",
    fees: existing?.fees !== undefined ? String(existing.fees) : "",
    dateOfTest: existing?.dateOfTest ?? "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        licenseNo: existing.licenseNo,
        expiryDate: existing.expiryDate,
        vin: existing.vin,
        engineNumber: existing.engineNumber,
        licenseNumber: existing.licenseNumber,
        registerNumber: existing.registerNumber,
        fees: String(existing.fees),
        dateOfTest: existing.dateOfTest,
      });
      setEditing(false);
    }
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.licenseNo.trim()) e.licenseNo = "Required";
    if (!form.expiryDate.trim()) e.expiryDate = "Required";
    if (!form.registerNumber.trim()) e.registerNumber = "Required";
    if (form.fees && isNaN(Number(form.fees))) e.fees = "Enter a valid amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!activeVehicle) return;
    if (!validate()) return;
    setLoading(true);
    await upsertLicenseDisk({
      vehicleId: activeVehicle.id,
      licenseNo: form.licenseNo.trim(),
      expiryDate: form.expiryDate.trim(),
      vin: form.vin.trim(),
      engineNumber: form.engineNumber.trim(),
      licenseNumber: form.licenseNumber.trim(),
      registerNumber: form.registerNumber.trim().toUpperCase(),
      fees: form.fees ? Number(form.fees) : 0,
      dateOfTest: form.dateOfTest.trim(),
    });
    setLoading(false);
    setEditing(false);
  };

  const isExpiringSoon = () => {
    if (!form.expiryDate) return false;
    const expiry = new Date(form.expiryDate);
    const diff = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const isExpired = () => {
    if (!form.expiryDate) return false;
    return new Date(form.expiryDate) < new Date();
  };

  if (!activeVehicle) {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={32} color={C.textMuted} />
          <Text style={styles.emptyText}>No active vehicle selected</Text>
          <GoldButton label="Go Back" onPress={() => router.back()} variant="ghost" small />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn} activeOpacity={0.7}>
            <Feather name="edit-2" size={15} color={C.tint} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Icon + title */}
      <View style={styles.titleBlock}>
        <View style={styles.diskIcon}>
          <Feather name="file-text" size={28} color={C.tint} />
        </View>
        <Text style={styles.title}>License Disk</Text>
        <Text style={styles.subtitle}>
          {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
        </Text>
      </View>

      {/* Expiry status banner */}
      {existing && !editing && (isExpired() || isExpiringSoon()) && (
        <View style={[styles.statusBanner, isExpired() ? styles.bannerDanger : styles.bannerWarning]}>
          <Feather
            name={isExpired() ? "alert-octagon" : "alert-triangle"}
            size={15}
            color={isExpired() ? C.danger : C.warning}
          />
          <Text style={[styles.bannerText, { color: isExpired() ? C.danger : C.warning }]}>
            {isExpired() ? "License disk has expired" : "License disk expires within 30 days"}
          </Text>
        </View>
      )}

      {/* View mode */}
      {existing && !editing ? (
        <View style={styles.detailsGrid}>
          <DetailRow label="License No" value={form.licenseNo} />
          <DetailRow label="Expiry Date" value={form.expiryDate} highlight={isExpired() ? "danger" : isExpiringSoon() ? "warning" : undefined} />
          <DetailRow label="VIN Number" value={form.vin || "—"} mono />
          <DetailRow label="Engine Number" value={form.engineNumber || "—"} mono />
          <DetailRow label="License Number" value={form.licenseNumber || "—"} />
          <DetailRow label="Register Number" value={form.registerNumber || "—"} />
          <DetailRow label="Fees" value={form.fees ? `R ${Number(form.fees).toFixed(2)}` : "—"} />
          <DetailRow label="Date of Test" value={form.dateOfTest || "—"} last />
        </View>
      ) : (
        /* Edit / Create form */
        <View style={styles.form}>
          <LuxInput
            label="License No"
            placeholder="e.g. 123456789"
            value={form.licenseNo}
            onChangeText={(t) => setForm((f) => ({ ...f, licenseNo: t }))}
            autoCapitalize="characters"
            error={errors.licenseNo}
          />
          <LuxInput
            label="Expiry Date"
            placeholder="YYYY-MM-DD"
            value={form.expiryDate}
            onChangeText={(t) => setForm((f) => ({ ...f, expiryDate: t }))}
            error={errors.expiryDate}
          />
          <LuxInput
            label="VIN Number"
            placeholder="17-character VIN"
            value={form.vin}
            onChangeText={(t) => setForm((f) => ({ ...f, vin: t }))}
            autoCapitalize="characters"
          />
          <LuxInput
            label="Engine Number"
            placeholder="e.g. ABC123456"
            value={form.engineNumber}
            onChangeText={(t) => setForm((f) => ({ ...f, engineNumber: t }))}
            autoCapitalize="characters"
          />
          <LuxInput
            label="License Number"
            placeholder="e.g. CA 123456"
            value={form.licenseNumber}
            onChangeText={(t) => setForm((f) => ({ ...f, licenseNumber: t }))}
            autoCapitalize="characters"
          />
          <LuxInput
            label="Register Number"
            placeholder="e.g. CA 123456"
            value={form.registerNumber}
            onChangeText={(t) => setForm((f) => ({ ...f, registerNumber: t }))}
            autoCapitalize="characters"
            error={errors.registerNumber}
          />
          <LuxInput
            label="Fees (R)"
            placeholder="e.g. 450.00"
            value={form.fees}
            onChangeText={(t) => setForm((f) => ({ ...f, fees: t }))}
            keyboardType="decimal-pad"
            error={errors.fees}
          />
          <LuxInput
            label="Date of Test"
            placeholder="YYYY-MM-DD"
            value={form.dateOfTest}
            onChangeText={(t) => setForm((f) => ({ ...f, dateOfTest: t }))}
          />

          <View style={styles.formActions}>
            <GoldButton label="Save" onPress={handleSave} loading={loading} style={{ flex: 1 }} />
            {existing && (
              <GoldButton
                label="Cancel"
                variant="ghost"
                onPress={() => { setEditing(false); setErrors({}); }}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: "danger" | "warning";
  last?: boolean;
};

function DetailRow({ label, value, mono, highlight, last }: DetailRowProps) {
  const valueColor = highlight === "danger" ? C.danger : highlight === "warning" ? C.warning : C.text;
  return (
    <LuxCard style={[styles.detailRow, last && { marginBottom: 0 }]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailMono, { color: valueColor }]}>
        {value}
      </Text>
    </LuxCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingBottom: 100, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(46,204,113,0.1)",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.25)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  titleBlock: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  diskIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
    marginBottom: 4,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bannerDanger: {
    backgroundColor: "rgba(231,76,60,0.08)",
    borderColor: "rgba(231,76,60,0.25)",
  },
  bannerWarning: {
    backgroundColor: "rgba(243,156,18,0.08)",
    borderColor: "rgba(243,156,18,0.25)",
  },
  bannerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  detailsGrid: { gap: 8 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    textAlign: "right",
    flex: 1.5,
  },
  detailMono: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  form: { gap: 14 },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
});
