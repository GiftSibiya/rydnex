import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
const FILL_DURATION_MS = 550;
const NUMBER_DURATION_MS = 450;

type FuelLevelGaugeProps = {
  percentage: number;
  totalRange: number;
  rangeLeft: number;
  tankHeight?: number;
  onPercentageChange?: (value: number) => void;
  metricsPosition?: "bottom" | "right";
  showMetrics?: boolean;
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
  onPercentageChange,
  metricsPosition = "bottom",
  showMetrics = true,
}: FuelLevelGaugeProps) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const safePercent = useMemo(() => clamp(percentage, 0, 100), [percentage]);
  const safeTotal = useMemo(() => Math.max(0, totalRange), [totalRange]);
  const safeLeft = useMemo(() => clamp(rangeLeft, 0, safeTotal || rangeLeft), [rangeLeft, safeTotal]);
  const safeUsed = useMemo(() => Math.max(0, safeTotal - safeLeft), [safeLeft, safeTotal]);

  const fillPercent = useSharedValue(safePercent);
  const isDragging = useRef(false);
  const tankRef = useRef<View>(null);
  const tankPageY = useRef<number>(0);

  useEffect(() => {
    if (isDragging.current) return;
    fillPercent.value = withTiming(safePercent, {
      duration: FILL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [fillPercent, safePercent]);

  const fillStyle = useAnimatedStyle(() => ({
    height: (fillPercent.value / 100) * tankHeight,
  }));

  const dragLineStyle = useAnimatedStyle(() => {
    const fillH = (fillPercent.value / 100) * tankHeight;
    const top = Math.min(Math.max(tankHeight - fillH - 3, 0), tankHeight - 6);
    return { top };
  });

  const HANDLE_HIT_SLOP = 40; // px above/below the drag line that count as a grab

  const handlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt) => {
          if (!onPercentageChange) return false;
          // drag line top = tankHeight - fillH - 3
          const fillH = (fillPercent.value / 100) * tankHeight;
          const lineTop = clamp(tankHeight - fillH - 3, 0, tankHeight - 6);
          const touchY = evt.nativeEvent.locationY;
          return Math.abs(touchY - lineTop) <= HANDLE_HIT_SLOP;
        },
        onMoveShouldSetPanResponder: () => isDragging.current,
        onPanResponderGrant: (evt) => {
          isDragging.current = true;
          tankRef.current?.measure((_x, _y, _w, _h, _px, py) => {
            tankPageY.current = py;
          });
          const localY = evt.nativeEvent.pageY - tankPageY.current;
          const pct = clamp((1 - localY / tankHeight) * 100, 0, 100);
          fillPercent.value = pct;
          onPercentageChange?.(pct);
        },
        onPanResponderMove: (evt) => {
          const localY = evt.nativeEvent.pageY - tankPageY.current;
          const pct = clamp((1 - localY / tankHeight) * 100, 0, 100);
          fillPercent.value = pct;
          onPercentageChange?.(pct);
        },
        onPanResponderRelease: () => {
          isDragging.current = false;
        },
      }),
    [tankHeight, onPercentageChange, fillPercent],
  );

  const animatedPercent = useAnimatedNumber(safePercent);
  const animatedLeft = useAnimatedNumber(safeLeft);
  const animatedUsed = useAnimatedNumber(safeUsed);

  return (
    <View style={[styles.wrapper, metricsPosition === "right" && styles.wrapperRight]}>
      <View style={styles.gaugeRow}>
        <View style={[styles.labelRail, { height: tankHeight }]}>
          <Text style={styles.railLabel}>F</Text>
          <View style={styles.railLine} />
          <Text style={styles.railLabel}>E</Text>
        </View>

        <View
          ref={tankRef}
          style={[styles.tank, { height: tankHeight }]}
          {...(onPercentageChange ? handlePanResponder.panHandlers : {})}
        >
          <Animated.View style={[styles.fill, fillStyle]} />
          {onPercentageChange && (
            <Animated.View style={[styles.dragLine, dragLineStyle]}>
              <View style={styles.dragHandle} />
            </Animated.View>
          )}
        </View>
      </View>

      {showMetrics && (
        <View style={[styles.metrics, metricsPosition === "right" && styles.metricsRight]}>
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
      )}
    </View>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  wrapper: {
    gap: 14,
    alignItems: "stretch",
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  wrapperRight: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 12,
  },
  gaugeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 10,
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
  dragLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: "85%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "#fff",
    opacity: 0.9,
  },
  metrics: {
    flex: 1,
    gap: 8,
  },
  metricsRight: {
    minWidth: 150,
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
