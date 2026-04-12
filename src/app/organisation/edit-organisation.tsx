import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import LuxCard from "@/components/elements/LuxCard";
import { organisationService } from "@/backend/services/OrganisationService";
import { useAuth } from "@/contexts/AuthContext";
import useAuthStore from "@/stores/data/AuthStore";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
import { Organisation, OrgTier, ORG_TIER_LIMITS } from "@/types/Types";

const PRO_AMBER = "#F59E0B";

const TIERS: Array<{ tier: OrgTier; label: string; desc: string }> = [
  { tier: "bronze",   label: "Bronze",   desc: "Up to 10 vehicles" },
  { tier: "silver",   label: "Silver",   desc: "Up to 50 vehicles" },
  { tier: "gold",     label: "Gold",     desc: "Up to 100 vehicles" },
  { tier: "platinum", label: "Platinum", desc: "Unlimited vehicles" },
];

export default function EditOrganisationScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organisationId } = useAuth();
  const userId = useAuthStore((s) => s.user_id);

  const [org, setOrg] = useState<Organisation | null>(null);
  const [name, setName] = useState("");
  const [selectedTier, setSelectedTier] = useState<OrgTier>("bronze");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organisationService.fetchOwnedOrganisation(userId).then((fetched) => {
      if (fetched) {
        setOrg(fetched);
        setName(fetched.name);
        setSelectedTier(fetched.tier);
      }
      setLoading(false);
    });
  }, [userId]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Organisation name is required.");
      return;
    }
    if (!org) return;
    setSaving(true);
    setError(null);
    const newLimit = ORG_TIER_LIMITS[selectedTier];
    const result = await organisationService.updateOrganisation(org.id, {
      name: name.trim(),
      tier: selectedTier,
      vehicleLimit: newLimit,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Failed to save changes. Please try again.");
      return;
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  if (!org) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorMsg}>Organisation not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Join code display (read-only) */}
        <LuxCard style={styles.codeCard}>
          <View style={styles.codeRow}>
            <Feather name="key" size={16} color={C.tint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.codeLabel}>Join Code</Text>
              <Text style={styles.codeValue}>{org.join_code}</Text>
            </View>
            <Text style={styles.codeHint}>Share this with your drivers</Text>
          </View>
        </LuxCard>

        {/* Name field */}
        <AppLabeledInput
          label="Organisation Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Acme Fleet"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />

        {/* Tier selector */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Plan</Text>
          <LuxCard noPad>
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
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tierLabel, active && styles.tierLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.tierDesc}>{item.desc}</Text>
                    </View>
                    {item.tier === "platinum" && (
                      <Feather name="star" size={13} color={PRO_AMBER} />
                    )}
                  </TouchableOpacity>
                  {i < TIERS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })}
          </LuxCard>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (C: AppThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.background,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    errorMsg: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 60,
      gap: 20,
    },
    codeCard: {
      gap: 0,
    },
    codeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    codeLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    codeValue: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: C.tint,
      letterSpacing: 6,
      marginTop: 2,
    },
    codeHint: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      maxWidth: 80,
      textAlign: "right",
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
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(231,76,60,0.08)",
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: "rgba(231,76,60,0.2)",
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: C.danger,
    },
    btn: {
      backgroundColor: PRO_AMBER,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
  });
