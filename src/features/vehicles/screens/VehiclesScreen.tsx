import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { FONT_FAMILY } from "@/constants/Fonts";
import useVehicleStore from "@/features/vehicles/store/useVehicleStore";
import ScreenScaffold from "@/shared/ui/ScreenScaffold";
import { AuthStore, ToastStateStore } from "@/stores/StoresIndex";
import { useAppTheme } from "@/themes/AppTheme";
import VehiclePickerModal from "@/components/elements/VehiclePickerModal";

const C = Colors.dark;

const VehiclesScreen = () => {
  const { colors } = useAppTheme();
  const { user } = AuthStore();
  const { showToast } = ToastStateStore();
  const { vehicles, fetchVehicles, createVehicle, setActiveVehicle, activeVehicleId } =
    useVehicleStore();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [trim, setTrim] = useState("");
  const [vin, setVin] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);

  const canAddMore = vehicles.length < 2;
  const activeVehicle = useMemo(
    () => vehicles.find((item) => item.id === activeVehicleId) ?? null,
    [vehicles, activeVehicleId]
  );

  const hasVehicleType = make && model && year && trim;

  const onLoad = async () => {
    if (!user?.id) return;
    await fetchVehicles(user.id);
  };

  const onCreate = async () => {
    if (!user?.id) return;
    try {
      await createVehicle({
        user_id: user.id,
        make,
        model,
        year: year ?? undefined,
        trim,
        vin,
        registration_number: registrationNumber,
        is_active: true,
      });
      showToast({ message: "Vehicle added to your logbook.", type: "success" });
      setMake("");
      setModel("");
      setYear(null);
      setTrim("");
      setVin("");
      setRegistrationNumber("");
    } catch (error: any) {
      showToast({
        message: error?.message ?? "Could not add vehicle.",
        type: "warning",
      });
    }
  };

  const vehicleTypeLabel = hasVehicleType
    ? `${year} ${make} ${model} ${trim}`
    : "Tap to select make, model, year & trim";

  return (
    <ScreenScaffold title="Vehicles" subtitle="Create and manage your vehicle profiles">
      {/* Refresh */}
      <View style={{ marginBottom: 12 }}>
        <Pressable
          onPress={onLoad}
          style={[
            styles.secondaryButton,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Refresh vehicles
          </Text>
        </Pressable>
      </View>

      {/* Add vehicle form */}
      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NEW VEHICLE</Text>

        {/* Vehicle type picker trigger */}
        <TouchableOpacity
          style={[
            styles.pickerTrigger,
            hasVehicleType && styles.pickerTriggerSelected,
          ]}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.75}
        >
          <View style={styles.pickerTriggerLeft}>
            <View style={[styles.triggerIconWrap, hasVehicleType && styles.triggerIconWrapSelected]}>
              <Feather
                name="truck"
                size={16}
                color={hasVehicleType ? C.tint : C.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.pickerTriggerLabel,
                  hasVehicleType && styles.pickerTriggerLabelSelected,
                ]}
                numberOfLines={1}
              >
                {vehicleTypeLabel}
              </Text>
              {hasVehicleType && (
                <Text style={styles.pickerTriggerSub}>Make · Model · Year · Trim</Text>
              )}
            </View>
          </View>
          <View style={styles.pickerTriggerRight}>
            {hasVehicleType && (
              <TouchableOpacity
                onPress={() => {
                  setMake("");
                  setModel("");
                  setYear(null);
                  setTrim("");
                }}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <Feather name="x" size={13} color={C.textMuted} />
              </TouchableOpacity>
            )}
            <Feather
              name="chevron-right"
              size={16}
              color={hasVehicleType ? C.tint : C.textSubtle}
            />
          </View>
        </TouchableOpacity>

        {/* VIN */}
        <TextInput
          value={vin}
          onChangeText={setVin}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="VIN number (optional)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        {/* Registration */}
        <TextInput
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Registration number"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        {/* Submit */}
        <Pressable
          onPress={onCreate}
          disabled={!canAddMore || !hasVehicleType || !registrationNumber}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor:
                canAddMore && hasVehicleType && registrationNumber
                  ? C.tint
                  : colors.surfaceAlt,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.addButtonText,
              {
                color:
                  canAddMore && hasVehicleType && registrationNumber
                    ? "#050505"
                    : colors.textMuted,
              },
            ]}
          >
            {canAddMore ? "Add Vehicle" : "Upgrade to add more vehicles"}
          </Text>
        </Pressable>
      </View>

      {/* Vehicle list */}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => `${item.id}`}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isActive = item.id === activeVehicleId;
          return (
            <Pressable
              onPress={() => setActiveVehicle(item.id)}
              style={[
                styles.vehicleRow,
                {
                  backgroundColor: isActive ? "rgba(46,204,113,0.06)" : colors.surface,
                  borderColor: isActive ? C.tint : colors.border,
                },
              ]}
            >
              <View style={[styles.vehicleIconWrap, isActive && styles.vehicleIconWrapActive]}>
                <Feather name="truck" size={16} color={isActive ? C.tint : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vehicleName, { color: colors.text }]}>
                  {item.year ? `${item.year} ` : ""}{item.make} {item.model}
                </Text>
                {item.trim ? (
                  <Text style={[styles.vehicleReg, { color: colors.textMuted }]}>
                    {item.trim}
                  </Text>
                ) : null}
                <Text style={[styles.vehicleReg, { color: colors.textMuted }]}>
                  {item.registration_number}
                </Text>
              </View>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="truck" size={32} color={C.textSubtle} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No vehicles yet
            </Text>
          </View>
        }
      />

      {/* Picker modal */}
      <VehiclePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={(m, mo, y, t) => {
          setMake(m);
          setModel(mo);
          setYear(y);
          setTrim(t);
        }}
      />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.nexaBold,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  // Picker trigger
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: C.surfaceElevated,
  },
  pickerTriggerSelected: {
    borderColor: "rgba(46,204,113,0.4)",
    backgroundColor: "rgba(46,204,113,0.04)",
  },
  pickerTriggerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  pickerTriggerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  triggerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerIconWrapSelected: {
    backgroundColor: "rgba(46,204,113,0.12)",
  },
  pickerTriggerLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  pickerTriggerLabelSelected: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  pickerTriggerSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  clearBtn: {
    padding: 2,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 14,
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 13,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  addButtonText: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Vehicle list
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  vehicleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1E2C22",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleIconWrapActive: {
    backgroundColor: "rgba(46,204,113,0.1)",
    borderColor: "rgba(46,204,113,0.3)",
  },
  vehicleName: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 15,
  },
  vehicleReg: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 12,
    marginTop: 1,
  },
  activeBadge: {
    backgroundColor: "rgba(46,204,113,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.25)",
  },
  activeBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
    letterSpacing: 0.4,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.poppinsRegular,
  },
});

export default VehiclesScreen;
