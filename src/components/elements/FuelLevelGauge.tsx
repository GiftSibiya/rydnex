import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

const C = Colors.dark;
const FILL_DURATION_MS = 550;
const NUMBER_DURATION_MS = 450;

type FuelLevelGaugeProps = {
  percentage: number;
  totalRange: number;
  rangeLeft: number;
  tankHeight?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function useAnimatedNumber(target: number, duration = NUMBER_DURATION_MS) {
  const value = useSharedValue(target);
  const [display, setDisplay] = useState(Math.round(target));

  useEffect(() => {
    value.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, target, value]);

  const rounded = useDerivedValue(() => Math.round(value.value));

  useAnimatedReaction(
    () => rounded.value,
    (next, prev) => {
      if (next !== prev) {
        runOnJS(setDisplay)(next);
      }
    },
    [],
  );

  return display;
}

export default function FuelLevelGauge({
  percentage,
  totalRange,
  rangeLeft,
  tankHeight = 220,
}: FuelLevelGaugeProps) {
  const safePercent = useMemo(() => clamp(percentage, 0, 100), [percentage]);
  const safeTotal = useMemo(() => Math.max(0, totalRange), [totalRange]);
  const safeLeft = useMemo(() => clamp(rangeLeft, 0, safeTotal || rangeLeft), [rangeLeft, safeTotal]);
  const safeUsed = useMemo(() => Math.max(0, safeTotal - safeLeft), [safeLeft, safeTotal]);

  const fillPercent = useSharedValue(safePercent);

  useEffect(() => {
    fillPercent.value = withTiming(safePercent, {
      duration: FILL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [fillPercent, safePercent]);

  const fillStyle = useAnimatedStyle(() => ({
    height: (fillPercent.value / 100) * tankHeight,
  }));

  const animatedPercent = useAnimatedNumber(safePercent);
  const animatedLeft = useAnimatedNumber(safeLeft);
  const animatedUsed = useAnimatedNumber(safeUsed);

  return (
    <View style={styles.wrapper}>
      <View style={styles.gaugeRow}>
        <View style={[styles.labelRail, { height: tankHeight }]}>
          <Text style={styles.railLabel}>F</Text>
          <View style={styles.railLine} />
          <Text style={styles.railLabel}>E</Text>
        </View>

        <View style={[styles.tank, { height: tankHeight }]}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Fuel Level</Text>
          <Text style={styles.metricValue}>{animatedPercent}%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Range Left</Text>
          <Text style={styles.metricValue}>{animatedLeft} km</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Range Used</Text>
          <Text style={styles.metricValue}>{animatedUsed} km</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
    alignItems: "center",
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  gaugeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  labelRail: {
    alignItems: "center",
    justifyContent: "space-between",
    width: 20,
  },
  railLabel: {
    color: C.textMuted,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.8,
  },
  railLine: {
    width: 2,
    flex: 1,
    marginVertical: 10,
    borderRadius: 999,
    backgroundColor: C.surfaceBorder,
  },
  tank: {
    width: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.surfaceBorder,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: C.surfaceElevated,
  },
  fill: {
    width: "100%",
    backgroundColor: C.tint,
  },
  metrics: {
    width: "100%",
    gap: 8,
  },
  metricCard: {
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(46,204,113,0.05)",
  },
  metricLabel: {
    color: C.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricValue: {
    color: C.text,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginTop: 3,
  },
});
