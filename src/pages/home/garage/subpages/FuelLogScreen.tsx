import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import FuelLevelGauge from "@/components/elements/FuelLevelGauge";
import GoldButton from "@/components/elements/GoldButton";
import LuxInput from "@/components/elements/LuxInput";
import Colors from "@/constants/colors";
import { useVehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const parseNumericText = (value: string) => Number(value.replace(/,/g, "."));

type LevelSliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
};

function LevelSlider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
}: LevelSliderProps) {
  const [trackWidth, setTrackWidth] = useState(1);
  const range = maximumValue - minimumValue;
  const normalized = range <= 0 ? 0 : clamp((value - minimumValue) / range, 0, 1);

  const updateFromX = (positionX: number) => {
    const ratio = clamp(positionX / trackWidth, 0, 1);
    const next = minimumValue + ratio * range;
    onValueChange(next);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => updateFromX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => updateFromX(evt.nativeEvent.locationX),
      }),
    [trackWidth, range, minimumValue, onValueChange],
  );

  const trackFillWidth = normalized * trackWidth;
  const thumbLeft = clamp(normalized * trackWidth - 10, 0, Math.max(trackWidth - 20, 0));

  return (
    <View style={styles.sliderWrap}>
      <Pressable
        style={styles.sliderTrack}
        onLayout={(evt) => setTrackWidth(Math.max(evt.nativeEvent.layout.width, 1))}
        onPress={(evt) => updateFromX(evt.nativeEvent.locationX)}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderTrackFill, { width: trackFillWidth }]} />
        <View style={[styles.sliderThumb, { left: thumbLeft }]} />
      </Pressable>
    </View>
  );
}

