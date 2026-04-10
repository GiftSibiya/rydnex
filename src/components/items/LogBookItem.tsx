import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  FuelLog,
  OdometerLog,
  ServiceLog,
} from "@/contexts/VehicleContext";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type LogItem =
  | (ServiceLog & { _type: "service" })
  | (FuelLog & { _type: "fuel" })
  | (OdometerLog & { _type: "odometer" });

type Props = {
  item: LogItem;
  onPress: () => void;
  onDelete?: () => void;
};

export default function LogBookItem({ item, onPress, onDelete }: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const confirmDelete = () => {
    if (!onDelete) return;
    Alert.alert("Delete entry", "Are you sure you want to delete this log entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };
  if (item._type === "service") {
    return (
      <TouchableOpacity style={styles.entry} onPress={onPress} activeOpacity={0.7}>
        <View
          style={[
            styles.entryLine,
            { backgroundColor: item.type === "repair" ? C.danger : C.tint },
          ]}
        />
        <View
          style={[
            styles.entryIcon,
            {
              backgroundColor:
                item.type === "repair"
                  ? "rgba(231,76,60,0.12)"
                  : "rgba(46,204,113,0.1)",
            },
          ]}
        >
          <Feather
            name="tool"
            size={14}
            color={item.type === "repair" ? C.danger : C.tint}
          />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>{item.description}</Text>
            <Text style={styles.entryAmount}>R{item.cost.toLocaleString()}</Text>
          </View>
          <Text style={styles.entryMeta}>
            {new Date(item.date).toLocaleDateString("en-ZA")} •{" "}
            {item.odometer.toLocaleString()} km
            {item.workshop ? ` • ${item.workshop}` : ""}
          </Text>
          {item.notes ? (
            <Text style={styles.entryNote}>{item.notes}</Text>
          ) : null}
        </View>
        {onDelete && (
          <TouchableOpacity onPress={confirmDelete} style={styles.delBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color={C.textSubtle} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (item._type === "fuel") {
    return (
      <TouchableOpacity style={styles.entry} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.entryLine, { backgroundColor: C.info }]} />
        <View style={[styles.entryIcon, { backgroundColor: "rgba(52,152,219,0.12)" }]}>
          <Feather name="droplet" size={14} color={C.info} />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>
              {item.liters}L @ R{item.costPerLiter.toFixed(2)}/L
              {item.fullTank ? " ✓" : ""}
            </Text>
            <Text style={styles.entryAmount}>R{item.totalCost.toFixed(0)}</Text>
          </View>
          <Text style={styles.entryMeta}>
            {new Date(item.date).toLocaleDateString("en-ZA")} •{" "}
            {item.odometer.toLocaleString()} km
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={confirmDelete} style={styles.delBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color={C.textSubtle} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.entry} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.entryLine, { backgroundColor: C.success }]} />
      <View style={[styles.entryIcon, { backgroundColor: "rgba(46,204,113,0.1)" }]}>
        <Feather name="activity" size={14} color={C.success} />
      </View>
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>
            Odometer: {item.reading.toLocaleString()} km
          </Text>
        </View>
        <Text style={styles.entryMeta}>
          {new Date(item.date).toLocaleDateString("en-ZA")}
          {item.note ? ` • ${item.note}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  entry: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  entryLine: {
    width: 2,
    alignSelf: "stretch",
    borderRadius: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  entryContent: { flex: 1 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  entryTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  entryAmount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  entryMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 3,
  },
  entryNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    marginTop: 3,
    fontStyle: "italic",
  },
  delBtn: { padding: 6, marginTop: 4 },
});
