import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchRepairCatalogRows } from "@/backend/maintenance/logCatalogLinks";
import LuxCard from "@/components/elements/LuxCard";
import { useVehicle } from "@/contexts/VehicleContext";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type Filter = "all" | "open" | "resolved";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

export default function VehicleIssuesScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const { activeVehicle, vehicleIssues, refreshLogs } = useVehicle();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [filter, setFilter] = useState<Filter>("open");
  const [refreshing, setRefreshing] = useState(false);
  const [repairItemNames, setRepairItemNames] = useState<Map<number, string>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchRepairCatalogRows();
        if (cancelled) return;
        const m = new Map<number, string>();
        for (const r of rows) {
          m.set(r.id, r.name);
        }
        setRepairItemNames(m);
      } catch {
        /* list still works without labels */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLogs();
      try {
        const rows = await fetchRepairCatalogRows(true);
        const m = new Map<number, string>();
        for (const r of rows) {
          m.set(r.id, r.name);
        }
        setRepairItemNames(m);
      } catch {
        /* keep previous repair labels */
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshLogs]);

  const list = useMemo(() => {
    if (!activeVehicle) return [];
    const v = vehicleIssues.filter((i) => i.vehicleId === activeVehicle.id);
    const filtered =
      filter === "all"
        ? v
        : filter === "open"
          ? v.filter((i) => i.status === "open")
          : v.filter((i) => i.status === "resolved");
    return [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [activeVehicle, vehicleIssues, filter]);

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

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Issues</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/garage/vehicle-issue-edit")}
          style={styles.addBtn}
          activeOpacity={0.75}
        >
          <Feather name="plus" size={20} color={C.tint} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} colors={[C.tint]} />
        }
      >
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={C.textSubtle} />
            <Text style={styles.emptyTitle}>No issues</Text>
            <Text style={styles.emptySub}>
              {filter === "open"
                ? "Nothing to follow up right now."
                : filter === "resolved"
                  ? "Resolved issues will show here."
                  : "Add an issue to revisit later."}
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push("/garage/vehicle-issue-edit")}
              activeOpacity={0.75}
            >
              <Text style={styles.emptyCtaText}>Add issue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          list.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: "/garage/vehicle-issue-edit", params: { id: item.id } })
              }
            >
              <LuxCard style={styles.card}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.statusDot,
                      item.status === "open" ? styles.statusOpen : styles.statusResolved,
                    ]}
                  />
                  <View style={styles.cardTitleBlock}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.repairItemId ? (
                      <Text style={styles.cardRepair} numberOfLines={1}>
                        {repairItemNames.get(Number(item.repairItemId)) ?? "Repair item"}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>
                    Updated {new Date(item.updatedAt).toLocaleDateString("en-ZA")}
                  </Text>
                  {item.notedOdometerKm != null ? (
                    <Text style={styles.cardMetaText}>{item.notedOdometerKm.toLocaleString()} km</Text>
                  ) : null}
                </View>
              </LuxCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (C: AppThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
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
    headerTitleWrap: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
    headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
    headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
    addBtn: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: "rgba(46,204,113,0.1)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.22)",
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: C.surfaceElevated,
      borderWidth: 1,
      borderColor: C.surfaceBorder,
    },
    filterChipActive: {
      backgroundColor: "rgba(46,204,113,0.12)",
      borderColor: "rgba(46,204,113,0.35)",
    },
    filterChipText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: C.textMuted,
    },
    filterChipTextActive: { color: C.tint },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, gap: 10, paddingTop: 4 },
    card: { gap: 8 },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    statusOpen: { backgroundColor: C.warning },
    statusResolved: { backgroundColor: C.tint },
    cardTitleBlock: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
    cardRepair: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: C.danger,
    },
    cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, marginLeft: 18 },
    cardMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginLeft: 18,
      marginTop: 2,
    },
    cardMetaText: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSubtle },
    empty: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 10,
    },
    emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
    emptySub: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: C.textMuted,
      textAlign: "center",
    },
    emptyCta: {
      marginTop: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: "rgba(46,204,113,0.12)",
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.28)",
    },
    emptyCtaText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.tint },
    fallback: { flex: 1, backgroundColor: C.background, paddingHorizontal: 24, gap: 12 },
    fallbackText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textMuted },
    fallbackLink: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.tint },
  });
