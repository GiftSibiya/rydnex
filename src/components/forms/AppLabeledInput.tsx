import { Feather } from "@expo/vector-icons";
import React, { ComponentProps, useMemo, useState } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type FeatherName = ComponentProps<typeof Feather>["name"];

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;

  // Input config
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;

  // Decorators
  /** Leading Feather icon (only shown in 'outlined' variant) */
  icon?: FeatherName;
  /** Enables secure-entry toggle */
  secure?: boolean;

  // States
  /** Shows red border and error text below the input */
  error?: string;
  /** Subtle hint text shown below the input */
  hint?: string;

  /**
   * outlined — standalone bordered input row (default).
   *            Used in auth screens, org screens, etc.
   * flat     — no border row; used inside a LuxCard / bordered card.
   *            Adds card-item padding and a smaller label style.
   */
  variant?: "outlined" | "flat";

  /** Extra styles applied to the outermost wrapper View */
  style?: StyleProp<ViewStyle>;
};

export default function AppLabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "none",
  autoComplete,
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  editable = true,
  multiline,
  numberOfLines,
  icon,
  secure,
  error,
  hint,
  variant = "outlined",
  style,
}: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const [showText, setShowText] = useState(false);

  const isFlat = variant === "flat";

  return (
    <View style={[isFlat ? styles.flatWrap : styles.outlinedWrap, style]}>
      {/* Label */}
      <Text style={isFlat ? styles.flatLabel : styles.outlinedLabel}>
        {label}
      </Text>

      {/* Input row */}
      {isFlat ? (
        <View style={styles.flatRow}>
          <TextInput
            style={styles.flatInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.textSubtle}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            editable={editable}
            secureTextEntry={secure && !showText}
            multiline={multiline}
            numberOfLines={numberOfLines}
          />
          {secure && (
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowText((v) => !v)}
              activeOpacity={0.7}
            >
              <Feather
                name={showText ? "eye-off" : "eye"}
                size={16}
                color={C.textSubtle}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.outlinedRow,
            !!error && styles.outlinedRowError,
            !editable && styles.outlinedRowDisabled,
          ]}
        >
          {icon && <Feather name={icon} size={16} color={C.textSubtle} />}
          <TextInput
            style={styles.outlinedInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.textSubtle}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            editable={editable}
            secureTextEntry={secure && !showText}
            multiline={multiline}
            numberOfLines={numberOfLines}
          />
          {secure && (
            <TouchableOpacity
              onPress={() => setShowText((v) => !v)}
              activeOpacity={0.7}
            >
              <Feather
                name={showText ? "eye-off" : "eye"}
                size={16}
                color={C.textSubtle}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error text */}
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Hint text (only when no error) */}
      {!error && !!hint && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const createStyles = (C: AppThemeColors) =>
  StyleSheet.create({
    /* ── outlined variant ─────────────────────────────────── */
    outlinedWrap: {
      gap: 6,
    },
    outlinedLabel: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: C.textMuted,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    outlinedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.surfaceBorder,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "android" ? 6 : 14,
    },
    outlinedRowError: {
      borderColor: C.danger,
    },
    outlinedRowDisabled: {
      opacity: 0.55,
    },
    outlinedInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: C.text,
      paddingVertical: Platform.OS === "android" ? 6 : 0,
      includeFontPadding: false,
    },

    /* ── flat variant ─────────────────────────────────────── */
    flatWrap: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 6,
    },
    flatLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: C.textSubtle,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    flatRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    flatInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: C.text,
      paddingVertical: Platform.OS === "android" ? 4 : 0,
      includeFontPadding: false,
    },
    eyeBtn: {
      paddingLeft: 8,
    },

    /* ── shared ───────────────────────────────────────────── */
    errorText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.danger,
    },
    hintText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
    },
  });
