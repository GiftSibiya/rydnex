import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useLogLinkedItems } from "@/hooks/useLogLinkedItems";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const CATEGORY_META: Record<ServiceItemCategoryId, { icon: FeatherIconName; color: string }> = {
  engine_fluids: { icon: "droplet", color: "#3B9EDB" },
  wear_tear: { icon: "tool", color: "#E67E22" },
  ignition: { icon: "zap", color: "#F1C40F" },
  electrical: { icon: "cpu", color: "#9B59B6" },
  tyres_alignment: { icon: "disc", color: "#1ABC9C" },
  cooling_air: { icon: "wind", color: "#2ECC71" },
};

const REPAIR_CATEGORY_META: Record<RepairItemCategoryId, { icon: FeatherIconName; color: string }> = {
  engine_repair: { icon: "settings", color: "#E74C3C" },
  brakes_steering: { icon: "alert-octagon", color: "#E67E22" },
  suspension_drivetrain: { icon: "rotate-cw", color: "#F1C40F" },
  electrical_sensors: { icon: "activity", color: "#9B59B6" },
  body_glass: { icon: "shield", color: "#3B9EDB" },
  exhaust_fuel: { icon: "thermometer", color: "#1ABC9C" },
};

function formatInterval(item: ServiceCatalogItem): string | null {
  const km = item.defaultIntervalKm;
  const mo = item.defaultIntervalMonths;
  if (km && mo) return `${(km / 1000).toFixed(0)}k km · ${mo} mo`;
  if (km) return `${(km / 1000).toFixed(0)}k km`;
  if (mo) return `${mo} mo`;
  return null;
}

/** Split saved description into catalog checkboxes vs optional free text (same format as create flow). */
function deriveSelectionAndExtra(
  fullDescription: string,
  kind: "service" | "repair"
): { selected: Record<string, boolean>; extra: string } {
  const catalog = kind === "service" ? SERVICE_ITEM_CATALOG : REPAIR_ITEM_CATALOG;
  const nameToId = new Map<string, string>();
  for (const cat of catalog) {
    for (const item of cat.items) {
      nameToId.set(item.name.trim(), item.id);
    }
  }
  const parts = fullDescription.split(";").map((s) => s.trim()).filter(Boolean);
  const selected: Record<string, boolean> = {};
  const extra: string[] = [];
  for (const p of parts) {
    const id = nameToId.get(p);
    if (id) selected[id] = true;
    else extra.push(p);
  }
  return { selected, extra: extra.join("; ") };
}

/** Saved log text: use the description field as-is when non-empty; otherwise names from ticks only. */
function effectiveLogDescription(
  kind: "service" | "repair",
  descriptionTrim: string,
  selectedService: Record<string, boolean>,
  selectedRepair: Record<string, boolean>
): string {
  if (descriptionTrim) return descriptionTrim;
  return kind === "repair"
    ? buildRepairDescriptionFromSelection(selectedRepair, "").trim()
    : buildServiceDescriptionFromSelection(selectedService, "").trim();
}

// ─── Date Picker ─────────────────────────────────────────────────────────────

const ITEM_H = 44;
const VISIBLE = 5;
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  card: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 24,
    left: 16, right: 16,
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  columns: { flexDirection: "row", height: ITEM_H * VISIBLE, overflow: "hidden" },
  column: { flex: 1, position: "relative" },
  scroll: { flex: 1 },
  item: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  itemText: { fontSize: 18, fontFamily: "Inter_400Regular", color: C.textMuted },
  itemSelected: { fontFamily: "Inter_700Bold", color: C.text, fontSize: 20 },
  highlight: {
    position: "absolute",
    top: PAD * ITEM_H, left: 4, right: 4,
    height: ITEM_H,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surfaceElevated,
  },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderColor: C.surfaceBorder,
    alignItems: "center", backgroundColor: C.surfaceElevated,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium", color: C.textMuted },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", backgroundColor: C.tint },
  confirmText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#000" },
});