export default function FuelLogScreen() {
  const { activeVehicle, addFuelLog } = useVehicle();
  const router = useRouter();
  const [form, setForm] = useState({
    liters: "",
    costPerLiter: "",
    odometer: activeVehicle ? String(activeVehicle.currentOdometer) : "",
    fullTank: true,
    date: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [totalRangeInput, setTotalRangeInput] = useState("650");
  const [rangeLeftInput, setRangeLeftInput] = useState("390");
  const [fuelPercent, setFuelPercent] = useState(60);

  const totalCost = (Number(form.liters) || 0) * (Number(form.costPerLiter) || 0);
  const totalRangeNumber = useMemo(
    () => Math.max(0, parseNumericText(totalRangeInput) || 0),
    [totalRangeInput],
  );
  const rawRangeLeftNumber = useMemo(
    () => Math.max(0, parseNumericText(rangeLeftInput) || 0),
    [rangeLeftInput],
  );
  const rangeLeftNumber = useMemo(() => {
    if (totalRangeNumber <= 0) return rawRangeLeftNumber;
    return clamp(rawRangeLeftNumber, 0, totalRangeNumber);
  }, [rawRangeLeftNumber, totalRangeNumber]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.liters || isNaN(Number(form.liters)) || Number(form.liters) <= 0) e.liters = "Enter litres";
    if (!form.costPerLiter || isNaN(Number(form.costPerLiter)) || Number(form.costPerLiter) <= 0) e.costPerLiter = "Enter cost/L";
    if (!form.odometer || isNaN(Number(form.odometer))) e.odometer = "Enter odometer";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    if (totalRangeNumber <= 0) {
      setFuelPercent(0);
      return;
    }
    if (rangeLeftNumber !== rawRangeLeftNumber) {
      setRangeLeftInput(String(Math.round(rangeLeftNumber)));
      return;
    }
    const computedPercent = clamp((rangeLeftNumber / totalRangeNumber) * 100, 0, 100);
    setFuelPercent(computedPercent);
  }, [rangeLeftNumber, rawRangeLeftNumber, totalRangeNumber]);

  const handleFuelPercentChange = (value: number) => {
    const nextPercent = clamp(value, 0, 100);
    setFuelPercent(nextPercent);
    if (totalRangeNumber <= 0) {
      setRangeLeftInput("0");
      return;
    }
    const computedLeft = Math.round((nextPercent / 100) * totalRangeNumber);
    setRangeLeftInput(String(clamp(computedLeft, 0, totalRangeNumber)));
  };

  const handleSave = async () => {
    if (!activeVehicle) return;
    if (!validate()) return;
    setLoading(true);
    await addFuelLog({
      vehicleId: activeVehicle.id,
      date: new Date(form.date).toISOString(),
      liters: Number(form.liters),
      costPerLiter: Number(form.costPerLiter),
      totalCost: totalCost,
      odometer: Number(form.odometer),
      fullTank: form.fullTank,
    });
    setLoading(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconRow}>
          <View style={styles.icon}>
            <Feather name="droplet" size={28} color={C.info} />
          </View>
          <Text style={styles.title}>Fuel Log </Text>
          <Text style={styles.sub}>Log a refuel for {activeVehicle?.make} {activeVehicle?.model}</Text>
        </View>

        {totalCost > 0 && (
          <View style={styles.totalBanner}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalValue}>R{totalCost.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.fuelLevelSection}>
            <Text style={styles.sectionTitle}>Fuel Level</Text>
            <Text style={styles.sectionSub}>
              Adjust with slider or update range values to animate the tank and counters.
            </Text>

            <View style={styles.fuelLevelRow}>
              <FuelLevelGauge
                percentage={fuelPercent}
                totalRange={totalRangeNumber}
                rangeLeft={rangeLeftNumber}
              />

              <View style={styles.fuelControls}>
                <LuxInput
                  label="Total Range (km)"
                  placeholder="e.g. 650"
                  value={totalRangeInput}
                  onChangeText={setTotalRangeInput}
                  keyboardType="numeric"
                />
                <LuxInput
                  label="Range Left (km)"
                  placeholder="e.g. 390"
                  value={rangeLeftInput}
                  onChangeText={setRangeLeftInput}
                  keyboardType="numeric"
                />

                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Tank Level</Text>
                    <Text style={styles.sliderValue}>{Math.round(fuelPercent)}%</Text>
                  </View>
                  <LevelSlider
                    minimumValue={0}
                    maximumValue={100}
                    value={fuelPercent}
                    onValueChange={handleFuelPercentChange}
                  />
                </View>
              </View>
            </View>
          </View>

          <LuxInput
            label="Litres"
            placeholder="e.g. 45.5"
            value={form.liters}
            onChangeText={(t) => setForm(f => ({ ...f, liters: t }))}
            keyboardType="decimal-pad"
            error={errors.liters}
          />
          <LuxInput
            label="Cost per Litre (R)"
            placeholder="e.g. 22.50"
            value={form.costPerLiter}
            onChangeText={(t) => setForm(f => ({ ...f, costPerLiter: t }))}
            keyboardType="decimal-pad"
            error={errors.costPerLiter}
          />
          <LuxInput
            label="Odometer (km)"
            placeholder="Current reading"
            value={form.odometer}
            onChangeText={(t) => setForm(f => ({ ...f, odometer: t }))}
            keyboardType="numeric"
            error={errors.odometer}
          />
          <LuxInput
            label="Date"
            placeholder="YYYY-MM-DD"
            value={form.date}
            onChangeText={(t) => setForm(f => ({ ...f, date: t }))}
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Full Tank</Text>
              <Text style={styles.switchSub}>Required for fuel efficiency calculation</Text>
            </View>
            <Switch
              value={form.fullTank}
              onValueChange={(v) => setForm(f => ({ ...f, fullTank: v }))}
              thumbColor={form.fullTank ? C.info : C.textSubtle}
              trackColor={{ false: C.surfaceBorder, true: "rgba(52,152,219,0.4)" }}
            />
          </View>
        </View>

        <GoldButton label="Save Fuel Log" onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 24, gap: 20 },
  iconRow: { alignItems: "center", gap: 8, paddingTop: 8 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(52,152,219,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(52,152,219,0.2)",
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  totalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(52,152,219,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(52,152,219,0.2)",
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.info },
  totalValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.info },
  fuelLevelSection: {
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surface,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  fuelLevelRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  fuelControls: {
    flex: 1,
    gap: 10,
  },
  sliderBlock: {
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: C.surfaceElevated,
  },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sliderLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textMuted },
  sliderValue: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.tint },
  sliderWrap: {
    paddingVertical: 8,
  },
  sliderTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: C.surfaceBorder,
    justifyContent: "center",
  },
  sliderTrackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: C.tint,
  },
  sliderThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.tintLight,
    borderWidth: 2,
    borderColor: C.tintDark,
  },
  form: { gap: 14 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  switchSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
});