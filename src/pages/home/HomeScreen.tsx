import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ListRenderItemInfo,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewabilityConfig,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { getCarLogo } from "@/constants/carLogos";
import { LastCheck, LicenseDisk, PartRule, Vehicle, useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 48;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_W + CARD_GAP;

const CHECK_FIELDS = ["oil", "tyrePressure", "coolant", "spareWheel", "lights"] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDiskDaysLeft(disk: LicenseDisk | undefined): number | null {
  if (!disk?.expiryDate) return null;
  return Math.ceil((new Date(disk.expiryDate).getTime() - Date.now()) / 86400000);
}

function getNextService(rules: PartRule[], odo: number) {
  if (!rules.length) return null;
  return rules
    .map((r) => ({ name: r.partName, kmLeft: r.lastReplacedKm + r.intervalKm - odo }))
    .sort((a, b) => a.kmLeft - b.kmLeft)[0];
}

type StatusLevel = "good" | "warn" | "danger" | "unknown";

function getStatusLevel(
  v: Vehicle,
  disk: LicenseDisk | undefined,
  rules: PartRule[],
  checks: LastCheck | undefined
): StatusLevel {
  const days = getDiskDaysLeft(disk);
  if (days !== null && days < 0) return "danger";
  const overdueRules = rules.filter((r) => {
    const km = v.currentOdometer - r.lastReplacedKm;
    const d = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
    return km >= r.intervalKm || d >= r.intervalDays;
  });
  if (overdueRules.length > 0) return "danger";
  if (days !== null && days <= 30) return "warn";
  const overdueChecks = CHECK_FIELDS.filter((f) => {
    const d = checks?.[f];
    if (!d) return false;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000) > 14;
  });
  if (overdueChecks.length > 0) return "warn";
  if (!disk && !rules.length) return "unknown";
  return "good";
}

const STATUS_COLOR: Record<StatusLevel, string> = {
  good: C.tint,
  warn: C.warning,
  danger: C.danger,
  unknown: C.textSubtle,
};

const STATUS_BG: Record<StatusLevel, string> = {
  good: "rgba(46,204,113,0.12)",
  warn: "rgba(243,156,18,0.12)",
  danger: "rgba(231,76,60,0.12)",
  unknown: "rgba(92,114,101,0.12)",
};

const STATUS_LABEL: Record<StatusLevel, string> = {
  good: "All Good",
  warn: "Attention",
  danger: "Action Required",
  unknown: "No Data",
};

// ─── Vehicle Card ────────────────────────────────────────────────────────────

type CardProps = {
  vehicle: Vehicle;
  isActive: boolean;
  disk: LicenseDisk | undefined;
  rules: PartRule[];
  checks: LastCheck | undefined;
  onPress: () => void;
};

