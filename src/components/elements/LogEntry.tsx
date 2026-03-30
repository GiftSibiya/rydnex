import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.dark;

type Props = {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: string;
  rightSub?: string;
  onDelete?: () => void;
};

export default function LogEntry({ icon, iconColor = C.tint, title, subtitle, right, rightSub, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Feather name={icon as any} size={16} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={styles.rightWrap}>
        {right && <Text style={styles.right}>{right}</Text>}
        {rightSub && <Text style={styles.rightSub}>{rightSub}</Text>}
      </View>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} activeOpacity={0.7}>
          <Feather name="trash-2" size={14} color={C.danger} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },
  rightWrap: { alignItems: "flex-end" },
  right: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  rightSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
