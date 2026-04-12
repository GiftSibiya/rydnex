import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchRepairCatalogRows } from "@/backend/maintenance/logCatalogLinks";
import GoldButton from "@/components/buttons/GoldButton";
import LuxInput from "@/components/forms/LuxInput";
import {
  REPAIR_ITEM_CATALOG,
  RepairItemCategoryId,
} from "@/constants/Constants";
import { useVehicle, VehicleIssueStatus } from "@/contexts/VehicleContext";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const REPAIR_CATEGORY_META: Record<
  RepairItemCategoryId,
  { icon: FeatherIconName; color: string }
> = {
  engine_repair: { icon: "settings", color: "#E74C3C" },
  brakes_steering: { icon: "alert-octagon", color: "#E67E22" },
  suspension_drivetrain: { icon: "rotate-cw", color: "#F1C40F" },
  electrical_sensors: { icon: "activity", color: "#9B59B6" },
  body_glass: { icon: "shield", color: "#3B9EDB" },
  exhaust_fuel: { icon: "thermometer", color: "#1ABC9C" },
};

export default function VehicleIssueEditScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const isNew = !id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    activeVehicle,
    vehicleIssues,
    addVehicleIssue,
    updateVehicleIssue,
    deleteVehicleIssue,
  } = useVehicle();

  const existing = id ? vehicleIssues.find((x) => x.id === id) : undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [odometer, setOdometer] = useState("");
  const [status, setStatus] = useState<VehicleIssueStatus>("open");
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [expandedRepairCategory, setExpandedRepairCategory] = useState<RepairItemCategoryId | null>(
    "engine_repair"
  );
  const [selectedRepairSlug, setSelectedRepairSlug] = useState<string | null>(null);
  const [repairDirty, setRepairDirty] = useState(false);

  useEffect(() => {
    if (isNew) {
      setTitle("");
      setDescription("");
      setOdometer(activeVehicle ? String(activeVehicle.currentOdometer ?? "") : "");
      setStatus("open");
      setSelectedRepairSlug(null);
      setRepairDirty(false);
      return;
    }
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? "");
      setOdometer(
        existing.notedOdometerKm != null ? String(existing.notedOdometerKm) : ""
      );
      setStatus(existing.status);
      setRepairDirty(false);
    }
  }, [isNew, id, existing, activeVehicle?.id]);

  useEffect(() => {
    if (isNew || !existing?.repairItemId) {
      if (isNew) return;
      setSelectedRepairSlug(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchRepairCatalogRows();
        if (cancelled) return;
        const idNum = Number(existing.repairItemId);
        const row = rows.find((r) => r.id === idNum);
        setSelectedRepairSlug(row?.slug ?? null);
      } catch {
        if (!cancelled) setSelectedRepairSlug(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, existing?.id, existing?.repairItemId]);

  const toggleRepairCategory = (cat: RepairItemCategoryId) => {
    setExpandedRepairCategory((prev) => (prev === cat ? null : cat));
  };

  const toggleRepairItem = (slug: string) => {
    setRepairDirty(true);
    setSelectedRepairSlug((prev) => (prev === slug ? null : slug));
  };

  const validate = () => {
    if (!title.trim()) {
      setTitleError("Required");
      return false;
    }
    setTitleError("");
    return true;
  };

  const handleSave = async () => {
    if (!activeVehicle || !validate()) return;
    setLoading(true);
    try {
      const km = odometer.replace(/\D/g, "");
      const noted = km ? Number(km) : undefined;
      if (isNew) {
        await addVehicleIssue({
          vehicleId: activeVehicle.id,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          notedOdometerKm: noted,
          repairItemSlug: selectedRepairSlug,
        });
      } else if (id) {
        await updateVehicleIssue(id, {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          notedOdometerKm: noted,
          ...(repairDirty ? { repairItemSlug: selectedRepairSlug } : {}),
        });
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert("Delete issue", "Remove this issue permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteVehicleIssue(id);
          router.back();
        },
      },
    ]);
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

  if (!isNew && !existing) {
    return (
      <View style={[styles.fallback, { paddingTop: topPad + 16 }]}>
        <Text style={styles.fallbackText}>Issue not found.</Text>
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? "New issue" : "Edit issue"}</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <LuxInput
        label="Title"
        placeholder="e.g. Strange noise when cold"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          if (titleError) setTitleError("");
        }}
        error={titleError}
      />

      <LuxInput
        label="Details (optional)"
        placeholder="Anything you want to remember"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <View style={styles.checklistSection}>
        <Text style={styles.checklistSectionTitle}>Related repair item (optional)</Text>
        <Text style={styles.checklistHint}>
          Same catalog as repair logs. Tap a category to expand. Select one item, or tap again to clear.
        </Text>
        {REPAIR_ITEM_CATALOG.map((category) => {
          const meta = REPAIR_CATEGORY_META[category.id];
          const isExpanded = expandedRepairCategory === category.id;
          const selectedHere = category.items.some((i) => i.id === selectedRepairSlug);
          return (
            <View key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleRepairCategory(category.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconBadge, { backgroundColor: `${meta.color}18` }]}>
                  <Feather name={meta.icon} size={14} color={meta.color} />
                </View>
                <Text style={[styles.categoryTitle, { color: meta.color }]}>{category.title}</Text>
                {selectedHere ? (
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}44` },
                    ]}
                  >
                    <Text style={[styles.countBadgeText, { color: meta.color }]}>1</Text>
                  </View>
                ) : null}
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={C.textSubtle}
                />
              </TouchableOpacity>

              {isExpanded &&
                category.items.map((item) => {
                  const checked = selectedRepairSlug === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checkRow,
                        checked && {
                          borderColor: `${meta.color}50`,
                          backgroundColor: `${meta.color}0A`,
                        },
                      ]}
                      onPress={() => toggleRepairItem(item.id)}
                      activeOpacity={0.65}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          checked
                            ? { backgroundColor: meta.color, borderColor: meta.color }
                            : { backgroundColor: "transparent", borderColor: C.surfaceBorder },
                        ]}
                      >
                        {checked ? <Feather name="check" size={10} color="#000" /> : null}
                      </View>
                      <Text
                        style={[
                          styles.checkLabel,
                          checked && { color: C.text, fontFamily: "Inter_500Medium" },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
      </View>

      <LuxInput
        label="Odometer when noted (optional)"
        placeholder="km"
        value={odometer}
        onChangeText={(t) => setOdometer(t.replace(/\D/g, ""))}
        keyboardType="numeric"
      />

      <View style={styles.switchRow}>
        <View style={styles.switchLabelWrap}>
          <Text style={styles.switchLabel}>Resolved</Text>
          <Text style={styles.switchHint}>Turn off to reopen</Text>
        </View>
        <Switch
          value={status === "resolved"}
          onValueChange={(v) => setStatus(v ? "resolved" : "open")}
          trackColor={{ false: C.surfaceBorder, true: "rgba(46,204,113,0.45)" }}
          thumbColor={status === "resolved" ? C.tint : C.textSubtle}
        />
      </View>

      <GoldButton label={isNew ? "Save issue" : "Save changes"} onPress={handleSave} loading={loading} />

      {!isNew ? (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.75}>
          <Feather name="trash-2" size={16} color={C.danger} />
          <Text style={styles.deleteBtnText}>Delete issue</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const createStyles = (C: AppThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.background },
    content: { paddingHorizontal: 20, gap: 16 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    backBtnPlaceholder: { width: 38 },
    headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
    textArea: { minHeight: 100, textAlignVertical: "top" },
    checklistSection: { gap: 12 },
    checklistSectionTitle: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    checklistHint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      marginBottom: 8,
      marginTop: -4,
    },
    categoryCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.surfaceBorder,
      backgroundColor: C.surfaceElevated,
      overflow: "hidden",
    },
    categoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.surfaceBorder,
    },
    categoryIconBadge: {
      width: 26,
      height: 26,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryTitle: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.2,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
      borderWidth: 1,
    },
    countBadgeText: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderTopWidth: 1,
      borderTopColor: C.surfaceBorder,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    checkLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: C.surfaceElevated,
      borderWidth: 1,
      borderColor: C.surfaceBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    switchLabelWrap: { flex: 1, gap: 2 },
    switchLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
    switchHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
    deleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(231,76,60,0.35)",
      backgroundColor: "rgba(231,76,60,0.06)",
    },
    deleteBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.danger },
    fallback: { flex: 1, backgroundColor: C.background, paddingHorizontal: 24, gap: 12 },
    fallbackText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textMuted },
    fallbackLink: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.tint },
  });
