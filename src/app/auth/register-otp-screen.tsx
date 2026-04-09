import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "@/backend";
import Colors, { GREEN, GREEN_DARK } from "@/constants/colors";
import { AuthStore } from "@/stores/StoresIndex";

const C = Colors.dark;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function registerOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuthFromRegistration } = AuthStore();
  const { email, userId } = useLocalSearchParams<{ email: string; userId: string }>();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(18)).current;
  const boxesOpacity = useRef(new Animated.Value(0)).current;
  const boxesY = useRef(new Animated.Value(20)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(boxesOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(boxesY, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.timing(actionsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => inputRefs.current[0]?.focus(), 550);
    return () => clearTimeout(t);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, _b, c) => `${a}••••${c}`)
    : "";

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setError("Missing verification context. Please register again.");
      return;
    }
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const result = await authService.verifyRegistrationOtp(parsedUserId, code);
      if (!result.success) {
        setError(result.message ?? result.error ?? "Verification failed");
        return;
      }
      if (result.data) {
        setAuthFromRegistration(result.data);
      }
      router.replace("/(tabs)");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setError("Unable to resend code. Please register again.");
      return;
    }
    if (countdown > 0) return;
    setLoading(true);
    setError("");
    try {
      const result = await authService.resendRegistrationOtp(parsedUserId);
      if (!result.success) {
        setError(result.message ?? result.error ?? "Failed to resend code");
        return;
      }
      setCountdown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={[styles.inner, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={styles.stepPill}>
            <View style={styles.stepDotDone} />
            <View style={styles.stepDotActive} />
          </View>
          <Text style={styles.stepLabel}>Step 2 of 2</Text>
        </View>

        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
        >
          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            style={styles.logoMini}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="mail" size={20} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Verify email</Text>
          <Text style={styles.sub}>
            We sent a 6-digit code to{"\n"}
            <Text style={styles.emailHighlight}>{maskedEmail}</Text>
          </Text>
          <Text style={styles.hint}>Enter the 6-digit code to continue</Text>
        </Animated.View>

        {/* OTP Boxes */}
        <Animated.View
          style={[styles.boxesRow, { opacity: boxesOpacity, transform: [{ translateY: boxesY }] }]}
        >
          {digits.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.box,
                focusedIndex === i && styles.boxFocused,
                digit !== "" && styles.boxFilled,
                error ? styles.boxError : null,
              ]}
            >
              <TextInput
                ref={(ref) => { inputRefs.current[i] = ref; }}
                value={digit}
                onChangeText={(v) => handleDigitChange(v, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.boxInput, digit !== "" && styles.boxInputFilled]}
                selectionColor={GREEN}
              />
            </View>
          ))}
        </Animated.View>

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: actionsOpacity }]}>
          <TouchableOpacity
            style={[styles.verifyBtn, loading && { opacity: 0.7 }]}
            onPress={handleVerify}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={[GREEN, GREEN_DARK]}
              style={styles.verifyBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={styles.verifyBtnText}>Verifying…</Text>
              ) : (
                <>
                  <Text style={styles.verifyBtnText}>Verify & Continue</Text>
                  <Feather name="check" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive it? </Text>
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0} activeOpacity={0.7}>
              <Text style={[styles.resendLink, countdown > 0 && styles.resendLinkDisabled]}>
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    gap: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepPill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  stepDotDone: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
    opacity: 0.5,
  },
  stepDotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  header: {
    gap: 10,
  },
  logoMini: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    lineHeight: 22,
  },
  emailHighlight: {
    color: GREEN,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    marginTop: 2,
  },
  boxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1.5,
    borderColor: C.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFocused: {
    borderColor: GREEN,
    backgroundColor: "rgba(46,204,113,0.06)",
  },
  boxFilled: {
    borderColor: GREEN_DARK,
    backgroundColor: "rgba(46,204,113,0.08)",
  },
  boxError: {
    borderColor: C.danger,
  },
  boxInput: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.text,
  },
  boxInputFilled: {
    color: GREEN,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(231,76,60,0.1)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.2)",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.danger,
  },
  actions: {
    gap: 16,
  },
  verifyBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  verifyBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  verifyBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.1,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  resendLink: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  resendLinkDisabled: {
    color: C.textSubtle,
  },
});
