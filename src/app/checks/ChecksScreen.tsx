import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
import Colors from "@/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

const CHECK_FIELDS = [
  {
    key: "oil" as const,
    label: "Engine Oil",
    icon: "droplet",
    tip: "Check every 2 weeks or before long trips",
  },
  {
    key: "tyrePressure" as const,
    label: "Tyre Pressure",
    icon: "disc",
    tip: "Check monthly or before long trips",
  },
  {
    key: "coolant" as const,
    label: "Coolant Level",
    icon: "thermometer",
    tip: "Check monthly when engine is cold",
  },
  {
    key: "spareWheel" as const,
    label: "Spare Wheel",
    icon: "circle",
    tip: "Check spare tyre pressure monthly",
  },
  {
    key: "lights" as const,
    label: "All Lights",
    icon: "zap",
    tip: "Check weekly — walk around your car",
  },
];

export default function ChecksScreen() {
  const { activeVehicle, lastChecks, updateLastCheck } = useVehicle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const checks = activeVehicle ? lastChecks.find((c) => c.vehicleId === activeVehicle.id) : null;

  const allGood = checks && CHECK_FIELDS.every((f) => {
    const d = checks[f.key];
    if (!d) return false;
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return days <= 14;
  });

  return (
    <ScrollView
      style={[styles.screen]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.pageTitle}>Last Checks</Text>
          <Text style={styles.headerSub}>
            {activeVehicle
              ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
              : "No active vehicle"}
          </Text>
        </View>
      </View>

      {!activeVehicle ? (
        <View style={styles.empty}>
          <Feather name="shield-off" size={36} color={C.textSubtle} />
          <Text style={styles.emptyTitle}>No Active Vehicle</Text>
          <Text style={styles.emptyText}>Select a vehicle from Garage to view checks</Text>
        </View>
      ) : (
        <>
          {allGood && (
            <View style={styles.allGoodBanner}>
              <Feather name="shield" size={16} color={C.success} />
              <Text style={styles.allGoodText}>All checks are up to date</Text>
            </View>
          )}

          <LuxCard style={styles.card}>
            <Text style={styles.cardTitle}>
              {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
            </Text>
            {CHECK_FIELDS.map((field) => (
              <CheckItem
                key={field.key}
                label={field.label}
                lastDate={checks?.[field.key] ?? null}
                onMark={() => updateLastCheck(activeVehicle.id, field.key, new Date().toISOString())}
              />
            ))}
          </LuxCard>

          <LuxCard style={styles.tipsCard} elevated>
            <Text style={styles.tipsTitle}>Maintenance Tips</Text>
            {CHECK_FIELDS.map((f) => (
              <View key={f.key} style={styles.tipRow}>
                <Feather name={f.icon as any} size={13} color={C.tint} />
                <Text style={styles.tipText}>
                  <Text style={styles.tipLabel}>{f.label}: </Text>
                  {f.tip}
                </Text>
              </View>
            ))}
          </LuxCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted },
  allGoodBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(46,204,113,0.1)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  allGoodText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.success },
  card: {},
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 8,
  },
  tipsCard: {},
  tipsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    lineHeight: 18,
  },
  tipLabel: {
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
});
