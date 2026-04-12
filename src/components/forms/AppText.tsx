import React, { useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

// ─── Variants ────────────────────────────────────────────────────────────────
/**
 * h1        30px Bold   — large auth / splash page titles
 * h2        26px Bold   — screen titles (profile, garage)
 * h3        24px Bold   — section hero titles
 * h4        22px Bold   — card/section sub-titles
 * title     17px Bold   — card names, display names
 * subtitle  15px Regular — supporting / description text below a title
 * body      15px Regular — general body copy
 * bodyMedium 15px Medium — menu row labels, list items
 * label     12px SemiBold uppercase — section separators, field labels
 * labelSmall 11px SemiBold uppercase — step indicators, compact labels
 * caption   13px Regular — footer notes, secondary info
 * hint      12px Regular — helper text below inputs
 * micro     11px Regular — version strings, fine-print
 * link      13px SemiBold tint — inline tappable links
 * error     13px Regular danger — inline validation / error messages
 */
export type AppTextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "title"
  | "subtitle"
  | "body"
  | "bodyMedium"
  | "label"
  | "labelSmall"
  | "caption"
  | "hint"
  | "micro"
  | "link"
  | "error";

type Props = {
  variant?: AppTextVariant;
  /**
   * Override the text color. Accepts either a key of AppThemeColors (e.g. "tint",
   * "danger", "textMuted") for a type-safe theme token, or any literal color string.
   */
  color?: keyof AppThemeColors | (string & {});
  align?: "left" | "center" | "right";
  numberOfLines?: number;
  /** When provided the text becomes tappable (wrapped in TouchableOpacity). */
  onPress?: () => void;
  activeOpacity?: number;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

export default function AppText({
  variant = "body",
  color,
  align,
  numberOfLines,
  onPress,
  activeOpacity = 0.65,
  style,
  children,
}: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  // Resolve color: theme key → token, literal string → as-is, undefined → variant default
  const resolvedColor: string | undefined = color
    ? color in C
      ? (C as unknown as Record<string, string>)[color as string]
      : (color as string)
    : undefined;

  const textStyle: StyleProp<TextStyle> = [
    styles[variant],
    align && { textAlign: align },
    resolvedColor && { color: resolvedColor },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={activeOpacity}>
        <Text style={textStyle} numberOfLines={numberOfLines}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// ─── Style map ───────────────────────────────────────────────────────────────
const createStyles = (C: AppThemeColors) =>
  StyleSheet.create<Record<AppTextVariant, TextStyle>>({
    h1: {
      fontSize: 30,
      fontFamily: "Inter_700Bold",
      color: C.text,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: C.text,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    h4: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    title: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: C.textMuted,
      lineHeight: 22,
    },
    body: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: C.text,
    },
    bodyMedium: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: C.text,
    },
    label: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: C.textMuted,
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    labelSmall: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: C.textMuted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    caption: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: C.textMuted,
    },
    hint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
    },
    micro: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
    },
    link: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: C.tint,
    },
    error: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: C.danger,
    },
  });
