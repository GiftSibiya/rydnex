import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FuelLog, OdometerLog, ServiceLog, useVehicle } from "@/contexts/VehicleContext";
import LogBookItem from "@/components/items/LogBookItem";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type LogItem =
  | (ServiceLog & { _type: "service" })
  | (FuelLog & { _type: "fuel" })
  | (OdometerLog & { _type: "odometer" });

const FILTERS = ["All", "Service", "Fuel", "Odometer"] as const;

export default function LogbookScreen() {
  const { colors: C } = useAppTheme();
  const { activeVehicle, serviceLogs, fuelLogs, odometerLogs, deleteServiceLog, deleteFuelLog, refreshLogs } = useVehicle();
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
    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [activeVehicle, serviceLogs, fuelLogs, odometerLogs, filter]);

  const navigateToItem = (item: LogItem) => {
    if (item._type === "service") {
      router.push({
        pathname: "/log/subpages/logbook-item-page",
        params: {
          _type: "service",
          id: item.id,
          date: item.date,
          type: item.type,
          description: item.description,
          cost: String(item.cost),
          odometer: String(item.odometer),
          ...(item.workshop ? { workshop: item.workshop } : {}),
          ...(item.notes ? { notes: item.notes } : {}),
        },
      });
    } else if (item._type === "fuel") {
      router.push({
        pathname: "/log/subpages/logbook-item-page",
        params: {
          _type: "fuel",
          id: item.id,
          date: item.date,
          liters: String(item.liters),
          costPerLiter: String(item.costPerLiter),
          totalCost: String(item.totalCost),
          odometer: String(item.odometer),
          fullTank: String(item.fullTank),
        },
      });
    } else {
      router.push({
        pathname: "/log/subpages/logbook-item-page",
        params: {
          _type: "odometer",
          id: item.id,
          date: item.date,
          reading: String(item.reading),
          ...(item.note ? { note: item.note } : {}),
        },
      });
    }
  };

  const getDeleteHandler = (item: LogItem) => {
    if (item._type === "service") return () => deleteServiceLog(item.id);
    if (item._type === "fuel") return () => deleteFuelLog(item.id);
    return undefined;
  };

  if (!activeVehicle) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <Text style={styles.noVehicle}>No vehicle selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>Logbook</Text>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterActiveText,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.addButtons}>
        <TouchableOpacity
          style={styles.addQuick}
          onPress={() => router.push("/log/fuel")}
          activeOpacity={0.8}
        >
          <Feather name="droplet" size={14} color={C.info} />
          <Text style={[styles.addQuickText, { color: C.info }]}>Fuel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addQuick}
          onPress={() => router.push("/log/service")}
          activeOpacity={0.8}
        >
          <Feather name="tool" size={14} color={C.tint} />
          <Text style={[styles.addQuickText, { color: C.tint }]}>Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addQuick}
          onPress={() => router.push("/log/odometer")}
          activeOpacity={0.8}
        >
          <Feather name="activity" size={14} color={C.success} />
          <Text style={[styles.addQuickText, { color: C.success }]}>Odometer</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="book-open" size={36} color={C.textSubtle} />
          <Text style={styles.emptyTitle}>No logs yet</Text>
          <Text style={styles.emptyText}>
            Start logging fuel, services, or odometer readings
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item._type}-${item.id}`}
          renderItem={({ item }) => (
            <LogBookItem
              item={item}
              onPress={() => navigateToItem(item)}
              onDelete={getDeleteHandler(item)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />
          }
        />
      )}
    </View>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center" },
  noVehicle: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textMuted },
  topSection: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  filters: { flexDirection: "row", gap: 8 },
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
  addButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
    marginTop: 8,
  },
  addQuick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  addQuickText: { fontSize: 12, fontFamily: "Inter_500Medium" },
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
});

