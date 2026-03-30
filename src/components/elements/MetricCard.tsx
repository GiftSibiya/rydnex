import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.dark;

type Props = {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: boolean;
};

export default function MetricCard({ label, value, unit, sub, accent }: Props) {
  return (
    <View style={[styles.card, accent && styles.accent]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    gap: 4,
  },
  accent: {
    borderColor: "rgba(46,204,113,0.3)",
    backgroundColor: "rgba(46,204,113,0.06)",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  value: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  accentValue: {
    color: C.tint,
  },
  unit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
  },
});
