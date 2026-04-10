import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewabilityConfig,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VehicleSummaryItem, { getDiskDaysLeft } from "@/components/items/VehicleSummaryItem";
import { Vehicle, useVehicle } from "@/contexts/VehicleContext";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 48;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_W + CARD_GAP;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function index() {
  const { colors: C } = useAppTheme();
  const {
    activeVehicle,
    vehicles,
    lastChecks,
    partRules,
    licenseDisk,
    setActiveVehicle,
    refreshLogs,
  } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const styles = React.useMemo(() => createStyles(C), [C]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 55,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        const v = viewableItems[0].item as Vehicle;
        const idx = viewableItems[0].index ?? 0;
        setActiveIndex(idx);
        setActiveVehicle(v);
      }
    }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLogs();
    } finally {
      setRefreshing(false);
    }
  }, [refreshLogs]);

  const renderVehicle = useCallback(
    ({ item, index }: ListRenderItemInfo<Vehicle>) => {
      const disk = licenseDisk(item.id);
      const rules = partRules.filter((r) => r.vehicleId === item.id);
      const checks = lastChecks.find((c) => c.vehicleId === item.id);
      const isActive = activeVehicle?.id === item.id;
      return (
        <View style={{ width: CARD_W, marginRight: CARD_GAP }}>
          <VehicleSummaryItem
            vehicle={item}
            isActive={isActive}
            disk={disk}
            rules={rules}
            checks={checks}
            onPress={() => {
              setActiveVehicle(item);
              router.push("/garage/vehicle-details-page");
            }}
          />
        </View>
      );
    },
    [activeVehicle, licenseDisk, partRules, lastChecks]
  );

  // ── Active vehicle alerts ──────────────────────────────────────────────────
  const av = activeVehicle ?? vehicles[0];
  const avDisk = av ? licenseDisk(av.id) : undefined;
  const avDiskDays = getDiskDaysLeft(avDisk);
  const avRules = av ? partRules.filter((r) => r.vehicleId === av.id) : [];
  const avOverdue = avRules.filter((r) => {
    const km = av.currentOdometer - r.lastReplacedKm;
    const d = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
    return km >= r.intervalKm || d >= r.intervalDays;
  });

  const diskExpired = avDiskDays !== null && avDiskDays < 0;
  const diskSoon = avDiskDays !== null && avDiskDays >= 0 && avDiskDays <= 30;

  // ── Shared fixed header ────────────────────────────────────────────────────
  const fixedHeader = (
    <View style={[styles.fixedHeader, { paddingTop: topPad + 12 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.headerTitle}>
            {vehicles.length === 0
              ? "My Garage"
              : vehicles.length === 1
              ? "Your Vehicle"
              : `Your ${vehicles.length} Vehicles`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.garageBtn}
          onPress={() => router.push("/garage-tab")}
          activeOpacity={0.75}
        >
          <Feather name="plus" size={16} color={C.tint} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  if (vehicles.length === 0) {
    return (
      <View style={styles.screen}>
        {fixedHeader}
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.tint}
              colors={[C.tint]}
            />
          }
        >
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="truck" size={40} color={C.tint} />
            </View>
            <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
            <Text style={styles.emptyText}>
              Add your first vehicle to start tracking your car's history and health.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/garage-tab")}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#0A0A0B" />
              <Text style={styles.emptyBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {fixedHeader}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.tint}
            colors={[C.tint]}
          />
        }
      >

      {/* Alerts for active vehicle */}
      {(diskExpired || diskSoon || avOverdue.length > 0) && (
        <View style={styles.alerts}>
          {diskExpired && (
            <TouchableOpacity
              style={[styles.alert, styles.alertDanger]}
              onPress={() => router.push("/log/license-disk")}
              activeOpacity={0.8}
            >
              <Feather name="alert-octagon" size={14} color={C.danger} />
              <Text style={[styles.alertText, { color: C.danger }]}>
                {av.make} license disk has expired
              </Text>
              <Feather name="chevron-right" size={12} color={C.danger} />
            </TouchableOpacity>
          )}
          {diskSoon && !diskExpired && (
            <TouchableOpacity
              style={[styles.alert, styles.alertWarn]}
              onPress={() => router.push("/log/license-disk")}
              activeOpacity={0.8}
            >
              <Feather name="alert-triangle" size={14} color={C.warning} />
              <Text style={[styles.alertText, { color: C.warning }]}>
                License disk expires in {avDiskDays} day{avDiskDays !== 1 ? "s" : ""}
              </Text>
              <Feather name="chevron-right" size={12} color={C.warning} />
            </TouchableOpacity>
          )}
          {avOverdue.length > 0 && (
            <TouchableOpacity
              style={[styles.alert, styles.alertDanger]}
              onPress={() => router.push("/reminders")}
              activeOpacity={0.8}
            >
              <Feather name="alert-circle" size={14} color={C.danger} />
              <Text style={[styles.alertText, { color: C.danger }]}>
                {avOverdue.length} part{avOverdue.length > 1 ? "s" : ""} overdue for replacement
              </Text>
              <Feather name="chevron-right" size={12} color={C.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Vehicle carousel */}
      <View>
        <FlatList
          ref={flatRef}
          data={vehicles}
          keyExtractor={(v) => v.id}
          renderItem={renderVehicle}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          contentContainerStyle={styles.carousel}
          viewabilityConfig={viewabilityConfig.current}
          onViewableItemsChanged={onViewableItemsChanged.current}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({
            length: SNAP_INTERVAL,
            offset: SNAP_INTERVAL * index,
            index,
          })}
        />

        {/* Pagination dots */}
        {vehicles.length > 1 && (
          <View style={styles.dots}>
            {vehicles.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  flatRef.current?.scrollToIndex({ index: i, animated: true });
                }}
                hitSlop={6}
              >
                <View
                  style={[
                    styles.dot,
                    i === activeIndex && styles.dotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.actionsBlock}>
        <Text style={styles.sectionLabel}>Quick Log</Text>
        <View style={styles.actionGrid}>
          {([
            { icon: "droplet", label: "Fuel", route: "/log/fuel" },
            { icon: "tool", label: "Service", route: "/log/service" },
            { icon: "activity", label: "Odometer", route: "/log/odometer" },
            { icon: "file-text", label: "License Disk", route: "/log/license-disk" },
          ] as const).map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.actionCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={styles.actionIcon}>
                <Feather name={item.icon} size={20} color={C.tint} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  fixedHeader: {
    backgroundColor: C.background,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  content: { gap: 20, paddingTop: 16 },

  // Empty
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, textAlign: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.tint,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#0A0A0B" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginTop: 2 },
  garageBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },

  // Alerts
  alerts: { gap: 8, paddingHorizontal: 20 },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
  },
  alertDanger: { backgroundColor: "rgba(231,76,60,0.08)", borderColor: "rgba(231,76,60,0.25)" },
  alertWarn: { backgroundColor: "rgba(243,156,18,0.08)", borderColor: "rgba(243,156,18,0.25)" },
  alertText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },

  // Carousel
  carousel: { paddingLeft: 20, paddingRight: 8 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.surfaceBorder,
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: C.tint,
  },

  // Quick actions
  actionsBlock: { gap: 12, paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  actionGrid: { flexDirection: "row", gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: C.textMuted, textAlign: "center" },
});
