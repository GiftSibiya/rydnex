import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CheckItem from "@/components/items/CheckItem";
import LuxCard from "@/components/elements/LuxCard";
import MetricCard from "@/components/elements/MetricCard";
import SectionHeader from "@/components/elements/SectionHeader";
import VehicleSelector from "@/components/elements/VehicleSelector";
import Colors from "@/constants/colors";
import { getCarLogo } from "@/constants/carLogos";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

export default function HomeScreen() {
  const {
    activeVehicle,
    lastChecks,
    getEfficiencyMetrics,
    updateLastCheck,
    vehicles,
    serviceLogs,
    fuelLogs,
    partRules,
  } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

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

  if (!activeVehicle) return null;

  const checks = lastChecks.find((c) => c.vehicleId === activeVehicle.id);
  const { avgKmPerL, avgCostPerKm, totalFuelCost } = getEfficiencyMetrics(activeVehicle.id);
  const vServices = serviceLogs.filter((s) => s.vehicleId === activeVehicle.id);
  const lastService = vServices[0];
  const vFuels = fuelLogs.filter((f) => f.vehicleId === activeVehicle.id);
  const lastFuel = vFuels[0];
  const vRules = partRules.filter((r) => r.vehicleId === activeVehicle.id);
  const overdueRules = vRules.filter((r) => {
    const kmSince = activeVehicle.currentOdometer - r.lastReplacedKm;
    const daysSince = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
    return kmSince >= r.intervalKm || daysSince >= r.intervalDays;
  });

  const markCheck = (field: "oil" | "tyrePressure" | "coolant" | "spareWheel" | "lights") => {
    updateLastCheck(activeVehicle.id, field, new Date().toISOString());
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        {getCarLogo(activeVehicle.make) ? (
          <View style={styles.logoWrap}>
            <Image
              source={getCarLogo(activeVehicle.make)}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
          </Text>
        </View>
      </View>
      <VehicleSelector />

      {overdueRules.length > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => router.push("/reminders")}
          activeOpacity={0.8}
        >
          <Feather name="alert-circle" size={16} color={C.danger} />
          <Text style={styles.alertText}>
            {overdueRules.length} part{overdueRules.length > 1 ? "s" : ""} overdue for replacement
          </Text>
          <Feather name="chevron-right" size={14} color={C.danger} />
        </TouchableOpacity>
      )}

      <View style={styles.metricsRow}>
        <MetricCard
          label="Odometer"
          value={activeVehicle.currentOdometer.toLocaleString()}
          unit="km"
          accent
        />
        <MetricCard
          label="Fuel Eff."
          value={avgKmPerL > 0 ? avgKmPerL.toFixed(1) : "—"}
          unit={avgKmPerL > 0 ? "km/L" : ""}
          sub="avg"
        />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard
          label="Cost/km"
          value={avgCostPerKm > 0 ? `R${avgCostPerKm.toFixed(2)}` : "—"}
          sub="fuel only"
        />
        <MetricCard
          label="Fuel Spend"
          value={totalFuelCost > 0 ? `R${totalFuelCost.toLocaleString("en", { maximumFractionDigits: 0 })}` : "—"}
          sub="total"
        />
      </View>

      <View style={styles.quickActions}>
        <SectionHeader title="Quick Log" />
        <View style={styles.actionGrid}>
          {[
            { icon: "droplet", label: "Fuel", route: "/log/fuel" },
            { icon: "tool", label: "Service", route: "/log/service" },
            { icon: "activity", label: "Odometer", route: "/log/odometer" },
            { icon: "book-open", label: "Logbook", route: "/logbook" },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.actionCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={styles.actionIcon}>
                <Feather name={item.icon as any} size={20} color={C.tint} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <LuxCard style={styles.section}>
        <SectionHeader
          title="Last Checks"
          action={{ label: "All", onPress: () => router.push("/checks") }}
        />
        {(["oil", "tyrePressure", "coolant", "spareWheel", "lights"] as const).slice(0, 3).map((field) => {
          const labels: Record<string, string> = {
            oil: "Engine Oil",
            tyrePressure: "Tyre Pressure",
            coolant: "Coolant",
          };
          return (
            <CheckItem
              key={field}
              label={labels[field]}
              lastDate={checks?.[field] ?? null}
              onMark={() => markCheck(field)}
            />
          );
        })}
      </LuxCard>

      {(lastService || lastFuel) && (
        <LuxCard style={styles.section}>
          <SectionHeader
            title="Recent Activity"
            action={{ label: "View All", onPress: () => router.push("/logbook") }}
          />
          {lastService && (
            <View style={styles.recentItem}>
              <View style={styles.recentIcon}>
                <Feather name="tool" size={14} color={C.tint} />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentTitle}>{lastService.description}</Text>
                <Text style={styles.recentSub}>
                  {new Date(lastService.date).toLocaleDateString("en-ZA")}
                </Text>
              </View>
              <Text style={styles.recentCost}>R{lastService.cost.toLocaleString()}</Text>
            </View>
          )}
          {lastFuel && (
            <View style={[styles.recentItem, { borderBottomWidth: 0 }]}>
              <View style={[styles.recentIcon, { backgroundColor: "rgba(52,152,219,0.12)" }]}>
                <Feather name="droplet" size={14} color={C.info} />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentTitle}>
                  Fuel — {lastFuel.liters}L @ R{lastFuel.costPerLiter.toFixed(2)}/L
                </Text>
                <Text style={styles.recentSub}>
                  {new Date(lastFuel.date).toLocaleDateString("en-ZA")}
                </Text>
              </View>
              <Text style={styles.recentCost}>R{lastFuel.totalCost.toFixed(0)}</Text>
            </View>
          )}
        </LuxCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 16 },
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
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
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
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#0A0A0B",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  logo: {
    width: 32,
    height: 32,
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  vehicleName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(231,76,60,0.12)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.25)",
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.danger,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  section: {},
  quickActions: {},
  actionGrid: {
    flexDirection: "row",
    gap: 10,
  },
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
  actionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  recentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: { flex: 1 },
  recentTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  recentSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },
  recentCost: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
});

