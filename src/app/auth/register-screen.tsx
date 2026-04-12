import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppLabeledInput from "@/components/forms/AppLabeledInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "@/backend";
import { GREEN, GREEN_DARK } from "@/constants/colors";
import { AuthStore } from "@/stores/StoresIndex";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
import {
  clearPendingRegistrationLogin,
  setPendingRegistrationLogin,
} from "@/utilities/registrationPendingLogin";

export default function registerScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const setAuthFromRegistration = AuthStore((s) => s.setAuthFromRegistration);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(18)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(24)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    clearPendingRegistrationLogin();
  }, []);

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(footerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!email.includes("@")) e.email = "Enter a valid email";
    if (!password.trim()) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    if (!passwordConfirm.trim()) e.passwordConfirm = "Please confirm your password";
    else if (passwordConfirm !== password) e.passwordConfirm = "Passwords do not match";
    return e;
  };

  const handleContinue = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setFormError("");
    setLoading(true);
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const response = await authService.register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (!response.success) {
        setFormError(response.message ?? response.error ?? "Registration failed. Please try again.");
        return;
      }

      if ("requiresOtp" in response && response.requiresOtp) {
        if (response.userId == null) {
          setFormError(
            response.message ??
              "We could not start email verification (missing user id). Please try again or contact support."
          );
          return;
        }
        setPendingRegistrationLogin({ email: response.email ?? trimmedEmail, password });
        router.push({
          pathname: "/auth/register-otp-screen",
          params: {
            userId: String(response.userId),
            email: response.email ?? trimmedEmail,
          },
        });
        return;
      }

      if ("data" in response && response.data) {
        setAuthFromRegistration(response.data);
        router.replace("/(tabs)");
        return;
      }

      setFormError(response.message ?? "Verification setup failed. Please try registering again.");
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Compact header row: back · icon · title */}
        <Animated.View
          style={[styles.headerRow, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>

          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            style={styles.logoMini}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="user-plus" size={17} color="#fff" />
          </LinearGradient>

          <Text style={styles.title} numberOfLines={1}>Create account</Text>
        </Animated.View>

        {/* Subtitle + step pill */}
        <Animated.View style={[styles.subRow, { opacity: headerOpacity }]}>
          <View style={styles.stepPill}>
            <View style={styles.stepDotActive} />
            <View style={styles.stepDotInactive} />
            <Text style={styles.stepLabel}>1 of 2</Text>
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[styles.form, { opacity: formOpacity, transform: [{ translateY: formY }] }]}
        >
          {/* Name */}
          <AppLabeledInput
            label="Full Name"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
            placeholder="Your full name"
            icon="user"
            autoCapitalize="words"
            autoComplete="name"
            error={errors.name}
          />

          {/* Email */}
          <AppLabeledInput
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
            placeholder="you@example.com"
            icon="mail"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            error={errors.email}
          />

          {/* Password */}
          <AppLabeledInput
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((e) => ({ ...e, password: undefined, passwordConfirm: undefined }));
            }}
            placeholder="Min. 6 characters"
            icon="lock"
            secure
            autoCapitalize="none"
            error={errors.password}
          />

          <AppLabeledInput
            label="Confirm password"
            value={passwordConfirm}
            onChangeText={(t) => {
              setPasswordConfirm(t);
              setErrors((e) => ({ ...e, passwordConfirm: undefined }));
            }}
            placeholder="Re-enter your password"
            icon="lock"
            secure
            autoCapitalize="none"
            error={errors.passwordConfirm}
          />

          <TouchableOpacity
            style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={[GREEN, GREEN_DARK]}
              style={styles.continueBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={styles.continueBtnText}>Sending code...</Text>
              ) : (
                <>
                  <Text style={styles.continueBtnText}>Continue</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {formError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.securityNote}>
          <Feather name="shield" size={13} color={C.textSubtle} />
          
          <Text style={styles.securityText}>Your data is stored securely on our servers.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: {
    paddingHorizontal: 28,
    gap: 24,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stepPill: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  stepDotActive: {
    width: 16,
    height: 5,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  stepDotInactive: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.surfaceBorder,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginLeft: 2,
  },
  logoMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  form: { gap: 16 },
  continueBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  continueBtnDisabled: {
    opacity: 0.75,
  },
  continueBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.1,
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
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  footerLink: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    textAlign: "center",
  },
});