function PickerColumn({ items, selected, onSelect }: {
  items: (string | number)[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const { colors: C } = useAppTheme();
  const pickerStyles = useMemo(() => createPickerStyles(C), [C]);
  const ref = useRef<ScrollView>(null);
  const didMount = useRef(false);

  const scrollTo = useCallback((index: number, animated: boolean) => {
    ref.current?.scrollTo({ y: index * ITEM_H, animated });
  }, []);

  const onLayout = useCallback(() => {
    if (!didMount.current) { didMount.current = true; scrollTo(selected, false); }
  }, [selected, scrollTo]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    onSelect(clamped);
    scrollTo(clamped, true);
  }, [items.length, onSelect, scrollTo]);

  return (
    <View style={pickerStyles.column}>
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
          <TouchableOpacity key={i} style={pickerStyles.item} onPress={() => { onSelect(i); scrollTo(i, true); }} activeOpacity={0.6}>
            <Text style={[pickerStyles.itemText, i === selected && pickerStyles.itemSelected]}>
              {typeof item === "number" ? String(item).padStart(2, "0") : item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function DatePickerModal({ visible, value, onConfirm, onClose }: {
  visible: boolean;
  value: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}) {
  const { colors: C } = useAppTheme();
  const pickerStyles = useMemo(() => createPickerStyles(C), [C]);
  const parsed = useMemo(() => { const d = new Date(value); return isNaN(d.getTime()) ? new Date() : d; }, [value]);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => range(currentYear - 10, currentYear + 2), [currentYear]);

  const [dayIdx, setDayIdx] = useState(() => parsed.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(() => parsed.getMonth());
  const [yearIdx, setYearIdx] = useState(() => years.indexOf(parsed.getFullYear()));

  const selectedYear = years[yearIdx] ?? currentYear;
  const selectedMonth = monthIdx + 1;
  const maxDays = daysInMonth(selectedMonth, selectedYear);
  const days = useMemo(() => range(1, maxDays), [maxDays]);
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

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Params = Record<string, string | string[]>;

export default function LogbookItemEditPage() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();
  const { updateServiceLog, updateFuelLog, updateOdometerLog } = useVehicle();

  const _type = String(params._type ?? "");
  const id = String(params.id ?? "");
  const isRepairLog = _type === "service" && String(params.type) === "repair";
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const linkKind = isRepairLog ? "repair" : "service";
  const { linkedSlugs, loading: linksLoading, error: linksError } = useLogLinkedItems(
    _type === "service" ? id : undefined,
    linkKind
  );

  const toDateStr = (raw: string) => {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  };

  const [selectedServiceItems, setSelectedServiceItems] = useState<Record<string, boolean>>({});
  const [selectedRepairItems, setSelectedRepairItems] = useState<Record<string, boolean>>({});
  const [expandedCategory, setExpandedCategory] = useState<ServiceItemCategoryId | null>(null);
  const [expandedRepairCategory, setExpandedRepairCategory] = useState<RepairItemCategoryId | null>(null);

  // ── Service / Repair state ──
  const [svcForm, setSvcForm] = useState(() => {
    const full = String(params.description ?? "");
    return {
      /** Full line stored on the log — editing this replaces the saved description (ticks add DB links only). */
      description: full,
      cost: String(params.cost ?? ""),
      odometer: String(params.odometer ?? ""),
      workshop: String(params.workshop ?? ""),
      notes: String(params.notes ?? ""),
      date: toDateStr(String(params.date ?? "")),
    };
  });

  useEffect(() => {
    if (_type !== "service") return;
    if (linksLoading) return;
    if (!linksError) {
      const map: Record<string, boolean> = {};
      for (const s of linkedSlugs) map[s] = true;
      if (isRepairLog) setSelectedRepairItems(map);
      else setSelectedServiceItems(map);
      return;
    }
    const kind = isRepairLog ? "repair" : "service";
    const { selected } = deriveSelectionAndExtra(String(params.description ?? ""), kind);
    if (isRepairLog) setSelectedRepairItems(selected);
    else setSelectedServiceItems(selected);
  }, [_type, linksLoading, linksError, linkedSlugs, isRepairLog, params.description]);

  const toggleCategory = (cat: ServiceItemCategoryId) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };
  const toggleRepairCategory = (cat: RepairItemCategoryId) => {
    setExpandedRepairCategory((prev) => (prev === cat ? null : cat));
  };
  const toggleServiceItem = (itemId: string) => {
    setSelectedServiceItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };
  const toggleRepairItem = (itemId: string) => {
    setSelectedRepairItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // ── Fuel state ──
  const [fuelForm, setFuelForm] = useState({
    liters: String(params.liters ?? ""),
    costPerLiter: String(params.costPerLiter ?? ""),
    totalCost: String(params.totalCost ?? ""),
    odometer: String(params.odometer ?? ""),
    fullTank: String(params.fullTank) === "true",
    date: toDateStr(String(params.date ?? "")),
  });

  // ── Odometer state ──
  const [odoForm, setOdoForm] = useState({
    reading: String(params.reading ?? ""),
    note: String(params.note ?? ""),
    date: toDateStr(String(params.date ?? "")),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // auto-calculate totalCost when liters or costPerLiter changes
  const handleFuelLitersChange = (t: string) => {
    const liters = parseFloat(t) || 0;
    const cpl = parseFloat(fuelForm.costPerLiter) || 0;
    setFuelForm((f) => ({ ...f, liters: t, totalCost: liters && cpl ? (liters * cpl).toFixed(2) : f.totalCost }));
  };
  const handleFuelCplChange = (t: string) => {
    const cpl = parseFloat(t) || 0;
    const liters = parseFloat(fuelForm.liters) || 0;
    setFuelForm((f) => ({ ...f, costPerLiter: t, totalCost: liters && cpl ? (liters * cpl).toFixed(2) : f.totalCost }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (_type === "service") {
      const kind = isRepairLog ? "repair" : "service";
      const effective = effectiveLogDescription(
        kind,
        svcForm.description.trim(),
        selectedServiceItems,
        selectedRepairItems
      );
      if (!effective) e.description = "Select at least one item or enter a description";
      if (!svcForm.cost || isNaN(Number(svcForm.cost))) e.cost = "Enter a valid cost";
      if (!svcForm.odometer || isNaN(Number(svcForm.odometer))) e.odometer = "Enter a valid odometer reading";
    } else if (_type === "fuel") {
      if (!fuelForm.liters || isNaN(Number(fuelForm.liters))) e.liters = "Enter litres";
      if (!fuelForm.costPerLiter || isNaN(Number(fuelForm.costPerLiter))) e.costPerLiter = "Enter cost per litre";
      if (!fuelForm.odometer || isNaN(Number(fuelForm.odometer))) e.odometer = "Enter odometer reading";
    } else if (_type === "odometer") {
      if (!odoForm.reading || isNaN(Number(odoForm.reading))) e.reading = "Enter a valid reading";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (_type === "service") {
        const kind = isRepairLog ? "repair" : "service";
        const description = effectiveLogDescription(
          kind,
          svcForm.description.trim(),
          selectedServiceItems,
          selectedRepairItems
        );
        const selectedServiceItemSlugs = !isRepairLog
          ? Object.entries(selectedServiceItems).filter(([, v]) => v).map(([slug]) => slug)
          : undefined;
        const selectedRepairItemSlugs = isRepairLog
          ? Object.entries(selectedRepairItems).filter(([, v]) => v).map(([slug]) => slug)
          : undefined;
        await updateServiceLog(id, {
          description,
          cost: Number(svcForm.cost),
          odometer: Number(svcForm.odometer),
          workshop: svcForm.workshop.trim() || undefined,
          notes: svcForm.notes.trim() || undefined,
          date: new Date(svcForm.date).toISOString(),
          selectedServiceItemSlugs,
          selectedRepairItemSlugs,
        });
      } else if (_type === "fuel") {
        const liters = Number(fuelForm.liters);
        const costPerLiter = Number(fuelForm.costPerLiter);
        await updateFuelLog(id, {
          liters,
          costPerLiter,
          totalCost: liters * costPerLiter,
          odometer: Number(fuelForm.odometer),
          fullTank: fuelForm.fullTank,
          date: new Date(fuelForm.date).toISOString(),
        });
      } else if (_type === "odometer") {
        await updateOdometerLog(id, {
          reading: Number(odoForm.reading),
          note: odoForm.note.trim() || undefined,
          date: new Date(odoForm.date).toISOString(),
        });
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const accentColor = _type === "fuel" ? C.info : _type === "odometer" ? C.success : (String(params.type) === "repair" ? C.danger : C.tint);
  const currentDate = _type === "service" ? svcForm.date : _type === "fuel" ? fuelForm.date : odoForm.date;
  const setDate = (d: string) => {
    if (_type === "service") setSvcForm((f) => ({ ...f, date: d }));
    else if (_type === "fuel") setFuelForm((f) => ({ ...f, date: d }));
    else setOdoForm((f) => ({ ...f, date: d }));
  };

  const title = _type === "fuel" ? "Edit Fuel Log" : _type === "odometer" ? "Edit Odometer" : (String(params.type) === "repair" ? "Edit Repair" : "Edit Service");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={[styles.titleBadge, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}28` }]}>
          <Text style={[styles.titleText, { color: accentColor }]}>{title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Divider */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

      {/* ── Service / Repair form ── */}
      {_type === "service" && (
        <View style={styles.form}>
          {!isRepairLog && (
            <View style={styles.checklistSection}>
              <Text style={styles.checklistSectionTitle}>Service items</Text>
              <Text style={styles.checklistHint}>
                Ticked items are stored as links. The description below is saved exactly as written—clear it and type a new line to replace the whole text.
              </Text>
              {SERVICE_ITEM_CATALOG.map((category) => {
                const meta = CATEGORY_META[category.id];
                const selectedCount = category.items.filter((i) => selectedServiceItems[i.id]).length;
                return (
                  <View key={category.id} style={styles.categoryCard}>
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
                          <View
                            style={[
                              styles.checkbox,
                              checked
                                ? { backgroundColor: meta.color, borderColor: meta.color }
                                : { backgroundColor: "transparent", borderColor: C.surfaceBorder },
                            ]}
                          >
                            {checked && <Feather name="check" size={10} color="#000" />}
                          </View>
                          <View style={styles.checkLabelGroup}>
                            <Text style={[styles.checkLabel, checked && { color: C.text, fontFamily: "Inter_500Medium" }]}>
                              {item.name}
                            </Text>
                            {hint ? <Text style={styles.checkHint}>{hint}</Text> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {isRepairLog && (
            <View style={styles.checklistSection}>
              <Text style={styles.checklistSectionTitle}>Repair items</Text>
              <Text style={styles.checklistHint}>
                Ticked items are stored as links. The description below is saved exactly as written—clear it and type a new line to replace the whole text.
              </Text>
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
                      <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={C.textSubtle} />
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
                          <View
                            style={[
                              styles.checkbox,
                              checked
                                ? { backgroundColor: meta.color, borderColor: meta.color }
                                : { backgroundColor: "transparent", borderColor: C.surfaceBorder },
                            ]}
                          >
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

          <LuxInput
            label="Description"
            placeholder={
              isRepairLog
                ? "Full repair summary (saved as shown). Leave blank only if the lines above fully describe it."
                : "Full service summary (saved as shown). Leave blank only if the lines above fully describe it."
            }
            value={svcForm.description}
            onChangeText={(t) => setSvcForm((f) => ({ ...f, description: t }))}
            error={errors.description}
            autoCapitalize="sentences"
          />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <LuxInput
                label="Cost (R)"
                placeholder="0.00"
                value={svcForm.cost}
                onChangeText={(t) => setSvcForm((f) => ({ ...f, cost: t }))}
                keyboardType="numeric"
                error={errors.cost}
              />
            </View>
            <View style={{ flex: 1 }}>
              <LuxInput
                label="Odometer (km)"
                placeholder="Reading"
                value={svcForm.odometer}
                onChangeText={(t) => setSvcForm((f) => ({ ...f, odometer: t }))}
                keyboardType="numeric"
                error={errors.odometer}
              />
            </View>
          </View>
          <LuxInput
            label="Workshop (optional)"
            placeholder="e.g. Mike's Auto"
            value={svcForm.workshop}
            onChangeText={(t) => setSvcForm((f) => ({ ...f, workshop: t }))}
            autoCapitalize="words"
          />
          <LuxInput
            label="Notes (optional)"
            placeholder="Any additional notes..."
            value={svcForm.notes}
            onChangeText={(t) => setSvcForm((f) => ({ ...f, notes: t }))}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top" }}
          />
          <DateField value={svcForm.date} onPress={() => setDatePickerVisible(true)} />
        </View>
      )}

      {/* ── Fuel form ── */}
      {_type === "fuel" && (
        <View style={styles.form}>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <LuxInput
                label="Litres"
                placeholder="0.00"
                value={fuelForm.liters}
                onChangeText={handleFuelLitersChange}
                keyboardType="decimal-pad"
                error={errors.liters}
              />
            </View>
            <View style={{ flex: 1 }}>
              <LuxInput
                label="Cost per Litre (R)"
                placeholder="0.00"
                value={fuelForm.costPerLiter}
                onChangeText={handleFuelCplChange}
                keyboardType="decimal-pad"
                error={errors.costPerLiter}
              />
            </View>
          </View>
          <View style={[styles.totalCard, { borderColor: `${C.info}22`, backgroundColor: `${C.info}08` }]}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={[styles.totalValue, { color: C.info }]}>
              R{(Number(fuelForm.liters) * Number(fuelForm.costPerLiter) || Number(fuelForm.totalCost) || 0).toFixed(2)}
            </Text>
          </View>
          <LuxInput
            label="Odometer (km)"
            placeholder="Reading at fill-up"
            value={fuelForm.odometer}
            onChangeText={(t) => setFuelForm((f) => ({ ...f, odometer: t }))}
            keyboardType="numeric"
            error={errors.odometer}
          />
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Feather name="battery-charging" size={15} color={C.info} />
              <Text style={styles.toggleLabel}>Full tank</Text>
            </View>
            <Switch
              value={fuelForm.fullTank}
              onValueChange={(v) => setFuelForm((f) => ({ ...f, fullTank: v }))}
              trackColor={{ false: C.surfaceBorder, true: `${C.info}80` }}
              thumbColor={fuelForm.fullTank ? C.info : C.textSubtle}
            />
          </View>
          <DateField value={fuelForm.date} onPress={() => setDatePickerVisible(true)} />
        </View>
      )}

      {/* ── Odometer form ── */}
      {_type === "odometer" && (
        <View style={styles.form}>
          <LuxInput
            label="Reading (km)"
            placeholder="e.g. 85000"
            value={odoForm.reading}
            onChangeText={(t) => setOdoForm((f) => ({ ...f, reading: t }))}
            keyboardType="numeric"
            error={errors.reading}
          />
          <LuxInput
            label="Note (optional)"
            placeholder="Any context..."
            value={odoForm.note}
            onChangeText={(t) => setOdoForm((f) => ({ ...f, note: t }))}
            autoCapitalize="sentences"
          />
          <DateField value={odoForm.date} onPress={() => setDatePickerVisible(true)} />
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: accentColor }, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Feather name={loading ? "loader" : "check"} size={17} color="#000" />
        <Text style={styles.saveBtnText}>{loading ? "Saving…" : "Save Changes"}</Text>
      </TouchableOpacity>

      <DatePickerModal
        visible={datePickerVisible}
        value={currentDate}
        onConfirm={(d) => { setDate(d); setDatePickerVisible(false); }}
        onClose={() => setDatePickerVisible(false)}
      />
    </ScrollView>
  );
}

function DateField({ value, onPress }: { value: string; onPress: () => void }) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  return (
    <View style={styles.dateWrap}>
      <Text style={styles.dateLabel}>Date</Text>
      <TouchableOpacity style={styles.dateField} onPress={onPress} activeOpacity={0.7}>
        <Feather name="calendar" size={16} color={C.textSubtle} />
        <Text style={styles.dateValue}>{value}</Text>
        <Feather name="chevron-down" size={16} color={C.textSubtle} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1, borderColor: C.surfaceBorder,
    alignItems: "center", justifyContent: "center",
  },
  titleBadge: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  titleText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  accentLine: { height: 1, borderRadius: 1, opacity: 0.4 },
  form: { gap: 14 },
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
    lineHeight: 17,
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
  checkHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
  },
  row2: { flexDirection: "row", gap: 12 },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textMuted },
  totalValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surfaceElevated,
    borderWidth: 1, borderColor: C.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  dateWrap: { gap: 6 },
  dateLabel: {
    fontSize: 12, fontFamily: "Inter_500Medium",
    color: C.textMuted, letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dateField: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.surfaceElevated,
    borderRadius: 12, borderWidth: 1, borderColor: C.surfaceBorder,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  dateValue: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
});
