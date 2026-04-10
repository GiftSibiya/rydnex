import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LuxCard from "@/components/elements/LuxCard";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicle } from "@/contexts/VehicleContext";
import ThemeStateStore, { ThemeMode } from "@/stores/state/ThemeStateStore";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type ComingSoonItemProps = {
  icon: string;
  title: string;
  description: string;
};

function ComingSoonItem({ icon, title, description }: ComingSoonItemProps) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  return (
    <TouchableOpacity style={styles.comingItem} activeOpacity={0.7}>
      <View style={styles.comingIcon}>
        <Feather name={icon as any} size={20} color={C.textSubtle} />
      </View>
      <View style={styles.comingInfo}>
        <View style={styles.comingTitleRow}>
          <Text style={styles.comingTitle}>{title}</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </View>
        <Text style={styles.comingDesc}>{description}</Text>
      </View>
      <Feather name="lock" size={14} color={C.textSubtle} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors: C } = useAppTheme();
  const { vehicles, FREE_TIER_LIMIT } = useVehicle();
  const { logout, userEmail, userName } = useAuth();
  const [mode, setMode] = useState<ThemeMode>(() => ThemeStateStore.getState().mode);
  const styles = useMemo(() => createStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;
  const themeOptions: Array<{ value: ThemeMode; label: string; icon: keyof typeof Feather.glyphMap }> = [
    { value: "system", label: "System", icon: "smartphone" },
    { value: "light", label: "Light", icon: "sun" },
    { value: "dark", label: "Dark", icon: "moon" },
  ];

  useEffect(() => {
    const unsubscribe = ThemeStateStore.subscribe((state) => {
      setMode((prev) => (prev === state.mode ? prev : state.mode));
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
          setTimeout(() => {
            router.replace("/auth/login-screen");
          }, 900);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Profile</Text>

      <LuxCard style={styles.accountCard}>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Feather name="user" size={26} color={C.tint} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{userName || userEmail || "Guest"}</Text>
            {userName ? <Text style={styles.accountEmail}>{userEmail}</Text> : null}
            <Text style={styles.accountSub}>rydnex personal</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push("/account/editAccountScreen")}
              activeOpacity={0.75}
            >
              <Feather name="edit-2" size={13} color={C.tint} />
            </TouchableOpacity>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          </View>
        </View>

        <View style={styles.usageMeter}>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Vehicles</Text>
            <Text style={styles.usageCount}>
              {vehicles.length} / {FREE_TIER_LIMIT}
            </Text>
          </View>
          <View style={styles.usageTrack}>
            <View style={[styles.usageFill, { width: `${(vehicles.length / FREE_TIER_LIMIT) * 100}%` as any }]} />
          </View>
        </View>
      </LuxCard>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Reminders</Text>
        <LuxCard noPad>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.75}
            onPress={() => router.push("/reminders")}
          >
            <View style={styles.menuIcon}>
              <Feather name="bell" size={16} color={C.tint} />
            </View>
            <Text style={styles.menuLabel}>Parts &amp; Service Reminders</Text>
            <Feather name="chevron-right" size={16} color={C.textSubtle} />
          </TouchableOpacity>
        </LuxCard>
      </View>

      {/* <View style={styles.section}>
        <Text style={styles.sectionLabel}>Coming Soon</Text>
        <LuxCard noPad>
          <ComingSoonItem
            icon="shield"
            title="Insurance Partner"
            description="Compare vehicle insurance quotes and manage policies directly in the app"
          />
          <View style={styles.divider} />
          <ComingSoonItem
            icon="tool"
            title="Mechanic Partner"
            description="Book certified mechanics, get quotes, and track your repairs in one place"
          />
          <View style={styles.divider} />
          <ComingSoonItem
            icon="trending-up"
            title="Vehicle Valuation"
            description="Real-time market value estimates for your vehicles"
          />
          <View style={styles.divider} />
          <ComingSoonItem
            icon="cloud"
            title="Cloud Backup"
            description="Sync your logbook and vehicle data across devices"
          />
          <View style={styles.divider} />
          <ComingSoonItem
            icon="users"
            title="Fleet Management"
            description="Track unlimited vehicles with advanced fleet analytics"
          />
        </LuxCard>
      </View> */}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <LuxCard>
          <View style={styles.themeRow}>
            {themeOptions.map((option) => {
              const active = mode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.themeOption, active && styles.themeOptionActive]}
                  activeOpacity={0.8}
                  onPress={() => ThemeStateStore.getState().setMode(option.value)}
                >
                  <Feather
                    name={option.icon}
                    size={14}
                    color={active ? C.tint : C.textMuted}
                  />
                  <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LuxCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>App</Text>
        <LuxCard noPad>
          {([
            { icon: "info", label: "About rydnex", danger: false },
            { icon: "star", label: "Rate the App", danger: false },
            { icon: "share-2", label: "Share with Friends", danger: false },
            { icon: "message-circle", label: "Feedback", danger: false },
            { icon: "log-out", label: "Sign Out", danger: true },
          ] as const).map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.75}
                onPress={item.danger ? handleLogout : undefined}
              >
                <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                  <Feather name={item.icon as any} size={16} color={item.danger ? C.danger : C.tint} />
                </View>
                <Text style={[styles.menuLabel, item.danger && { color: C.danger }]}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={C.textSubtle} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </LuxCard>
      </View>

      <Text style={styles.version}>rydnex v1.0.0 · Free Tier</Text>
    </ScrollView>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 20 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  accountCard: { gap: 16 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(46,204,113,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.25)",
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  accountEmail: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSubtle, marginTop: 1 },
  accountSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(46,204,113,0.1)",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  freeBadge: {
    backgroundColor: "rgba(46,204,113,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.25)",
  },
  freeBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: C.tint, letterSpacing: 0.5 },
  usageMeter: { gap: 8 },
  usageRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  usageLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textMuted },
  usageCount: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.text },
  usageTrack: {
    height: 4,
    backgroundColor: C.surfaceBorder,
    borderRadius: 2,
    overflow: "hidden",
  },
  usageFill: {
    height: 4,
    backgroundColor: C.tint,
    borderRadius: 2,
  },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: C.separator,
    marginHorizontal: 16,
  },
  comingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  comingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  comingInfo: { flex: 1, gap: 3 },
  comingTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  comingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textMuted },
  comingSoonBadge: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  comingSoonText: { fontSize: 9, fontFamily: "Inter_700Bold", color: C.textSubtle, letterSpacing: 0.5 },
  comingDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSubtle, lineHeight: 18 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(46,204,113,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: {
    backgroundColor: "rgba(231,76,60,0.08)",
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  themeRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  themeOptionActive: {
    borderColor: C.tint,
    backgroundColor: "rgba(46,204,113,0.14)",
  },
  themeOptionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
  },
  themeOptionTextActive: {
    color: C.tint,
  },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSubtle,
    textAlign: "center",
  },
});
