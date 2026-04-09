import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LuxCard from "@/components/elements/LuxCard";
import SectionHeader from "@/components/layouts/SectionHeader";
import Colors from "@/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;
const SERVICE_INTERVAL_KM = 10000;
const SERVICE_INTERVAL_DAYS = 180;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA");
}

export default function ServiceDetailsPage() {
  const { activeVehicle, serviceLogs } = useVehicle();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (!activeVehicle) return null;

  const vehicleLogs = serviceLogs.filter((s) => s.vehicleId === activeVehicle.id);
  const lastService = vehicleLogs.find((s) => s.type === "service");
  const lastAnyLog = vehicleLogs[0];

  const nextServiceAtKm = lastService
    ? lastService.odometer + SERVICE_INTERVAL_KM
    : activeVehicle.currentOdometer + SERVICE_INTERVAL_KM;
  const kmRemaining = nextServiceAtKm - activeVehicle.currentOdometer;
  const nextServiceDate = lastService
    ? new Date(new Date(lastService.date).getTime() + SERVICE_INTERVAL_DAYS * 86400000)
    : new Date(Date.now() + SERVICE_INTERVAL_DAYS * 86400000);
  const daysRemaining = Math.ceil((nextServiceDate.getTime() - Date.now()) / 86400000);
  const isOverdue = kmRemaining <= 0 || daysRemaining <= 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Service Details</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
          </Text>
        </View>
      </View>

      <LuxCard>
        <SectionHeader title="Service Interval" />
        <View style={styles.intervalGrid}>
          <View style={styles.intervalItem}>
            <Text style={styles.intervalLabel}>Interval</Text>
            <Text style={styles.intervalValue}>Every 10,000 km or 6 months</Text>
          </View>
          <View style={styles.intervalItem}>
            <Text style={styles.intervalLabel}>Next service at</Text>
            <Text style={styles.intervalValue}>{Math.max(nextServiceAtKm, 0).toLocaleString()} km</Text>
          </View>
          <View style={styles.intervalItem}>
            <Text style={styles.intervalLabel}>Distance left</Text>
            <Text style={[styles.intervalValue, kmRemaining <= 1000 && { color: isOverdue ? C.danger : C.warning }]}>
              {kmRemaining > 0 ? `${kmRemaining.toLocaleString()} km` : `${Math.abs(kmRemaining).toLocaleString()} km overdue`}
            </Text>
          </View>
          <View style={styles.intervalItem}>
            <Text style={styles.intervalLabel}>Time left</Text>
            <Text style={[styles.intervalValue, daysRemaining <= 14 && { color: isOverdue ? C.danger : C.warning }]}>
              {daysRemaining > 0 ? `${daysRemaining} days` : `${Math.abs(daysRemaining)} days overdue`}
            </Text>
          </View>
        </View>
      </LuxCard>

      <LuxCard>
        <SectionHeader title="Actions" />
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/log/service?type=service")}
            activeOpacity={0.8}
          >
            <Feather name="settings" size={15} color={C.tint} />
            <Text style={styles.actionBtnText}>Log Service</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnRepair]}
            onPress={() => router.push("/log/service?type=repair")}
            activeOpacity={0.8}
          >
            <Feather name="alert-triangle" size={15} color={C.danger} />
            <Text style={[styles.actionBtnText, { color: C.danger }]}>Log Repair</Text>
          </TouchableOpacity>
        </View>
      </LuxCard>

      <LuxCard>
        <SectionHeader title="Recent Service & Repairs" />
        {vehicleLogs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No service or repair logs yet.</Text>
          </View>
        ) : (
          vehicleLogs.slice(0, 8).map((log) => (
            <View key={log.id} style={styles.logRow}>
              <View style={[styles.logIcon, log.type === "repair" && styles.logIconRepair]}>
                <Feather
                  name={log.type === "repair" ? "alert-triangle" : "tool"}
                  size={14}
                  color={log.type === "repair" ? C.danger : C.tint}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>{log.description}</Text>
                <Text style={styles.logSub}>
                  {formatDate(log.date)} - {log.odometer.toLocaleString()} km
                </Text>
              </View>
              <Text style={styles.logCost}>R{log.cost.toLocaleString()}</Text>
            </View>
          ))
        )}
        {lastAnyLog ? (
          <Text style={styles.lastUpdated}>Last update: {formatDate(lastAnyLog.date)}</Text>
        ) : null}
      </LuxCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center" },
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
  headerTitle: { fontSize: 19, fontFamily: "Inter_700Bold", color: C.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  intervalGrid: { gap: 10 },
  intervalItem: { gap: 2 },
  intervalLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  intervalValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.3)",
    backgroundColor: "rgba(46,204,113,0.1)",
    paddingVertical: 11,
  },
  actionBtnRepair: {
    borderColor: "rgba(231,76,60,0.3)",
    backgroundColor: "rgba(231,76,60,0.08)",
  },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint },
  emptyWrap: { paddingVertical: 8 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(46,204,113,0.12)",
  },
  logIconRepair: { backgroundColor: "rgba(231,76,60,0.12)" },
  logTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
  logSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  logCost: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.text },
  lastUpdated: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSubtle, marginTop: 8 },
});
