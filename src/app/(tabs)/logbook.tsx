import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FuelLog, OdometerLog, ServiceLog, useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

type LogItem =
  | (ServiceLog & { _type: "service" })
  | (FuelLog & { _type: "fuel" })
  | (OdometerLog & { _type: "odometer" });

const FILTERS = ["All", "Service", "Fuel", "Odometer"] as const;

export default function LogbookScreen() {
  const { activeVehicle, serviceLogs, fuelLogs, odometerLogs, deleteServiceLog, deleteFuelLog } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

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

  const renderItem = ({ item }: { item: LogItem }) => {
    if (item._type === "service") {
      return (
        <View style={styles.entry}>
          <View
            style={[
              styles.entryLine,
              { backgroundColor: item.type === "repair" ? C.danger : C.tint },
            ]}
          />
          <View
            style={[
              styles.entryIcon,
              { backgroundColor: item.type === "repair" ? "rgba(231,76,60,0.12)" : "rgba(46,204,113,0.1)" },
            ]}
          >
            <Feather
              name="tool"
              size={14}
              color={item.type === "repair" ? C.danger : C.tint}
            />
          </View>
          <View style={styles.entryContent}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>{item.description}</Text>
              <Text style={styles.entryAmount}>R{item.cost.toLocaleString()}</Text>
            </View>
            <Text style={styles.entryMeta}>
              {new Date(item.date).toLocaleDateString("en-ZA")} •{" "}
              {item.odometer.toLocaleString()} km{item.workshop ? ` • ${item.workshop}` : ""}
            </Text>
            {item.notes ? <Text style={styles.entryNote}>{item.notes}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => deleteServiceLog(item.id)} style={styles.delBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color={C.textSubtle} />
          </TouchableOpacity>
        </View>
      );
    }

    if (item._type === "fuel") {
      return (
        <View style={styles.entry}>
          <View style={[styles.entryLine, { backgroundColor: C.info }]} />
          <View style={[styles.entryIcon, { backgroundColor: "rgba(52,152,219,0.12)" }]}>
            <Feather name="droplet" size={14} color={C.info} />
          </View>
          <View style={styles.entryContent}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>
                {item.liters}L @ R{item.costPerLiter.toFixed(2)}/L{item.fullTank ? " ✓" : ""}
              </Text>
              <Text style={styles.entryAmount}>R{item.totalCost.toFixed(0)}</Text>
            </View>
            <Text style={styles.entryMeta}>
              {new Date(item.date).toLocaleDateString("en-ZA")} •{" "}
              {item.odometer.toLocaleString()} km
            </Text>
          </View>
          <TouchableOpacity onPress={() => deleteFuelLog(item.id)} style={styles.delBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color={C.textSubtle} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.entry}>
        <View style={[styles.entryLine, { backgroundColor: C.success }]} />
        <View style={[styles.entryIcon, { backgroundColor: "rgba(46,204,113,0.1)" }]}>
          <Feather name="activity" size={14} color={C.success} />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>
              Odometer: {item.reading.toLocaleString()} km
            </Text>
          </View>
          <Text style={styles.entryMeta}>
            {new Date(item.date).toLocaleDateString("en-ZA")}
            {item.note ? ` • ${item.note}` : ""}
          </Text>
        </View>
      </View>
    );
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
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  entry: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  entryLine: {
    width: 2,
    alignSelf: "stretch",
    borderRadius: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  entryContent: { flex: 1 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  entryTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  entryAmount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  entryMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 3,
  },
  entryNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    marginTop: 3,
    fontStyle: "italic",
  },
  delBtn: { padding: 6, marginTop: 4 },
});

