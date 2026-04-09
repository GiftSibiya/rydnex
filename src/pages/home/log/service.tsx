import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GoldButton from "@/components/buttons/GoldButton";
import LuxInput from "@/components/forms/LuxInput";
import Colors from "@/constants/colors";
import {
  REPAIR_ITEM_CATALOG,
  RepairItemCategoryId,
  SERVICE_ITEM_CATALOG,
  ServiceCatalogItem,
  ServiceItemCategoryId,
  buildRepairDescriptionFromSelection,
  buildServiceDescriptionFromSelection,
} from "@/constants/Constants";
import { useVehicle } from "@/contexts/VehicleContext";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const CATEGORY_META: Record<
  ServiceItemCategoryId,
  { icon: FeatherIconName; color: string }
> = {
  engine_fluids:    { icon: "droplet",          color: "#3B9EDB" },
  wear_tear:        { icon: "tool",              color: "#E67E22" },
  ignition:         { icon: "zap",               color: "#F1C40F" },
  electrical:       { icon: "cpu",               color: "#9B59B6" },
  tyres_alignment:  { icon: "disc",              color: "#1ABC9C" },
  cooling_air:      { icon: "wind",              color: "#2ECC71" },
};

const REPAIR_CATEGORY_META: Record<
  RepairItemCategoryId,
  { icon: FeatherIconName; color: string }
> = {
  engine_repair:         { icon: "settings",       color: "#E74C3C" },
  brakes_steering:       { icon: "alert-octagon",  color: "#E67E22" },
  suspension_drivetrain: { icon: "rotate-cw",      color: "#F1C40F" },
  electrical_sensors:    { icon: "activity",       color: "#9B59B6" },
  body_glass:            { icon: "shield",         color: "#3B9EDB" },
  exhaust_fuel:          { icon: "thermometer",    color: "#1ABC9C" },
};

function formatInterval(item: ServiceCatalogItem): string | null {
  const km = item.defaultIntervalKm;
  const mo = item.defaultIntervalMonths;
  if (km && mo) return `${(km / 1000).toFixed(0)}k km · ${mo} mo`;
  if (km) return `${(km / 1000).toFixed(0)}k km`;
  if (mo) return `${mo} mo`;
  return null;
}

const C = Colors.dark;

