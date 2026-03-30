import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "../src/constants/colors";
import { useVehicle } from "contexts/VehicleContext";

const C = Colors.dark;

export default function VehicleSelector() {
  const { vehicles, activeVehicle, setActiveVehicle } = useVehicle();
  const [open, setOpen] = useState(false);

  if (vehicles.length === 0) return null;

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <View style={styles.dot} />
        <Text style={styles.label} numberOfLines={1}>
          {activeVehicle ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : "Select vehicle"}
        </Text>
        <Feather name="chevron-down" size={14} color={C.tint} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Vehicle</Text>
            <ScrollView>
              {vehicles.map((v) => {
                const active = activeVehicle?.id === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.item, active && styles.itemActive]}
                    onPress={() => { setActiveVehicle(v); setOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={styles.itemMake}>{v.year} {v.make} {v.model}</Text>
                      <Text style={styles.itemReg}>{v.registration}</Text>
                    </View>
                    {active && <Feather name="check" size={18} color={C.tint} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    maxWidth: 200,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.tint,
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.surfaceElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: C.surfaceBorder,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  itemActive: {
    borderColor: C.tint,
    backgroundColor: "rgba(46,204,113,0.08)",
  },
  itemMake: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  itemReg: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },
});
