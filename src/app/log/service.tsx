import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GoldButton from "@/components/buttons/GoldButton";
import LuxInput from "@/components/forms/LuxInput";
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
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

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

// ─── Scroll Date Picker ───────────────────────────────────────────────────────

const ITEM_H = 44;
const VISIBLE = 5; // odd number so selected is centered
const PAD = Math.floor(VISIBLE / 2);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function range(from: number, to: number) {
  const arr: number[] = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const createPickerStyles = (C: AppThemeColors) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 24,
    left: 16,
    right: 16,
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  columns: {
    flexDirection: "row",
    height: ITEM_H * VISIBLE,
    overflow: "hidden",
  },
  column: {
    flex: 1,
    position: "relative",
  },
  scroll: { flex: 1 },
  item: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  itemSelected: {
    fontFamily: "Inter_700Bold",
    color: C.text,
    fontSize: 20,
  },
  highlight: {
    position: "absolute",
    top: PAD * ITEM_H,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surfaceElevated,
  },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    alignItems: "center",
    backgroundColor: C.surfaceElevated,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium", color: C.textMuted },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: C.tint,
  },
  confirmText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#000" },
});

type ColumnProps = {
  items: (string | number)[];
  selected: number; // index
  onSelect: (index: number) => void;
};

function PickerColumn({ items, selected, onSelect }: ColumnProps) {
  const { colors: C } = useAppTheme();
  const pickerStyles = useMemo(() => createPickerStyles(C), [C]);
  const ref = useRef<ScrollView>(null);
  const didMount = useRef(false);

  // Scroll to selected index on mount and when selected changes externally
  const scrollTo = useCallback((index: number, animated: boolean) => {
    ref.current?.scrollTo({ y: index * ITEM_H, animated });
  }, []);

  // Mount — scroll without animation
  const onLayout = useCallback(() => {
    if (!didMount.current) {
      didMount.current = true;
      scrollTo(selected, false);
    }
  }, [selected, scrollTo]);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      onSelect(clamped);
      scrollTo(clamped, true);
    },
    [items.length, onSelect, scrollTo],
  );

  return (
    <View style={pickerStyles.column}>
      {/* Highlight band — behind the scroll content */}
      <View pointerEvents="none" style={pickerStyles.highlight} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onLayout={onLayout}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: PAD * ITEM_H }}
        style={pickerStyles.scroll}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={pickerStyles.item}
            onPress={() => { onSelect(i); scrollTo(i, true); }}
            activeOpacity={0.6}
          >
            <Text style={[pickerStyles.itemText, i === selected && pickerStyles.itemSelected]}>
              {typeof item === "number" ? String(item).padStart(2, "0") : item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

type DatePickerModalProps = {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onConfirm: (date: string) => void;
  onClose: () => void;
};

function DatePickerModal({ visible, value, onConfirm, onClose }: DatePickerModalProps) {
  const { colors: C } = useAppTheme();
  const pickerStyles = useMemo(() => createPickerStyles(C), [C]);
  const parsed = useMemo(() => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => range(currentYear - 10, currentYear + 2), [currentYear]);

  const [dayIdx, setDayIdx] = useState(() => parsed.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(() => parsed.getMonth());
  const [yearIdx, setYearIdx] = useState(() => years.indexOf(parsed.getFullYear()));

  const selectedYear = years[yearIdx] ?? currentYear;
  const selectedMonth = monthIdx + 1;
  const maxDays = daysInMonth(selectedMonth, selectedYear);
  const days = useMemo(() => range(1, maxDays), [maxDays]);

  // Clamp day when month/year changes reduce available days
  const safeDayIdx = Math.min(dayIdx, days.length - 1);

  const handleConfirm = () => {
    const d = String(safeDayIdx + 1).padStart(2, "0");
    const m = String(selectedMonth).padStart(2, "0");
    onConfirm(`${selectedYear}-${m}-${d}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose} />
      <View style={pickerStyles.card} pointerEvents="box-none">
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.title}>Select Date</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Feather name="x" size={18} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={pickerStyles.columns}>
          <PickerColumn items={days} selected={safeDayIdx} onSelect={setDayIdx} />
          <PickerColumn items={MONTHS} selected={monthIdx} onSelect={setMonthIdx} />
          <PickerColumn items={years} selected={yearIdx < 0 ? years.length - 3 : yearIdx} onSelect={setYearIdx} />
        </View>

        <View style={pickerStyles.btnRow}>
          <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={pickerStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pickerStyles.confirmBtn} onPress={handleConfirm} activeOpacity={0.7}>
            <Text style={pickerStyles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ServiceLogScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
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
  /** Start with first category open so items are visible (tap headers to switch). */
  const [expandedCategory, setExpandedCategory] = useState<ServiceItemCategoryId | null>("engine_fluids");
  const [selectedRepairItems, setSelectedRepairItems] = useState<Record<string, boolean>>({});
  const [expandedRepairCategory, setExpandedRepairCategory] = useState<RepairItemCategoryId | null>(
    "engine_repair"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

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
    const selectedServiceItemSlugs =
      type === "service"
        ? Object.entries(selectedServiceItems)
            .filter(([, isSelected]) => Boolean(isSelected))
            .map(([slug]) => slug)
        : [];
    const selectedRepairItemSlugs =
      type === "repair"
        ? Object.entries(selectedRepairItems)
            .filter(([, isSelected]) => Boolean(isSelected))
            .map(([slug]) => slug)
        : [];
    const description =
      type === "service"
        ? buildServiceDescriptionFromSelection(selectedServiceItems, form.description)
        : buildRepairDescriptionFromSelection(selectedRepairItems, form.description);

    await addServiceLog({
      vehicleId: activeVehicle.id,
      date: new Date(form.date).toISOString(),
      type,
      description: description.trim(),
      cost: Number(form.cost),
      odometer: Number(form.odometer),
      workshop: form.workshop.trim() || undefined,
      notes: form.notes.trim() || undefined,
      selectedServiceItemSlugs,
      selectedRepairItemSlugs,
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
          <Text style={styles.checklistHint}>Tap a category to expand or collapse the checklist.</Text>
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
          <Text style={styles.checklistHint}>Tap a category to expand or collapse the checklist.</Text>
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
          label="Extra detail (optional)"
          placeholder={
            type === "service"
              ? "Appended after ticked items, or describe the work if you tick nothing above"
              : "Appended after ticked items, or describe the repair if you tick nothing above"
          }
          value={form.description}
          onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
          error={errors.description}
          autoCapitalize="sentences"
        />
        {type === "service" && serviceDescriptionPreview.trim() ? (
          <View style={styles.previewBlock}>
            <Text style={styles.previewHeading}>Summary (saved with this entry)</Text>
            <Text style={styles.previewLabel}>{serviceDescriptionPreview}</Text>
          </View>
        ) : null}
        {type === "repair" && repairDescriptionPreview.trim() ? (
          <View style={styles.previewBlock}>
            <Text style={styles.previewHeading}>Summary (saved with this entry)</Text>
            <Text style={styles.previewLabel}>{repairDescriptionPreview}</Text>
          </View>
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
        <View style={styles.dateWrap}>
          <Text style={styles.dateLabel}>Date</Text>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="calendar" size={16} color={C.textSubtle} />
            <Text style={styles.dateValue}>{form.date}</Text>
            <Feather name="chevron-down" size={16} color={C.textSubtle} />
          </TouchableOpacity>
        </View>
      </View>

      <GoldButton label="Save Entry" onPress={handleSave} loading={loading} />

      <DatePickerModal
        visible={datePickerVisible}
        value={form.date}
        onConfirm={(d) => { setForm((f) => ({ ...f, date: d })); setDatePickerVisible(false); }}
        onClose={() => setDatePickerVisible(false)}
      />
    </ScrollView>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
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
  previewBlock: {
    gap: 6,
    marginTop: -4,
  },
  previewHeading: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.text,
    lineHeight: 19,
  },
  form: { gap: 14 },
  dateWrap: { gap: 6 },
  dateLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateValue: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
});
