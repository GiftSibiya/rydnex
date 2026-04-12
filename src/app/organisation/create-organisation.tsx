import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { organisationService } from "@/backend/services/OrganisationService";
import { useAuth } from "@/contexts/AuthContext";
import useAuthStore from "@/stores/data/AuthStore";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
import { OrgTier, ORG_TIER_LIMITS } from "@/types/Types";

const PRO_AMBER = "#F59E0B";

const TIER_LABELS: Record<OrgTier, string> = {
  bronze: "Bronze — Up to 10 vehicles",
  silver: "Silver — Up to 50 vehicles",
  gold: "Gold — Up to 100 vehicles",
  platinum: "Platinum — Unlimited vehicles",
};

export default function CreateOrganisationScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tier: tierParam } = useLocalSearchParams<{ tier: string }>();
  const tier = (tierParam as OrgTier) ?? "bronze";
  const vehicleLimit = ORG_TIER_LIMITS[tier];

  const { organisationId } = useAuth();
  const userId = useAuthStore((s) => s.user_id);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Organisation name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await organisationService.createOrganisation({
      name: name.trim(),
      tier,
      ownerUserId: userId,
      vehicleLimit,
    });
    setSaving(false);
    if (!result.success || !result.data) {
      setError(result.error ?? "Failed to create organisation. Please try again.");
      return;
    }
    // Store the new org_id in AuthStore
    useAuthStore.getState().setOrganisationId(result.data.id);
    router.replace("/(tabs)/profile");
  };

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
        {/* Tier badge */}
        <View style={styles.tierBadge}>
          <Feather name="layers" size={14} color={PRO_AMBER} />
          <Text style={styles.tierBadgeText}>{TIER_LABELS[tier]}</Text>
        </View>

        <Text style={styles.title}>Name your organisation</Text>
        <Text style={styles.subtitle}>
          You'll share a 6-character join code with your drivers after creating the organisation.
        </Text>

        {/* Organisation name field */}
        <AppLabeledInput
          label="Organisation Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Acme Fleet"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          activeOpacity={0.85}
          onPress={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Organisation</Text>
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
    content: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 60,
      gap: 20,
    },
    tierBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      backgroundColor: "rgba(245,158,11,0.1)",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.3)",
    },
    tierBadgeText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: PRO_AMBER,
    },
    title: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      lineHeight: 22,
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
