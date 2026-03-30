import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors, { GREEN, GREEN_DARK } from "../src/constants/colors";
import { useAuth } from "contexts/AuthContext";

const C = Colors.dark;

export default function SplashScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)");
      return;
    }
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(taglineAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(ctaAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [isLoggedIn]);

  if (isLoggedIn) return null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1F12", "#080C09", "#080C09"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={[styles.topDecor, { top: topPad + 20 }]}>
        <View style={styles.decorLine} />
        <View style={styles.decorDot} />
        <View style={styles.decorLine} />
      </View>

      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoAnim,
              transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            },
          ]}
        >
          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            style={styles.logoCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="navigation" size={36} color="#fff" />
          </LinearGradient>
          <View style={styles.logoGlow} />
        </Animated.View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: taglineAnim,
              transform: [{ translateY: taglineAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Text style={styles.appName}>rydnex</Text>
          <Text style={styles.tagline}>Your vehicle. Your history.{"\n"}Always in control.</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.features,
            {
              opacity: taglineAnim,
            },
          ]}
        >
          {[
            { icon: "book-open", text: "Full logbook tracking" },
            { icon: "bell", text: "Service reminders" },
            { icon: "activity", text: "Fuel efficiency metrics" },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon as any} size={13} color={C.tint} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.cta,
          { paddingBottom: botPad + 24, opacity: ctaAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/login")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            style={styles.loginBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.loginBtnText}>Get Started</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to our Terms of Service
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
  },
  topDecor: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  decorLine: {
    width: 48,
    height: 1,
    backgroundColor: "rgba(46,204,113,0.2)",
  },
  decorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(46,204,113,0.4)",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 28,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  logoGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(46,204,113,0.08)",
    zIndex: -1,
  },
  textBlock: {
    alignItems: "center",
    gap: 10,
  },
  appName: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  features: {
    gap: 10,
    alignSelf: "stretch",
    backgroundColor: "rgba(46,204,113,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.1)",
    padding: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(46,204,113,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  cta: {
    width: "100%",
    paddingHorizontal: 28,
    gap: 14,
    alignItems: "center",
  },
  loginBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loginBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.2,
  },
  terms: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    textAlign: "center",
  },
});