export default function ServiceLogScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { activeVehicle, addServiceLog } = useVehicle();
  const router = useRouter();
  const initialType = params.type === "repair" ? "repair" : "service";
  const [type, setType] = useState<"service" | "repair">(initialType);
  const [form, setForm] = useState({
    description: "",
    cost: "",
    odometer: activeVehicle ? String(activeVehicle.currentOdometer) : "",
    workshop: "",
    notes: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [selectedServiceItems, setSelectedServiceItems] = useState<Record<string, boolean>>({});
  const [expandedCategory, setExpandedCategory] = useState<ServiceItemCategoryId | null>(null);
  const [selectedRepairItems, setSelectedRepairItems] = useState<Record<string, boolean>>({});
  const [expandedRepairCategory, setExpandedRepairCategory] = useState<RepairItemCategoryId | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const toggleCategory = (id: ServiceItemCategoryId) => {
    setExpandedCategory((prev) => (prev === id ? null : id));
  };

  const toggleRepairCategory = (id: RepairItemCategoryId) => {
    setExpandedRepairCategory((prev) => (prev === id ? null : id));
  };

  const toggleRepairItem = (id: string) => {
    setSelectedRepairItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const serviceDescriptionPreview = useMemo(
    () => buildServiceDescriptionFromSelection(selectedServiceItems, form.description),
    [selectedServiceItems, form.description]
  );

  const repairDescriptionPreview = useMemo(
    () => buildRepairDescriptionFromSelection(selectedRepairItems, form.description),
    [selectedRepairItems, form.description]
  );

  const toggleServiceItem = (id: string) => {
    setSelectedServiceItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (type === "service") {
      const full = buildServiceDescriptionFromSelection(selectedServiceItems, form.description);
      if (!full.trim()) {
        e.description = "Select at least one item or add a description";
      }
    } else {
      const full = buildRepairDescriptionFromSelection(selectedRepairItems, form.description);
      if (!full.trim()) {
        e.description = "Select at least one item or add a description";
      }
    }
    if (!form.cost || isNaN(Number(form.cost))) e.cost = "Enter a cost";
    if (!form.odometer || isNaN(Number(form.odometer))) e.odometer = "Enter odometer reading";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!activeVehicle) return;
    if (!validate()) return;
    setLoading(true);
    const description =
      type === "service"
        ? buildServiceDescriptionFromSelection(selectedServiceItems, form.description)
        : buildRepairDescriptionFromSelection(selectedRepairItems, form.description);
    await addServiceLog({
      vehicleId: activeVehicle.id,
      date: new Date(form.date).toISOString(),
      type,
      description,
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
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

      {type === "service" && (
        <View style={styles.checklistSection}>
          <Text style={styles.checklistSectionTitle}>Select service items</Text>
          {SERVICE_ITEM_CATALOG.map((category) => {
            const meta = CATEGORY_META[category.id];
            const selectedCount = category.items.filter((i) => selectedServiceItems[i.id]).length;
            return (
              <View key={category.id} style={styles.categoryCard}>
                {/* Category header — tap to expand/collapse */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconBadge, { backgroundColor: `${meta.color}18` }]}>
                    <Feather name={meta.icon} size={14} color={meta.color} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: meta.color }]}>{category.title}</Text>
                  {selectedCount > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}44` }]}>
                      <Text style={[styles.countBadgeText, { color: meta.color }]}>{selectedCount}</Text>
                    </View>
                  )}
                  <Feather
                    name={expandedCategory === category.id ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={C.textSubtle}
                  />
                </TouchableOpacity>

                {/* Items — only when expanded */}
                {expandedCategory === category.id && category.items.map((item) => {
                  const checked = !!selectedServiceItems[item.id];
                  const hint = formatInterval(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checkRow,
                        checked && { borderColor: `${meta.color}50`, backgroundColor: `${meta.color}0A` },
                      ]}
                      onPress={() => toggleServiceItem(item.id)}
                      activeOpacity={0.65}
                    >
                      {/* Custom circular checkbox */}
                      <View style={[
                        styles.checkbox,
                        checked
                          ? { backgroundColor: meta.color, borderColor: meta.color }
                          : { backgroundColor: "transparent", borderColor: C.surfaceBorder },
                      ]}>
                        {checked && <Feather name="check" size={10} color="#000" />}
                      </View>

                      <View style={styles.checkLabelGroup}>
                        <Text style={[styles.checkLabel, checked && { color: C.text, fontFamily: "Inter_500Medium" }]}>
                          {item.name}
                        </Text>
                        {hint && (
                          <Text style={styles.checkHint}>{hint}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

            );
          })}
        </View>
      )}

      {type === "repair" && (
        <View style={styles.checklistSection}>
          <Text style={styles.checklistSectionTitle}>Select repair items</Text>
          {REPAIR_ITEM_CATALOG.map((category) => {
            const meta = REPAIR_CATEGORY_META[category.id];
            const selectedCount = category.items.filter((i) => selectedRepairItems[i.id]).length;
            const isExpanded = expandedRepairCategory === category.id;
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
                  {selectedCount > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}44` }]}>
                      <Text style={[styles.countBadgeText, { color: meta.color }]}>{selectedCount}</Text>
                    </View>
                  )}
                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={C.textSubtle}
                  />
                </TouchableOpacity>

                {isExpanded && category.items.map((item) => {
                  const checked = !!selectedRepairItems[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checkRow,
                        checked && { borderColor: `${meta.color}50`, backgroundColor: `${meta.color}0A` },
                      ]}
                      onPress={() => toggleRepairItem(item.id)}
                      activeOpacity={0.65}
                    >
                      <View style={[
                        styles.checkbox,
                        checked
                          ? { backgroundColor: meta.color, borderColor: meta.color }
                          : { backgroundColor: "transparent", borderColor: C.surfaceBorder },
                      ]}>
                        {checked && <Feather name="check" size={10} color="#000" />}
                      </View>
                      <Text style={[styles.checkLabel, checked && { color: C.text, fontFamily: "Inter_500Medium" }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.form}>
        <LuxInput
          label="Description"
          placeholder={
            type === "service"
              ? "Additional detail (optional), or describe work if nothing is ticked above"
              : "Additional detail (optional), or describe repair if nothing is ticked above"
          }
          value={form.description}
          onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
          error={errors.description}
          autoCapitalize="sentences"
        />
        {type === "service" && serviceDescriptionPreview.trim() ? (
          <Text style={styles.previewLabel} numberOfLines={4}>
            Saved as: {serviceDescriptionPreview}
          </Text>
        ) : null}
        {type === "repair" && repairDescriptionPreview.trim() ? (
          <Text style={styles.previewLabel} numberOfLines={4}>
            Saved as: {repairDescriptionPreview}
          </Text>
        ) : null}
        <LuxInput
          label="Cost (R)"
          placeholder="e.g. 1500"
          value={form.cost}
          onChangeText={(t) => setForm((f) => ({ ...f, cost: t }))}
          keyboardType="numeric"
          error={errors.cost}
        />
        <LuxInput
          label="Odometer (km)"
          placeholder="Current reading"
          value={form.odometer}
          onChangeText={(t) => setForm((f) => ({ ...f, odometer: t }))}
          keyboardType="numeric"
          error={errors.odometer}
        />
        <LuxInput
          label="Workshop (optional)"
          placeholder="e.g. Mike's Auto"
          value={form.workshop}
          onChangeText={(t) => setForm((f) => ({ ...f, workshop: t }))}
          autoCapitalize="words"
        />
        <LuxInput
          label="Notes (optional)"
          placeholder="Any additional notes..."
          value={form.notes}
          onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: "top" }}
        />
        <LuxInput
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form.date}
          onChangeText={(t) => setForm((f) => ({ ...f, date: t }))}
        />
      </View>

      <GoldButton label="Save Entry" onPress={handleSave} loading={loading} />
    </ScrollView>
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
  checklistSection: { gap: 12 },
  checklistSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
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
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabelGroup: { flex: 1, gap: 2 },
  checkLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted },
  checkLabelActive: { fontFamily: "Inter_500Medium", color: C.text },
  checkHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: -8,
  },
  form: { gap: 14 },
});
