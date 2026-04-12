import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import LuxCard from "@/components/elements/LuxCard";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
import { OrgTier, ORG_TIER_LIMITS } from "@/types/Types";

const { height } = Dimensions.get("window");

const PRO_AMBER = "#F59E0B";

const TIERS: Array<{ tier: OrgTier; label: string; desc: string; icon: string }> = [
  { tier: "bronze", label: "Bronze", desc: "Up to 10 vehicles", icon: "layers" },
  { tier: "silver", label: "Silver", desc: "Up to 50 vehicles", icon: "layers" },
  { tier: "gold",   label: "Gold",   desc: "Up to 100 vehicles", icon: "layers" },
  { tier: "platinum", label: "Platinum", desc: "Unlimited vehicles", icon: "star" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (tier: OrgTier) => void;
};

export default function UpgradeProModal({ visible, onClose, onConfirm }: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const [selectedTier, setSelectedTier] = useState<OrgTier>("bronze");

  const translateY = useSharedValue(height);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : height, { damping: 20, stiffness: 50 });
  }, [visible]);

  const handleClose = () => {
    translateY.value = withTiming(height, { duration: 280 }, () => {
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100) {
        translateY.value = withTiming(height, { duration: 280 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, animatedStyle]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.title}>Upgrade to Pro</Text>
            <Text style={styles.subtitle}>
              Create an organisation and manage your entire fleet from one place.
            </Text>
          </View>

          {/* Tier list */}
          <LuxCard noPad style={styles.tierCard}>
            {TIERS.map((item, i) => {
              const active = selectedTier === item.tier;
              return (
                <React.Fragment key={item.tier}>
                  <TouchableOpacity
                    style={styles.tierRow}
                    activeOpacity={0.75}
                    onPress={() => setSelectedTier(item.tier)}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierLabel, active && styles.tierLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.tierDesc}>{item.desc}</Text>
                    </View>
                    {item.tier === "platinum" && (
                      <Feather name="star" size={14} color={PRO_AMBER} />
                    )}
                  </TouchableOpacity>
                  {i < TIERS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })}
          </LuxCard>

          {/* Confirm */}
          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.85}
            onPress={() => onConfirm(selectedTier)}
          >
            <Text style={styles.confirmText}>Upgrade to {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}</Text>
          </TouchableOpacity>

          <Text style={styles.finePrint}>
            Contact your administrator to manage billing and permissions.
          </Text>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const createStyles = (C: AppThemeColors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: C.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 40,
      paddingTop: 12,
      gap: 16,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.surfaceBorder,
      alignSelf: "center",
      marginBottom: 4,
    },
    header: {
      alignItems: "center",
      gap: 8,
    },
    proBadge: {
      backgroundColor: "rgba(245,158,11,0.12)",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.35)",
    },
    proBadgeText: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: PRO_AMBER,
      letterSpacing: 1,
    },
    title: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    subtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      textAlign: "center",
      lineHeight: 20,
    },
    tierCard: {
      overflow: "hidden",
    },
    tierRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: C.surfaceBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: {
      borderColor: PRO_AMBER,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: PRO_AMBER,
    },
    tierInfo: {
      flex: 1,
    },
    tierLabel: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: C.textMuted,
    },
    tierLabelActive: {
      color: C.text,
    },
    tierDesc: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      marginTop: 1,
    },
    divider: {
      height: 1,
      backgroundColor: C.separator,
      marginHorizontal: 16,
    },
    confirmBtn: {
      backgroundColor: PRO_AMBER,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    confirmText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    finePrint: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      textAlign: "center",
    },
  });
