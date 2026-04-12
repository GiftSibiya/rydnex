import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type Props = {
  label: string;
  lastDate: string | null;
  /** Omit for read-only (e.g. organisation fleet view). */
  onMark?: () => void;
};

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CheckItem({ label, lastDate, onMark }: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const days = lastDate ? daysSince(lastDate) : null;
  const color = days === null ? C.danger : days <= 14 ? C.success : days <= 30 ? C.warning : C.danger;
  const statusText = lastDate
    ? days === 0 ? "Today" : `${days}d ago`
    : "Never checked";

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.status, { color }]}>{statusText}</Text>
      </View>
      {onMark ? (
        <TouchableOpacity style={styles.btn} onPress={onMark} activeOpacity={0.7}>
          <Feather name="check" size={14} color={C.tint} />
          <Text style={styles.btnText}>Mark OK</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: { flex: 1 },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  status: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(46,204,113,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.2)",
  },
  btnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.tint,
  },
});
