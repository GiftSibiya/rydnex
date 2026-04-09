import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import skaftinClient from "@/backend/client/SkaftinClient";
import routes from "@/constants/ApiRoutes";
import Colors from "@/constants/colors";
import {
  REPAIR_ITEM_CATALOG,
  RepairItemCategoryId,
  SERVICE_ITEM_CATALOG,
  ServiceCatalogItem,
  ServiceItemCategoryId,
} from "@/constants/Constants";
import { useVehicle } from "@/contexts/VehicleContext";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const C = Colors.dark;

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

function normalizeForMatch(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveCatalogRow(
  raw: string,
  isRepair: boolean
): {
  categoryId: ServiceItemCategoryId | RepairItemCategoryId;
  item: ServiceCatalogItem | { id: string; name: string };
} | null {
  const t = raw.trim();
  if (!t) return null;
  const catalog = isRepair ? REPAIR_ITEM_CATALOG : SERVICE_ITEM_CATALOG;
  const norm = normalizeForMatch(t);
  const idGuess = t.toLowerCase().replace(/\s+/g, "_");

  for (const cat of catalog) {
    for (const item of cat.items) {
      if (item.id === t || item.id === idGuess) {
        return { categoryId: cat.id, item };
      }
      if (normalizeForMatch(item.name) === norm) {
        return { categoryId: cat.id, item };
      }
    }
  }
  return null;
}

type GroupedItemRow = { itemId: string; displayName: string; hint: string | null };

type ItemSection = {
  categoryId: ServiceItemCategoryId | RepairItemCategoryId;
  title: string;
  meta: { icon: FeatherIconName; color: string };
  rows: GroupedItemRow[];
};

function groupDisplayItemsByCategory(displayItems: string[], isRepair: boolean): {
  sections: ItemSection[];
  unknownLabels: string[];
} {
  const catalog = isRepair ? REPAIR_ITEM_CATALOG : SERVICE_ITEM_CATALOG;
  const seen = new Set<string>();
  const buckets = new Map<string, GroupedItemRow[]>();
  const unknownLabels: string[] = [];

  for (const label of displayItems) {
    const resolved = resolveCatalogRow(label, isRepair);
    if (!resolved) {
      const trimmed = label.trim();
      if (trimmed) unknownLabels.push(trimmed);
      continue;
    }
    const dedupeKey = `${resolved.categoryId}:${resolved.item.id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const hint =
      !isRepair && "defaultIntervalKm" in resolved.item
        ? formatInterval(resolved.item as ServiceCatalogItem)
        : null;
    const row: GroupedItemRow = {
      itemId: resolved.item.id,
      displayName: resolved.item.name,
      hint,
    };
    const prev = buckets.get(resolved.categoryId) ?? [];
    buckets.set(resolved.categoryId, [...prev, row]);
  }

  const sections: ItemSection[] = [];
  for (const cat of catalog) {
    const rows = buckets.get(cat.id);
    if (!rows?.length) continue;
    const meta = isRepair
      ? REPAIR_CATEGORY_META[cat.id as RepairItemCategoryId]
      : CATEGORY_META[cat.id as ServiceItemCategoryId];
    sections.push({ categoryId: cat.id, title: cat.title, meta, rows });
  }

  return { sections, unknownLabels };
}

type LogBookItemParams =
  | {
      _type: "service";
      id: string;
      date: string;
      type: "service" | "repair";
      description?: string;
      cost: string;
      odometer: string;
      workshop?: string;
      notes?: string;
      serviceItemNames?: string | string[];
      serviceItemSlugs?: string | string[];
      repairItemNames?: string | string[];
      repairItemSlugs?: string | string[];
    }
  | { _type: "fuel"; id: string; date: string; liters: string; costPerLiter: string; totalCost: string; odometer: string; fullTank: string }
  | { _type: "odometer"; id: string; date: string; reading: string; note?: string };

function parseListValue(value?: string | string[]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      // fall through
    }
  }
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

function Row({
  label,
  value,
  accent,
  icon,
  accentColor,
  delay = 0,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
  accentColor?: string;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[styles.row, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.rowLeft}>
        {icon && (
          <View style={[styles.rowIconWrap, { backgroundColor: `${accentColor ?? C.tint}15` }]}>
            <Feather name={icon} size={12} color={accentColor ?? C.tint} />
          </View>
        )}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, accent && { color: accentColor ?? C.tint, fontFamily: "Inter_700Bold", fontSize: 17 }]}>
        {value}
      </Text>
    </Animated.View>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

export default function LogBookItemRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Record<string, string | string[]>>() as unknown as LogBookItemParams;
  const { deleteServiceLog, deleteFuelLog } = useVehicle();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDelete = () => {
    Alert.alert("Delete entry", "Are you sure you want to delete this log entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (params._type === "service") await deleteServiceLog(params.id);
          else if (params._type === "fuel") await deleteFuelLog(params.id);
          router.back();
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push({
      pathname: "/log/subpages/logbook-item-edit-page",
      params: params as unknown as Record<string, string>,
    });
  };

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.96)).current;

  const [fetchedItemNames, setFetchedItemNames] = useState<string[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const isService = params._type === "service";
  const isFuel = params._type === "fuel";
  const isOdometer = params._type === "odometer";
  const serviceLogType = isService
    ? (params as Extract<LogBookItemParams, { _type: "service" }>).type
    : undefined;
  const isRepairEntry = serviceLogType === "repair";

  useEffect(() => {
    if (!isService || serviceLogType == null) return;
    const rawId = params.id;
    const dbId =
      rawId.startsWith("s-") || rawId.startsWith("r-")
        ? Number(rawId.slice(2))
        : Number(rawId);
    if (!dbId || isNaN(dbId)) return;

    setItemsLoading(true);
    const linksRoute = isRepairEntry
      ? routes.maintenance.repairLogItems.list
      : routes.maintenance.serviceLogItems.list;
    const linksWhere = isRepairEntry
      ? { repair_log_id: dbId }
      : { service_log_id: dbId };
    const itemsRoute = isRepairEntry
      ? routes.reference.repairItems.list
      : routes.reference.serviceItems.list;
    const itemIdKey = isRepairEntry ? "repair_item_id" : "service_item_id";

    skaftinClient
      .post<Record<string, any>[]>(linksRoute, { where: linksWhere })
      .then(async (linksRes) => {
        const links = Array.isArray(linksRes.data) ? linksRes.data : [];
        if (links.length === 0) {
          setItemsLoading(false);
          return;
        }

        const itemIds = links.map((l) => Number(l[itemIdKey])).filter((id) => !Number.isNaN(id));
        const itemsRes = await skaftinClient.post<Record<string, any>[]>(
          itemsRoute,
          {},
        );
        const allItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];
        const names = allItems
          .filter((i) => itemIds.includes(i.id as number))
          .map((i) => String(i.name));
        setFetchedItemNames(names);
      })
      .catch(() => {
        // silently fall back to params
      })
      .finally(() => setItemsLoading(false));
  }, [isService, isRepairEntry, params.id, serviceLogType]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
    ]).start();
  }, [headerOpacity, headerScale]);

  const accentColor = isService
    ? isRepairEntry ? C.danger : C.tint
    : isFuel ? C.info : C.success;

  const iconName: React.ComponentProps<typeof Feather>["name"] = isService
    ? "tool" : isFuel ? "droplet" : "activity";

  const title = isService
    ? isRepairEntry ? "Repair" : "Service"
    : isFuel ? "Fuel Fill-up" : "Odometer";

  const formattedDate = new Date(params.date).toLocaleDateString("en-ZA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const paramNames = isService
    ? (isRepairEntry
        ? parseListValue(params.repairItemNames)
        : parseListValue(params.serviceItemNames))
    : [];
  const paramSlugs = isService
    ? (isRepairEntry
        ? parseListValue(params.repairItemSlugs)
        : parseListValue(params.serviceItemSlugs))
    : [];
  const displayItems = fetchedItemNames.length > 0
    ? fetchedItemNames
    : paramNames.length > 0 ? paramNames : paramSlugs;

  const catalogLabels = useMemo(
    () => displayItems.map((s) => String(s).trim()).filter(Boolean),
    [displayItems]
  );

  const { sections: itemSections, unknownLabels: uncategorizedItems } = useMemo(
    () => groupDisplayItemsByCategory(catalogLabels, isRepairEntry),
    [catalogLabels, isRepairEntry]
  );

  const serviceDescription = isService ? (params.description?.trim() ?? "") : "";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color={C.text} />
      </TouchableOpacity>

      <Animated.View style={[styles.hero, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <LinearGradient
          colors={[`${accentColor}22`, `${accentColor}06`, "transparent"]}
          style={styles.heroGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={[styles.heroBadge, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` }]}>
          <Feather name={iconName} size={30} color={accentColor} />
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <View style={[styles.datePill, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}25` }]}>
          <Feather name="calendar" size={11} color={accentColor} />
          <Text style={[styles.datePillText, { color: accentColor }]}>{formattedDate}</Text>
        </View>
      </Animated.View>

      {isService && (
        <>
          {(itemsLoading || catalogLabels.length > 0) && (
            <View style={styles.section}>
              <SectionHeading label={isRepairEntry ? "Repair items" : "Service items"} />
              {itemsLoading ? (
                <ActivityIndicator size="small" color={accentColor} style={{ alignSelf: "flex-start", marginLeft: 4 }} />
              ) : (
                <View style={styles.categorizedItemsWrap}>
                  {itemSections.map((sec) => (
                    <View key={sec.categoryId} style={styles.categoryCard}>
                      <View style={styles.categoryHeader}>
                        <View style={[styles.categoryIconBadge, { backgroundColor: `${sec.meta.color}18` }]}>
                          <Feather name={sec.meta.icon} size={14} color={sec.meta.color} />
                        </View>
                        <Text style={[styles.categoryTitle, { color: sec.meta.color }]}>{sec.title}</Text>
                        <View
                          style={[
                            styles.countBadge,
                            { backgroundColor: `${sec.meta.color}22`, borderColor: `${sec.meta.color}44` },
                          ]}
                        >
                          <Text style={[styles.countBadgeText, { color: sec.meta.color }]}>{sec.rows.length}</Text>
                        </View>
                      </View>
                      {sec.rows.map((row, i) => (
                        <View
                          key={row.itemId}
                          style={[styles.catalogItemRow, i > 0 && styles.catalogItemRowBorder]}
                        >
                          <View style={[styles.catalogItemDot, { backgroundColor: sec.meta.color }]} />
                          <View style={styles.catalogItemLabelCol}>
                            <Text style={styles.catalogItemName}>{row.displayName}</Text>
                            {row.hint ? <Text style={styles.catalogItemHint}>{row.hint}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}

                  {uncategorizedItems.length > 0 && (
                    <View style={styles.categoryCard}>
                      <View style={styles.categoryHeader}>
                        <View style={[styles.categoryIconBadge, { backgroundColor: `${C.textSubtle}18` }]}>
                          <Feather name="help-circle" size={14} color={C.textSubtle} />
                        </View>
                        <Text style={[styles.categoryTitle, { color: C.textMuted }]}>Other</Text>
                        <View
                          style={[
                            styles.countBadge,
                            { backgroundColor: `${C.textSubtle}22`, borderColor: `${C.textSubtle}44` },
                          ]}
                        >
                          <Text style={[styles.countBadgeText, { color: C.textMuted }]}>
                            {uncategorizedItems.length}
                          </Text>
                        </View>
                      </View>
                      {uncategorizedItems.map((label, i) => (
                        <View
                          key={`other-${label}-${i}`}
                          style={[styles.catalogItemRow, i > 0 && styles.catalogItemRowBorder]}
                        >
                          <View style={[styles.catalogItemDot, { backgroundColor: C.textSubtle }]} />
                          <View style={styles.catalogItemLabelCol}>
                            <Text style={styles.catalogItemName}>{label}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {serviceDescription.length > 0 && (
            <View style={styles.section}>
              <SectionHeading label="Description" />
              <View style={[styles.descriptionCard, { borderColor: `${accentColor}20` }]}>
                <Text style={styles.descriptionText}>{serviceDescription}</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeading label="Details" />
            <View style={styles.card}>
              <Row label="Cost" value={`R${Number(params.cost).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`} accent accentColor={accentColor} icon="credit-card" delay={60} />
              <View style={styles.divider} />
              <Row label="Odometer" value={`${Number(params.odometer).toLocaleString()} km`} icon="navigation" accentColor={accentColor} delay={120} />
              {params.workshop ? (
                <>
                  <View style={styles.divider} />
                  <Row label="Workshop" value={params.workshop} icon="map-pin" accentColor={accentColor} delay={180} />
                </>
              ) : null}
              {params.notes ? (
                <>
                  <View style={styles.divider} />
                  <Row label="Notes" value={params.notes} icon="file-text" accentColor={accentColor} delay={240} />
                </>
              ) : null}
            </View>
          </View>

          <View style={[styles.typePill, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}28` }]}>
            <Feather name={isRepairEntry ? "alert-triangle" : "check-circle"} size={12} color={accentColor} />
            <Text style={[styles.typePillText, { color: accentColor }]}>
              {isRepairEntry ? "Repair job" : "Routine service"}
            </Text>
          </View>
        </>
      )}

      {isFuel && (
        <>
          <View style={styles.section}>
            <LinearGradient
              colors={[`${accentColor}18`, `${accentColor}06`]}
              style={styles.calloutCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.calloutLabel}>Total Cost</Text>
              <Text style={[styles.calloutValue, { color: accentColor }]}>
                R{Number(params.totalCost).toFixed(2)}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <SectionHeading label="Breakdown" />
            <View style={styles.card}>
              <Row label="Litres" value={`${params.liters} L`} icon="droplet" accentColor={accentColor} delay={60} />
              <View style={styles.divider} />
              <Row label="Cost per Litre" value={`R${Number(params.costPerLiter).toFixed(2)}`} icon="tag" accentColor={accentColor} delay={120} />
              <View style={styles.divider} />
              <Row label="Odometer" value={`${Number(params.odometer).toLocaleString()} km`} icon="navigation" accentColor={accentColor} delay={180} />
              <View style={styles.divider} />
              <Row label="Full Tank" value={params.fullTank === "true" ? "Yes" : "No"} icon="battery-charging" accentColor={accentColor} delay={240} />
            </View>
          </View>
        </>
      )}

      {isOdometer && (
        <>
          <View style={styles.section}>
            <LinearGradient
              colors={[`${accentColor}18`, `${accentColor}06`]}
              style={styles.calloutCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.calloutLabel}>Reading</Text>
              <Text style={[styles.calloutValue, { color: accentColor }]}>
                {Number(params.reading).toLocaleString()} km
              </Text>
            </LinearGradient>
          </View>

          {params.note ? (
            <View style={styles.section}>
              <SectionHeading label="Note" />
              <View style={[styles.descriptionCard, { borderColor: `${accentColor}20` }]}>
                <Text style={styles.descriptionText}>{params.note}</Text>
              </View>
            </View>
          ) : null}
        </>
      )}

      <View style={[styles.actionRow, { paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
          <Feather name="edit-2" size={15} color={C.text} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        {params._type !== "odometer" && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Feather name="trash-2" size={15} color={C.danger} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingBottom: 60, gap: 20 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.5,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  datePillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  section: { gap: 10 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.surfaceBorder },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.textSubtle,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  categorizedItemsWrap: { gap: 12 },
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
  catalogItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  catalogItemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: C.surfaceBorder,
  },
  catalogItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  catalogItemLabelCol: { flex: 1, gap: 2 },
  catalogItemName: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
    lineHeight: 20,
  },
  catalogItemHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
  },

  descriptionCard: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
    lineHeight: 22,
  },

  card: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  rowIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textMuted },
  rowValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text, textAlign: "right", flexShrink: 1 },
  divider: { height: 1, backgroundColor: C.separator },

  calloutCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  calloutLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  calloutValue: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },

  typePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typePillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  editBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(231,76,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.25)",
  },
  deleteBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.danger },
});
