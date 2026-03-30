import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";
import { PartRule, Vehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

type Props = {
  rule: PartRule;
  vehicle: Vehicle;
  onMarkReplaced: () => void;
  onDelete: () => void;
};

function urgencyLevel(rule: PartRule, vehicle: Vehicle): { label: string; color: string; pctKm: number; pctDays: number } {
  const kmSince = vehicle.currentOdometer - rule.lastReplacedKm;
  const daysSince = Math.floor((Date.now() - new Date(rule.lastReplacedDate).getTime()) / (1000 * 60 * 60 * 24));
  const pctKm = rule.intervalKm > 0 ? Math.min(kmSince / rule.intervalKm, 1) : 0;
  const pctDays = rule.intervalDays > 0 ? Math.min(daysSince / rule.intervalDays, 1) : 0;
  const max = Math.max(pctKm, pctDays);
  if (max >= 1) return { label: "Overdue", color: C.danger, pctKm, pctDays };
  if (max >= 0.8) return { label: "Due Soon", color: C.warning, pctKm, pctDays };
  return { label: "Good", color: C.success, pctKm, pctDays };
}

export default function ReminderItem({ rule, vehicle, onMarkReplaced, onDelete }: Props) {
  const { label, color, pctKm, pctDays } = urgencyLevel(rule, vehicle);
  const kmLeft = Math.max(0, rule.intervalKm - (vehicle.currentOdometer - rule.lastReplacedKm));
  const daysLeft = Math.max(0, rule.intervalDays - Math.floor((Date.now() - new Date(rule.lastReplacedDate).getTime()) / 86400000));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
          <Text style={styles.partName}>{rule.partName}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onMarkReplaced} style={styles.iconBtn} activeOpacity={0.7}>
            <Feather name="check-circle" size={18} color={C.tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={16} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bars}>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>KM</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pctKm * 100}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={styles.barValue}>{kmLeft.toLocaleString()} km left</Text>
        </View>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Days</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pctDays * 100}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={styles.barValue}>{daysLeft} days left</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleRow: { gap: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  partName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  actions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 4 },
  bars: { gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    width: 28,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: C.surfaceBorder,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    borderRadius: 2,
    minWidth: 4,
  },
  barValue: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    width: 72,
    textAlign: "right",
  },
});
