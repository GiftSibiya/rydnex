import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "@/backend";
import Colors, { GREEN, GREEN_DARK } from "@/constants/colors";

const C = Colors.dark;

export default function registerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
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

      if ("requiresOtp" in response && response.requiresOtp && response.userId) {
        router.push({
          pathname: "/auth/register-otp-screen",
          params: {
            name: trimmedName,
            userId: String(response.userId),
            email: response.email ?? trimmedEmail,
            password,
          },
        });
        return;
      }

      if ("data" in response && response.data) {
        const userId = response.data.user?.id;
        if (!userId) {
          setFormError(response.message ?? "Registration succeeded but verification context is missing.");
          return;
        }
        router.push({
          pathname: "/auth/register-otp-screen",
          params: {
            name: trimmedName,
            userId: String(userId),
            email: response.data.user.email ?? trimmedEmail,
            password,
          },
        });
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>

        {/* Step indicator */}
        <Animated.View style={[styles.stepRow, { opacity: headerOpacity }]}>
          <View style={styles.stepPill}>
            <View style={styles.stepDotActive} />
            <View style={styles.stepDotInactive} />
          </View>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
        </Animated.View>

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
            <Feather name="user-plus" size={20} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Join rydnex — your vehicle logbook</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[styles.form, { opacity: formOpacity, transform: [{ translateY: formY }] }]}
        >
          {/* Name */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputRow, errors.name ? styles.inputError : null]}>
              <Feather name="user" size={16} color={C.textSubtle} />
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={C.textSubtle}
                value={name}
                onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
            {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
          </View>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputRow, errors.email ? styles.inputError : null]}>
              <Feather name="mail" size={16} color={C.textSubtle} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textSubtle}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
              <Feather name="lock" size={16} color={C.textSubtle} />
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={C.textSubtle}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} activeOpacity={0.7}>
                <Feather name={showPass ? "eye-off" : "eye"} size={16} color={C.textSubtle} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

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
          <Text style={styles.securityText}>Your data stays on your device. No cloud sync yet.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  stepDotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  stepDotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.surfaceBorder,
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
  },
  form: { gap: 16 },
  inputWrap: { gap: 6 },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputError: { borderColor: C.danger },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.danger,
    marginTop: -2,
  },
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
