import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors, { GREEN, GREEN_DARK } from "../src/constants/colors";
import { useAuth } from "contexts/AuthContext";

const C = Colors.dark;

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}
      bottomOffset={24}
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

      <View style={styles.header}>
        <LinearGradient
          colors={[GREEN, GREEN_DARK]}
          style={styles.logoMini}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="navigation" size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your rydnex account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={[styles.inputRow, error && styles.inputError]}>
            <Feather name="mail" size={16} color={C.textSubtle} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={C.textSubtle}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={[styles.inputRow, error && styles.inputError]}>
            <Feather name="lock" size={16} color={C.textSubtle} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={C.textSubtle}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} activeOpacity={0.7}>
              <Feather name={showPass ? "eye-off" : "eye"} size={16} color={C.textSubtle} />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            style={styles.loginBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <Text style={styles.loginBtnText}>Signing in…</Text>
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Feather name="user" size={16} color={C.tint} />
          <Text style={styles.guestBtnText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.footerLink}>Create one</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.securityNote}>
        <Feather name="shield" size={13} color={C.textSubtle} />
        <Text style={styles.securityText}>Your data stays on your device. No cloud sync yet.</Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: {
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
  loginBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.surfaceBorder,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    paddingVertical: 14,
    backgroundColor: C.surfaceElevated,
  },
  guestBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
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
