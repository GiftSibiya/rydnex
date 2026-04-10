import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import FuelLevelGauge from "@/components/elements/FuelLevelGauge";
import GoldButton from "@/components/buttons/GoldButton";
import LuxInput from "@/components/forms/LuxInput";
import { useVehicle } from "@/contexts/VehicleContext";
import useFuelPricesStore, { selectDefaultCostPerLiter } from "@/stores/data/FuelPricesStore";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const parseNumericText = (value: string) => Number(value.replace(/,/g, "."));


export default function fuelScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const { activeVehicle, addFuelLog } = useVehicle();
  const defaultCostPerLiter = useFuelPricesStore(selectDefaultCostPerLiter);
  const syncFuelPrices = useFuelPricesStore((s) => s.sync);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      void syncFuelPrices();
    }, [syncFuelPrices])
  );
  const [form, setForm] = useState({
    liters: "50",
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
  const [fuelModalVisible, setFuelModalVisible] = useState(false);
  const animatedFillWidth = useRef(new Animated.Value(fuelPercent)).current;

  useEffect(() => {
    Animated.timing(animatedFillWidth, {
      toValue: fuelPercent,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [animatedFillWidth, fuelPercent]);

  useEffect(() => {
    if (defaultCostPerLiter == null) return;
    setForm((f) => {
      if (f.costPerLiter !== "") return f;
      return { ...f, costPerLiter: defaultCostPerLiter.toFixed(2) };
    });
  }, [defaultCostPerLiter]);

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
      

        {/* {totalCost > 0 && (
          <View style={styles.totalBanner}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalValue}>R{totalCost.toFixed(2)}</Text>
          </View>
        )} */}

        <View style={styles.form}>
          <View style={styles.fuelLevelSection}>
            <Text style={styles.sectionTitle}>Fuel Level</Text>
            <Text style={styles.sectionSub}>
              Tap below to log your current fuel level.
            </Text>

            <View style={styles.hGaugeRow}>
              <Text style={styles.hGaugeEndLabel}>E</Text>
              <View style={styles.hGaugeTrack}>
                <Animated.View
                  style={[
                    styles.hGaugeFill,
                    {
                      width: animatedFillWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                        extrapolate: "clamp",
                      }),
                      backgroundColor:
                        fuelPercent > 50 ? C.tint : fuelPercent > 20 ? "#F5A623" : "#E74C3C",
                    },
                  ]}
                />
                <View style={styles.hGaugeTick25} />
                <View style={styles.hGaugeTick50} />
                <View style={styles.hGaugeTick75} />
              </View>
              <Text style={styles.hGaugeEndLabel}>F</Text>
            </View>

            <View style={styles.fuelSummaryPair}>
              <View style={[styles.fuelSummaryRow, { flex: 1 }]}>
                <Text style={styles.fuelSummaryLabel}>Current Level</Text>
                <Text style={styles.fuelSummaryValue}>{Math.round(fuelPercent)}%</Text>
              </View>
              <View style={[styles.fuelSummaryRow, { flex: 1 }]}>
                <Text style={styles.fuelSummaryLabel}>Range Left</Text>
                <Text style={styles.fuelSummaryValue}>{Math.round(rangeLeftNumber)} km</Text>
              </View>
            </View>
            <GoldButton
              label="Log Fuel Usage"
              variant="secondary"
              onPress={() => setFuelModalVisible(true)}
            />
          </View>

          <LuxInput
            label={form.liters === "50" ? "Litres (global avg. — not your vehicle)" : "Litres"}
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

      <Modal
        animationType="fade"
        transparent
        visible={fuelModalVisible}
        onRequestClose={() => setFuelModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.backdropTouch} onPress={() => setFuelModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fuel Usage</Text>
            </View>
            <Text style={styles.modalSub}>
              Drag the tank marker or edit range values. Everything stays synchronized.
            </Text>

            <View style={styles.fuelLevelRow}>
              <FuelLevelGauge
                percentage={fuelPercent}
                totalRange={totalRangeNumber}
                rangeLeft={rangeLeftNumber}
                onPercentageChange={handleFuelPercentChange}
                showMetrics={false}
              />

              <View style={styles.modalRightColumn}>
                <View style={styles.metricPair}>
                  <View style={[styles.metricCard, { flex: 1 }]}>
                    <Text style={styles.metricLabel}>Fuel Level</Text>
                    <Text style={styles.metricValue}>{Math.round(fuelPercent)}%</Text>
                  </View>
                  <View style={[styles.metricCard, { flex: 1 }]}>
                    <Text style={styles.metricLabel}>Range Left</Text>
                    <Text style={styles.metricValue}>{Math.round(rangeLeftNumber)} km</Text>
                  </View>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Range Used</Text>
                  <Text style={styles.metricValue}>
                    {Math.max(0, Math.round(totalRangeNumber - rangeLeftNumber))} km
                  </Text>
                </View>
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
              </View>
            </View>
            <View style={styles.modalButtonRow}>
              <GoldButton
                label="Cancel"
                variant="secondary"
                onPress={() => setFuelModalVisible(false)}
                style={{ flex: 1 }}
              />
              <GoldButton
                label="Save"
                onPress={() => setFuelModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
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
  fuelSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surfaceElevated,
    borderColor: C.surfaceBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fuelSummaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textMuted },
  fuelSummaryValue: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.tint },
  fuelLevelRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  fuelControls: {
    flex: 1,
    gap: 10,
  },
  modalRightColumn: {
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
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
  hGaugeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hGaugeEndLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: C.textMuted,
    width: 14,
    textAlign: "center",
  },
  hGaugeTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    overflow: "hidden",
    position: "relative",
  },
  hGaugeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  hGaugeTick25: {
    position: "absolute",
    left: "25%",
    top: 2,
    bottom: 2,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  hGaugeTick50: {
    position: "absolute",
    left: "50%",
    top: 2,
    bottom: 2,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  hGaugeTick75: {
    position: "absolute",
    left: "75%",
    top: 2,
    bottom: 2,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  fuelSummaryPair: { flexDirection: "row", gap: 8 },
  metricPair: { flexDirection: "row", gap: 8 },
  modalButtonRow: { flexDirection: "row", gap: 10 },
});