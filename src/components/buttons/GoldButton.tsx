import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type Props = TouchableOpacityProps & {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  small?: boolean;
};

export default function GoldButton({ label, variant = "primary", loading, small, onPress, style, disabled, ...rest }: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const handlePress = (e: any) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const bg = variant === "primary" ? C.tint : variant === "danger" ? C.danger : variant === "secondary" ? C.surfaceElevated : "transparent";
  const textColor = variant === "primary" ? "#fff" : variant === "danger" ? "#fff" : C.tint;
  const borderColor = variant === "ghost" ? C.tint : "transparent";

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor, borderWidth: variant === "ghost" ? 1 : 0 },
        small && styles.small,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator size="small" color={textColor} />
        : <Text style={[styles.label, { color: textColor }, small && styles.smallLabel]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  small: {
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  smallLabel: {
    fontSize: 13,
  },
});
