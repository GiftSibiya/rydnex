import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LogBookItem from "@/components/items/LogBookItem";
import { useVehicle } from "@/contexts/VehicleContext";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
import {
  buildLogbookItemPageParams,
  logbookItemPagePath,
  type LogBookListItem,
} from "@/utilities/logbookItemNavigation";

type LogItem = LogBookListItem;

type LogSection = { title: string; monthKey: string; data: LogItem[] };

function groupLogsByMonth(items: LogItem[]): LogSection[] {
  const byMonth = new Map<string, LogItem[]>();
  for (const item of items) {
    const d = new Date(item.date);
    if (Number.isNaN(d.getTime())) continue;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
    byMonth.get(monthKey)!.push(item);
  }
  const keys = [...byMonth.keys()].sort((a, b) => b.localeCompare(a));
  return keys.map((monthKey) => {
    const [y, m] = monthKey.split("-").map(Number);
    const title = new Date(y, m - 1, 1).toLocaleString("en-ZA", {
      month: "long",
      year: "numeric",
    });
    const data = [...(byMonth.get(monthKey) ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return { title, monthKey, data };
  });
}

const FILTERS = ["All", "Service", "Fuel", "Odometer"] as const;

/**
 * Full timeline for an organisation (fleet) vehicle — view only.
 * `activeVehicle` must be the fleet vehicle (set before navigating here).
 */
export default function OrganisationVehicleLogbookScreen() {
  const { colors: C } = useAppTheme();
  const { activeVehicle, serviceLogs, fuelLogs, odometerLogs, refreshLogs } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createStyles(C), [C]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLogs();
    setRefreshing(false);
  }, [refreshLogs]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const items: LogItem[] = useMemo(() => {
    if (!activeVehicle) return [];
    const all: LogItem[] = [
      ...serviceLogs
        .filter((s) => s.vehicleId === activeVehicle.id)
        .map((s) => ({ ...s, _type: "service" as const })),
      ...fuelLogs
        .filter((f) => f.vehicleId === activeVehicle.id)
        .map((f) => ({ ...f, _type: "fuel" as const })),
      ...odometerLogs
        .filter((o) => o.vehicleId === activeVehicle.id)
        .map((o) => ({ ...o, _type: "odometer" as const })),
    ];
    const filtered =
      filter === "All"
        ? all
        : filter === "Service"
          ? all.filter((i) => i._type === "service")
          : filter === "Fuel"
            ? all.filter((i) => i._type === "fuel")
            : all.filter((i) => i._type === "odometer");
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeVehicle, serviceLogs, fuelLogs, odometerLogs, filter]);

  const sections = useMemo(() => groupLogsByMonth(items), [items]);

  const navigateToItem = (item: LogItem) => {
    router.push({
      pathname: logbookItemPagePath(),
      params: buildLogbookItemPageParams(item, { readOnly: true }),
    });
  };

  if (!activeVehicle) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <Text style={styles.noVehicle}>No vehicle selected</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={styles.navTitleBlock}>
          <Text style={styles.pageTitle}>Logbook</Text>
          <Text style={styles.pageSub} numberOfLines={1}>
            {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
          </Text>
        </View>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <View style={styles.viewOnlyBanner}>
        <Feather name="eye" size={14} color={C.info} />
        <Text style={styles.viewOnlyText}>
          View only — open any entry for full details. You cannot add or delete logs.
        </Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterActiveText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="book-open" size={36} color={C.textSubtle} />
          <Text style={styles.emptyTitle}>No logs yet</Text>
          <Text style={styles.emptyText}>This vehicle has no fuel, service, or odometer entries in the timeline.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item._type}-${item.id}`}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.monthHeader}>
              <Text style={styles.monthHeaderText}>{title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled
          renderItem={({ item }) => (
            <LogBookItem item={item} onPress={() => navigateToItem(item)} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />
          }
        />
      )}
    </View>
  );
}

const createStyles = (C: AppThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center", gap: 12 },
    noVehicle: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textMuted },
    backLink: { paddingVertical: 8 },
    backLinkText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.tint },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: C.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.surfaceBorder,
    },
    backBtnPlaceholder: { width: 40 },
    navTitleBlock: { flex: 1, alignItems: "center" },
    pageTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
    pageSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
    viewOnlyBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginHorizontal: 20,
      marginBottom: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: "rgba(52,152,219,0.08)",
      borderWidth: 1,
      borderColor: "rgba(52,152,219,0.2)",
    },
    viewOnlyText: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      lineHeight: 17,
    },
    filters: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
    filterBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: C.surfaceElevated,
      borderWidth: 1,
      borderColor: C.surfaceBorder,
    },
    filterActive: {
      backgroundColor: "rgba(46,204,113,0.12)",
      borderColor: C.tint,
    },
    filterText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: C.textMuted,
    },
    filterActiveText: { color: C.tint },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 40,
    },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
    emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
    list: { paddingHorizontal: 20, paddingTop: 8 },
    monthHeader: {
      backgroundColor: C.background,
      paddingTop: 14,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
    },
    monthHeaderText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });
