import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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
import LuxCard from "@/components/elements/LuxCard";
import MetricCard from "@/components/elements/MetricCard";
import SectionHeader from "@/components/layouts/SectionHeader";
import CheckItem from "@/components/items/CheckItem";
import { getCarLogo } from "@/constants/carLogos";
import { useVehicle } from "@/contexts/VehicleContext";
import { useAppTheme } from "@/themes/AppTheme";
import { formatDecimal } from "@/utilities/formatDecimal";
import {
  buildLogbookItemPageParams,
  logbookItemPagePath,
  type LogBookListItem,
} from "@/utilities/logbookItemNavigation";
import { formatExpiryDisplay } from "@/utilities/licenseDiskDate";

/**
 * Read-only vehicle details for organisation / fleet vehicles (driver-owned).
 * Admins can inspect metrics and history but cannot edit or log on behalf of the driver.
 */
export default function OrganisationVehicleDetailsPage() {
  const { colors: C } = useAppTheme();
  const {
    activeVehicle,
    lastChecks,
    getEfficiencyMetrics,
    serviceLogs,
    fuelLogs,
    odometerLogs,
    partRules,
    licenseDisk,
    vehicleIssues,
  } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const recentActivityItems = useMemo((): LogBookListItem[] => {
    if (!activeVehicle) return [];
    const vid = activeVehicle.id;
    const all: LogBookListItem[] = [
      ...serviceLogs
        .filter((s) => s.vehicleId === vid)
        .map((s) => ({ ...s, _type: "service" as const })),
      ...fuelLogs.filter((f) => f.vehicleId === vid).map((f) => ({ ...f, _type: "fuel" as const })),
      ...odometerLogs
        .filter((o) => o.vehicleId === vid)
        .map((o) => ({ ...o, _type: "odometer" as const })),
    ];
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [activeVehicle, serviceLogs, fuelLogs, odometerLogs]);

  const vehicleIssuesForCar = useMemo(() => {
    if (!activeVehicle) return [];
    return vehicleIssues
      .filter((i) => i.vehicleId === activeVehicle.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [activeVehicle, vehicleIssues]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (!activeVehicle) return null;

  const checks = lastChecks.find((c) => c.vehicleId === activeVehicle.id);
  const { avgKmPerL, avgCostPerKm, totalFuelCost } = getEfficiencyMetrics(activeVehicle.id);
  const vServices = serviceLogs.filter((s) => s.vehicleId === activeVehicle.id);
  const lastServiceOnly = vServices.find((s) => s.type === "service");
  const vRules = partRules.filter((r) => r.vehicleId === activeVehicle.id);
  const disk = licenseDisk(activeVehicle.id);
  const openIssuesCount = vehicleIssuesForCar.filter((i) => i.status === "open").length;

  const overdueRules = vRules.filter((r) => {
    const kmSince = activeVehicle.currentOdometer - r.lastReplacedKm;
    const daysSince = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
    return kmSince >= r.intervalKm || daysSince >= r.intervalDays;
  });
  const serviceIntervalKm = 10000;
  const nextServiceKm = lastServiceOnly
    ? lastServiceOnly.odometer + serviceIntervalKm
    : activeVehicle.currentOdometer + serviceIntervalKm;
  const serviceKmLeft = nextServiceKm - activeVehicle.currentOdometer;

  const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.background },
    content: { paddingHorizontal: 20, gap: 16 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    headerTitleWrap: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 10,
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
    headerTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    headerSub: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: C.textMuted,
      marginTop: 1,
    },
    logoWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      padding: 5,
    },
    logo: { width: 30, height: 30 },
    viewOnlyBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "rgba(52,152,219,0.1)",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: "rgba(52,152,219,0.22)",
    },
    viewOnlyText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: C.info,
    },
    logbookCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.surfaceElevated,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.22)",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    logbookCtaIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: "rgba(46,204,113,0.1)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.18)",
    },
    logbookCtaTextCol: { flex: 1, gap: 2 },
    logbookCtaTitle: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: C.text,
    },
    logbookCtaSub: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      lineHeight: 16,
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
    metricsRow: { flexDirection: "row", gap: 10 },
    section: {},
    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2,
    },
    serviceChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(46,204,113,0.1)",
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.2)",
    },
    serviceChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.tint },
    serviceValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
    diskRow: { flexDirection: "row", marginTop: 4 },
    diskItem: { flex: 1 },
    diskLabel: {
      fontSize: 10,
      fontFamily: "Inter_500Medium",
      color: C.textSubtle,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    diskValue: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: C.text,
      textTransform: "uppercase",
    },
    recentItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
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
    recentTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
    recentSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
    recentCost: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
    issuesSummary: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: C.text,
      paddingVertical: 4,
    },
    issuesSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 4 },
    issueRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
    },
    issueIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: "rgba(231,76,60,0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    issueIconResolved: { backgroundColor: "rgba(149,165,166,0.15)" },
    issueTextCol: { flex: 1, minWidth: 0 },
    issueTitleLine: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
    issueTitleResolved: { color: C.textMuted },
    issueMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
    issueStatusPill: {
      alignSelf: "flex-start",
      marginTop: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: "rgba(231,76,60,0.12)",
      borderWidth: 1,
      borderColor: "rgba(231,76,60,0.22)",
    },
    issueStatusPillResolved: {
      backgroundColor: C.surfaceElevated,
      borderColor: C.surfaceBorder,
    },
    issueStatusText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: C.danger },
    issueStatusTextResolved: { color: C.textMuted },
    emptyDisk: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: C.textMuted,
      paddingVertical: 8,
    },
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Organisation vehicle</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
          </Text>
        </View>
        {getCarLogo(activeVehicle.make) ? (
          <View style={styles.logoWrap}>
            <Image source={getCarLogo(activeVehicle.make)} style={styles.logo} resizeMode="contain" />
          </View>
        ) : null}
      </View>

      <View style={styles.viewOnlyBanner}>
        <Feather name="eye" size={16} color={C.info} />
        <Text style={styles.viewOnlyText}>
          View only. This vehicle belongs to a team member — you cannot edit details or add logs here.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logbookCta}
        onPress={() => router.push("/garage/organisation-vehicle-logbook")}
        activeOpacity={0.8}
      >
        <View style={styles.logbookCtaIcon}>
          <Feather name="book-open" size={20} color={C.tint} />
        </View>
        <View style={styles.logbookCtaTextCol}>
          <Text style={styles.logbookCtaTitle}>View full logbook</Text>
          <Text style={styles.logbookCtaSub}>Fuel, service & odometer — tap an entry for details</Text>
        </View>
        <Feather name="chevron-right" size={20} color={C.textSubtle} />
      </TouchableOpacity>

      {overdueRules.length > 0 && (
        <View style={styles.alertBanner}>
          <Feather name="alert-circle" size={16} color={C.danger} />
          <Text style={styles.alertText}>
            {overdueRules.length} part{overdueRules.length > 1 ? "s" : ""} overdue for replacement
          </Text>
        </View>
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

      <LuxCard style={styles.section}>
        <SectionHeader title="Issues" />
        {vehicleIssuesForCar.length === 0 ? (
          <>
            <Text style={styles.issuesSummary}>No issues recorded for this vehicle.</Text>
            <Text style={styles.issuesSub}>The driver manages issues on their own account.</Text>
          </>
        ) : (
          <>
            <Text style={styles.issuesSummary}>
              {openIssuesCount === 0
                ? "No open issues — all recorded items are resolved."
                : `${openIssuesCount} open · ${vehicleIssuesForCar.length} total`}
            </Text>
            {vehicleIssuesForCar.map((issue, idx) => {
              const isOpen = issue.status === "open";
              const isLast = idx === vehicleIssuesForCar.length - 1;
              return (
                <View
                  key={issue.id}
                  style={[styles.issueRow, isLast && { borderBottomWidth: 0, paddingBottom: 2 }]}
                >
                  <View style={[styles.issueIcon, !isOpen && styles.issueIconResolved]}>
                    <Feather name="alert-circle" size={14} color={isOpen ? C.danger : C.textMuted} />
                  </View>
                  <View style={styles.issueTextCol}>
                    <Text
                      style={[styles.issueTitleLine, !isOpen && styles.issueTitleResolved]}
                      numberOfLines={2}
                    >
                      {issue.title}
                    </Text>
                    <Text style={styles.issueMeta}>
                      Updated {new Date(issue.updatedAt).toLocaleDateString("en-ZA")}
                      {issue.notedOdometerKm != null
                        ? ` · ${issue.notedOdometerKm.toLocaleString()} km`
                        : ""}
                    </Text>
                    <View style={[styles.issueStatusPill, !isOpen && styles.issueStatusPillResolved]}>
                      <Text style={[styles.issueStatusText, !isOpen && styles.issueStatusTextResolved]}>
                        {isOpen ? "Open" : "Resolved"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            <Text style={[styles.issuesSub, { marginTop: 8 }]}>The driver manages issues on their own account.</Text>
          </>
        )}
      </LuxCard>

      <LuxCard style={styles.section}>
        <SectionHeader title="Service interval" />
        <View style={styles.serviceRow}>
          <View style={styles.serviceChip}>
            <Text style={styles.serviceChipText}>Every 10,000 km</Text>
          </View>
          <Text style={[styles.serviceValue, serviceKmLeft <= 1000 && { color: serviceKmLeft <= 0 ? C.danger : C.warning }]}>
            {serviceKmLeft > 0
              ? `${serviceKmLeft.toLocaleString()} km left`
              : `${Math.abs(serviceKmLeft).toLocaleString()} km overdue`}
          </Text>
        </View>
      </LuxCard>

      <LuxCard style={styles.section}>
        <SectionHeader title="License disk" />
        {disk ? (
          <>
            <View style={styles.diskRow}>
              <View style={styles.diskItem}>
                <Text style={styles.diskLabel}>Disk number</Text>
                <Text style={styles.diskValue}>{(disk.licenseNumber || "—").toUpperCase()}</Text>
              </View>
              <View style={styles.diskItem}>
                <Text style={styles.diskLabel}>Expiry</Text>
                <Text
                  style={[
                    styles.diskValue,
                    disk.expiryDate && new Date(disk.expiryDate) < new Date() && { color: C.danger },
                  ]}
                >
                  {disk.expiryDate ? formatExpiryDisplay(disk.expiryDate) : "—"}
                </Text>
              </View>
              <View style={styles.diskItem}>
                <Text style={styles.diskLabel}>License No</Text>
                <Text style={styles.diskValue}>{(disk.licenseNo || "—").toUpperCase()}</Text>
              </View>
            </View>
            <View style={[styles.diskRow, { marginTop: 8 }]}>
              <View style={styles.diskItem}>
                <Text style={styles.diskLabel}>Fees</Text>
                <Text style={[styles.diskValue, { textTransform: "none" }]}>
                  {disk.fees != null && !Number.isNaN(Number(disk.fees))
                    ? formatDecimal(Number(disk.fees), 2)
                    : "—"}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.emptyDisk}>No license disk on file for this vehicle.</Text>
        )}
      </LuxCard>

      <LuxCard style={styles.section}>
        <SectionHeader title="Last checks" />
        {(["oil", "tyrePressure", "coolant"] as const).map((field) => {
          const labels: Record<string, string> = {
            oil: "Engine Oil",
            tyrePressure: "Tyre Pressure",
            coolant: "Coolant",
          };
          return (
            <CheckItem key={field} label={labels[field]} lastDate={checks?.[field] ?? null} />
          );
        })}
      </LuxCard>

      {recentActivityItems.length > 0 && (
        <LuxCard style={styles.section}>
          <SectionHeader
            title="Recent vehicle activity"
            action={{
              label: "All logs",
              onPress: () => router.push("/garage/organisation-vehicle-logbook"),
            }}
          />
          {recentActivityItems.map((item, index) => {
            const isLast = index === recentActivityItems.length - 1;
            if (item._type === "service") {
              return (
                <TouchableOpacity
                  key={`${item._type}-${item.id}`}
                  style={[styles.recentItem, isLast && { borderBottomWidth: 0 }]}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: logbookItemPagePath(),
                      params: buildLogbookItemPageParams(item, { readOnly: true }),
                    })
                  }
                >
                  <View style={styles.recentIcon}>
                    <Feather name="tool" size={14} color={C.tint} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle}>{item.description}</Text>
                    <Text style={styles.recentSub}>
                      {new Date(item.date).toLocaleDateString("en-ZA")} · Tap for details
                    </Text>
                  </View>
                  <Text style={styles.recentCost}>R{item.cost.toLocaleString()}</Text>
                  <Feather name="chevron-right" size={16} color={C.textSubtle} />
                </TouchableOpacity>
              );
            }
            if (item._type === "fuel") {
              return (
                <TouchableOpacity
                  key={`${item._type}-${item.id}`}
                  style={[styles.recentItem, isLast && { borderBottomWidth: 0 }]}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: logbookItemPagePath(),
                      params: buildLogbookItemPageParams(item, { readOnly: true }),
                    })
                  }
                >
                  <View style={[styles.recentIcon, { backgroundColor: "rgba(52,152,219,0.12)" }]}>
                    <Feather name="droplet" size={14} color={C.info} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle}>
                      Fuel — {item.liters}L @ R{item.costPerLiter.toFixed(2)}/L
                    </Text>
                    <Text style={styles.recentSub}>
                      {new Date(item.date).toLocaleDateString("en-ZA")} · Tap for details
                    </Text>
                  </View>
                  <Text style={styles.recentCost}>R{item.totalCost.toFixed(0)}</Text>
                  <Feather name="chevron-right" size={16} color={C.textSubtle} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={`${item._type}-${item.id}`}
                style={[styles.recentItem, isLast && { borderBottomWidth: 0 }]}
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: logbookItemPagePath(),
                    params: buildLogbookItemPageParams(item, { readOnly: true }),
                  })
                }
              >
                <View style={[styles.recentIcon, { backgroundColor: "rgba(149,165,166,0.15)" }]}>
                  <Feather name="activity" size={14} color={C.textSubtle} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>
                    Odometer — {item.reading.toLocaleString()} km
                  </Text>
                  <Text style={styles.recentSub}>
                    {new Date(item.date).toLocaleDateString("en-ZA")} · Tap for details
                  </Text>
                </View>
                <Text style={[styles.recentCost, { color: C.textMuted }]}>—</Text>
                <Feather name="chevron-right" size={16} color={C.textSubtle} />
              </TouchableOpacity>
            );
          })}
        </LuxCard>
      )}
    </ScrollView>
  );
}