function VehicleCard({ vehicle: v, isActive, disk, rules, checks, onPress }: CardProps) {
  const router = useRouter();
  const status = getStatusLevel(v, disk, rules, checks);
  const statusColor = STATUS_COLOR[status];
  const statusBg = STATUS_BG[status];
  const diskDays = getDiskDaysLeft(disk);
  const diskExpired = diskDays !== null && diskDays < 0;
  const diskSoon = diskDays !== null && diskDays >= 0 && diskDays <= 30;
  const nextSvc = getNextService(rules, v.currentOdometer);
  const overdueChecks = CHECK_FIELDS.filter((f) => {
    const d = checks?.[f];
    if (!d) return false;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000) > 14;
  });

  const logo = getCarLogo(v.make);

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* Active indicator bar */}
      {isActive && <View style={styles.cardActiveLine} />}

      {/* Card header */}
      <View style={styles.cardHeader}>
        {/* Logo + status ring */}
        <View style={[styles.logoRing, { borderColor: statusColor, shadowColor: statusColor }]}>
          <View style={[styles.logoBg, { backgroundColor: statusBg }]}>
            {logo ? (
              <Image source={logo} style={styles.logoImg} resizeMode="contain" />
            ) : (
              <Feather name="truck" size={22} color={statusColor} />
            )}
          </View>
        </View>

        {/* Make / model info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardMake} numberOfLines={1}>
            {v.year} {v.make}
          </Text>
          <Text style={styles.cardModel} numberOfLines={1}>{v.model}</Text>
          {v.color ? <Text style={styles.cardColor}>{v.color}</Text> : null}
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusColor}40` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.sep} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Odometer</Text>
          <Text style={styles.statValue}>{v.currentOdometer.toLocaleString()}</Text>
          <Text style={styles.statUnit}>km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Registration</Text>
          <Text style={styles.statValue} numberOfLines={1}>{v.registration || "—"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Year</Text>
          <Text style={styles.statValue}>{v.year}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.sep} />

      {/* Status items */}
      <View style={styles.statusItems}>
        {/* Service */}
        <View style={styles.statusItem}>
          <View style={[
            styles.statusItemIcon,
            nextSvc && nextSvc.kmLeft <= 0 && { backgroundColor: "rgba(231,76,60,0.1)" },
          ]}>
            <Feather
              name="tool"
              size={12}
              color={nextSvc && nextSvc.kmLeft <= 0 ? C.danger : C.tint}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusItemLabel}>Next Service</Text>
            <Text style={[
              styles.statusItemValue,
              nextSvc && nextSvc.kmLeft <= 0 && { color: C.danger },
            ]}>
              {nextSvc
                ? nextSvc.kmLeft <= 0
                  ? `${nextSvc.name} — Overdue`
                  : `${nextSvc.kmLeft.toLocaleString()} km · ${nextSvc.name}`
                : "No rules set"}
            </Text>
          </View>
        </View>

        {/* License disk */}
        <View style={styles.statusItem}>
          <View style={[
            styles.statusItemIcon,
            diskExpired && { backgroundColor: "rgba(231,76,60,0.1)" },
            diskSoon && !diskExpired && { backgroundColor: "rgba(243,156,18,0.1)" },
          ]}>
            <Feather
              name="file-text"
              size={12}
              color={diskExpired ? C.danger : diskSoon ? C.warning : C.tint}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusItemLabel}>License Disk</Text>
            <Text style={[
              styles.statusItemValue,
              diskExpired && { color: C.danger },
              diskSoon && !diskExpired && { color: C.warning },
            ]}>
              {disk
                ? diskExpired
                  ? "Expired"
                  : diskSoon
                  ? `Expires in ${diskDays} day${diskDays !== 1 ? "s" : ""}`
                  : `Valid · expires ${disk.expiryDate}`
                : "Not captured"}
            </Text>
          </View>
        </View>

        {/* Health checks */}
        <View style={styles.statusItem}>
          <View style={[
            styles.statusItemIcon,
            overdueChecks.length > 0 && { backgroundColor: "rgba(243,156,18,0.1)" },
          ]}>
            <Feather
              name="shield"
              size={12}
              color={overdueChecks.length > 0 ? C.warning : C.tint}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusItemLabel}>Health Checks</Text>
            <Text style={[
              styles.statusItemValue,
              overdueChecks.length > 0 && { color: C.warning },
            ]}>
              {overdueChecks.length === 0
                ? "All checks up to date"
                : `${overdueChecks.length} check${overdueChecks.length > 1 ? "s" : ""} overdue`}
            </Text>
          </View>
        </View>
      </View>

      {/* Card footer */}
      <TouchableOpacity
        style={styles.cardFooter}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.cardFooterText}>View Full Details</Text>
        <Feather name="chevron-right" size={13} color={C.tint} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const {
    activeVehicle,
    vehicles,
    lastChecks,
    partRules,
    licenseDisk,
    setActiveVehicle,
  } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const renderVehicle = useCallback(
    ({ item, index }: ListRenderItemInfo<Vehicle>) => {
      const disk = licenseDisk(item.id);
      const rules = partRules.filter((r) => r.vehicleId === item.id);
      const checks = lastChecks.find((c) => c.vehicleId === item.id);
      const isActive = activeVehicle?.id === item.id;
      return (
        <View style={{ width: CARD_W, marginRight: CARD_GAP }}>
          <VehicleCard
            vehicle={item}
            isActive={isActive}
            disk={disk}
            rules={rules}
            checks={checks}
            onPress={() => {
              setActiveVehicle(item);
              router.push("/vehicle-details");
            }}
          />
        </View>
      );
    },
    [activeVehicle, licenseDisk, partRules, lastChecks]
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  if (vehicles.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: topPad + 20 }]}>
        <View style={styles.emptyIcon}>
          <Feather name="truck" size={40} color={C.tint} />
        </View>
        <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
        <Text style={styles.emptyText}>
          Add your first vehicle to start tracking your car's history and health.
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push("/garage")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color="#0A0A0B" />
          <Text style={styles.emptyBtnText}>Add Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Active vehicle alerts ──────────────────────────────────────────────────
  const av = activeVehicle ?? vehicles[0];
  const avDisk = licenseDisk(av.id);
  const avDiskDays = getDiskDaysLeft(avDisk);
  const avRules = partRules.filter((r) => r.vehicleId === av.id);
  const avOverdue = avRules.filter((r) => {
    const km = av.currentOdometer - r.lastReplacedKm;
    const d = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
    return km >= r.intervalKm || d >= r.intervalDays;
  });

  const diskExpired = avDiskDays !== null && avDiskDays < 0;
  const diskSoon = avDiskDays !== null && avDiskDays >= 0 && avDiskDays <= 30;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.headerTitle}>
            {vehicles.length === 1 ? "Your Vehicle" : `Your ${vehicles.length} Vehicles`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.garageBtn}
          onPress={() => router.push("/garage")}
          activeOpacity={0.75}
        >
          <Feather name="plus" size={16} color={C.tint} />
        </TouchableOpacity>
      </View>

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
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { gap: 20 },

  // Empty
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

  // Vehicle card
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  cardActive: {
    borderColor: "rgba(46,204,113,0.35)",
    backgroundColor: "#0E1610",
  },
  cardActiveLine: {
    height: 3,
    backgroundColor: C.tint,
    borderRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  logoRing: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  logoBg: {
    width: 50,
    height: 50,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: 34, height: 34 },
  cardInfo: { flex: 1, paddingTop: 2 },
  cardMake: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  cardModel: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  cardColor: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSubtle, marginTop: 3 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  sep: { height: 1, backgroundColor: C.separator, marginHorizontal: 16 },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 32, backgroundColor: C.separator },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text, textAlign: "center" },
  statUnit: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 },

  // Status items
  statusItems: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
  statusItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(46,204,113,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusItemLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusItemValue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.text,
    marginTop: 1,
  },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 10,
  },
  cardFooterText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.tint },

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
