/**
 * AppButton — universal button component for the rydnex app.
 *
 * Variants:   primary | secondary | ghost | danger | success | subtle
 * Sizes:      xs | sm | md | lg
 * Options:    leftIcon, rightIcon, loading, disabled, fullWidth, pill,
 *             gradient, sublabel, haptic
 *
 * Usage examples:
 *
 *   <AppButton label="Save" onPress={save} />
 *   <AppButton label="Delete" variant="danger" leftIcon="trash-2" />
 *   <AppButton label="Add Vehicle" rightIcon="plus" size="lg" gradient />
 *   <AppButton label="Cancel" variant="ghost" size="sm" />
 *   <AppButton label="Syncing…" loading />
 *   <AppButton label="Refuel" sublabel="Log fuel stop" leftIcon="droplet" variant="secondary" />
 *   <AppButton label="Done" pill fullWidth />
 */

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import Colors, { GREEN, GREEN_DARK } from "@/constants/colors";

const C = Colors.dark;

// ─── Types ──────────────────────────────────────────────────────────────────

export type AppButtonVariant =
  | "primary"   // green gradient fill
  | "secondary" // elevated surface fill
  | "ghost"     // transparent with tint border
  | "danger"    // red fill
  | "success"   // explicit green fill (no gradient)
  | "subtle";   // muted surface, no border — for low-emphasis actions

export type AppButtonSize = "xs" | "sm" | "md" | "lg";

export type AppButtonHaptic = "none" | "light" | "medium" | "heavy";

export type AppButtonProps = TouchableOpacityProps & {
  /** Button label text */
  label: string;
  /** Optional secondary label rendered below the main label */
  sublabel?: string;
  /** Visual style of the button */
  variant?: AppButtonVariant;
  /** Size preset */
  size?: AppButtonSize;
  /** Feather icon name to render on the left of the label */
  leftIcon?: React.ComponentProps<typeof Feather>["name"];
  /** Feather icon name to render on the right of the label */
  rightIcon?: React.ComponentProps<typeof Feather>["name"];
  /** Show a spinner and disable interaction */
  loading?: boolean;
  /** Stretch to parent width */
  fullWidth?: boolean;
  /** Fully rounded pill shape */
  pill?: boolean;
  /** Use gradient background (only affects `primary` variant) */
  gradient?: boolean;
  /** Haptic feedback intensity on press */
  haptic?: AppButtonHaptic;
};

// ─── Size tokens ─────────────────────────────────────────────────────────────

const SIZE_TOKENS = {
  xs: { height: 30, px: 12, radius: 8,  fontSize: 12, subFontSize: 10, iconSize: 13, gap: 5  },
  sm: { height: 38, px: 16, radius: 10, fontSize: 13, subFontSize: 11, iconSize: 14, gap: 6  },
  md: { height: 50, px: 20, radius: 13, fontSize: 15, subFontSize: 12, iconSize: 16, gap: 8  },
  lg: { height: 58, px: 24, radius: 15, fontSize: 16, subFontSize: 13, iconSize: 18, gap: 10 },
} as const;

// ─── Variant tokens ──────────────────────────────────────────────────────────

const VARIANT_TOKENS = {
  primary:   { bg: GREEN,           text: "#fff",    border: "transparent", borderWidth: 0 },
  secondary: { bg: C.surfaceElevated, text: C.text,  border: C.surfaceBorder, borderWidth: 1 },
  ghost:     { bg: "transparent",   text: C.tint,    border: C.tint,         borderWidth: 1 },
  danger:    { bg: C.danger,        text: "#fff",    border: "transparent",  borderWidth: 0 },
  success:   { bg: GREEN,           text: "#fff",    border: "transparent",  borderWidth: 0 },
  subtle:    { bg: C.surface,       text: C.textMuted, border: "transparent", borderWidth: 0 },
} as const;

// ─── Gradient config per variant ─────────────────────────────────────────────

const GRADIENT_COLORS: Partial<Record<AppButtonVariant, [string, string]>> = {
  primary: [GREEN, GREEN_DARK],
  danger:  [C.danger, "#9B2335"],
  success: [GREEN, GREEN_DARK],
};

// ─── Haptic helper ───────────────────────────────────────────────────────────

function triggerHaptic(level: AppButtonHaptic) {
  if (Platform.OS === "web" || level === "none") return;
  const map = {
    light:  Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy:  Haptics.ImpactFeedbackStyle.Heavy,
  } as const;
  Haptics.impactAsync(map[level]);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AppButton({
  label,
  sublabel,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  pill = false,
  gradient = false,
  haptic = "light",
  onPress,
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const tok = SIZE_TOKENS[size];
  const v   = VARIANT_TOKENS[variant];

  const isDisabled = disabled || loading;
  const useGradient = gradient && !!GRADIENT_COLORS[variant];
  const borderRadius = pill ? tok.height / 2 : tok.radius;

  const handlePress = (e: any) => {
    if (!isDisabled) triggerHaptic(haptic);
    onPress?.(e);
  };

  // ── Inner content ──────────────────────────────────────────────────────────
  const content = (
    <View style={[styles.inner, { gap: tok.gap }]}>
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {leftIcon && (
            <Feather name={leftIcon} size={tok.iconSize} color={v.text} />
          )}
          <View style={sublabel ? styles.labelStack : undefined}>
            <Text
              style={[styles.label, { fontSize: tok.fontSize, color: v.text }]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {sublabel && (
              <Text
                style={[styles.sublabel, { fontSize: tok.subFontSize, color: v.text }]}
                numberOfLines={1}
              >
                {sublabel}
              </Text>
            )}
          </View>
          {rightIcon && (
            <Feather name={rightIcon} size={tok.iconSize} color={v.text} />
          )}
        </>
      )}
    </View>
  );

  // ── Shell ──────────────────────────────────────────────────────────────────
  const shellStyle = [
    styles.shell,
    {
      height: sublabel ? tok.height + 12 : tok.height,
      paddingHorizontal: tok.px,
      borderRadius,
      backgroundColor: useGradient ? "transparent" : v.bg,
      borderColor: v.border,
      borderWidth: v.borderWidth,
    },
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  if (useGradient) {
    const [start, end] = GRADIENT_COLORS[variant]!;
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handlePress}
        disabled={isDisabled}
        style={[styles.gradientWrapper, { borderRadius }, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
        {...rest}
      >
        <LinearGradient
          colors={[start, end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.shell,
            {
              height: sublabel ? tok.height + 12 : tok.height,
              paddingHorizontal: tok.px,
              borderRadius,
            },
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={handlePress}
      disabled={isDisabled}
      style={shellStyle}
      {...rest}
    >
      {content}
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradientWrapper: {
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  labelStack: {
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  sublabel: {
    fontFamily: "Inter_400Regular",
    opacity: 0.7,
    marginTop: 1,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.45,
  },
});
