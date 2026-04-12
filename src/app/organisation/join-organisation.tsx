import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { organisationService } from "@/backend/services/OrganisationService";
import { useAuth } from "@/contexts/AuthContext";
import useAuthStore from "@/stores/data/AuthStore";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

export default function JoinOrganisationScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { userEmail, userName } = useAuth();
  const userId = useAuthStore((s) => s.user_id);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrg, setSuccessOrg] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("Please enter the full 6-character code.");
      return;
    }
    setLoading(true);
    setError(null);

    const org = await organisationService.findOrgByJoinCode(trimmed);
    if (!org) {
      setLoading(false);
      setError("No organisation found with that code. Please check and try again.");
      return;
    }

    const result = await organisationService.submitJoinRequest({
      organisationId: org.id,
      userId,
      userName: userName ?? undefined,
      userEmail: userEmail ?? undefined,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Failed to send request. Please try again.");
      return;
    }
    setSuccessOrg(org.name);
  };

  if (successOrg) {
    return (
      <View style={[styles.screen, styles.successScreen]}>
        <View style={styles.successIcon}>
          <Feather name="check-circle" size={48} color={C.tint} />
        </View>
        <Text style={styles.successTitle}>Request Sent</Text>
        <Text style={styles.successDesc}>
          Your request to join{" "}
          <Text style={{ fontFamily: "Inter_700Bold", color: C.text }}>{successOrg}</Text>
          {" "}has been sent. You'll be able to see fleet vehicles once the admin approves you.
        </Text>
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
        <View style={styles.iconWrap}>
          <Feather name="link" size={32} color={C.tint} />
        </View>
        <Text style={styles.title}>Link to Organisation</Text>
        <Text style={styles.subtitle}>
          Enter the 6-character code provided by your fleet administrator.
        </Text>

        <View style={styles.codeFieldWrap}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor={C.textSubtle}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            keyboardType="default"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnText}>Send Request</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Your request will be reviewed by the organisation administrator before you gain access.
        </Text>
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
    successScreen: {
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 16,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(46,204,113,0.12)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.25)",
    },
    successTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    successDesc: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      textAlign: "center",
      lineHeight: 22,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: "rgba(46,204,113,0.1)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.2)",
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
    codeFieldWrap: {
      alignItems: "center",
    },
    codeInput: {
      width: "100%",
      backgroundColor: C.surfaceElevated,
      borderWidth: 1.5,
      borderColor: C.surfaceBorder,
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 16,
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: C.text,
      letterSpacing: 8,
      textAlign: "center",
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
      backgroundColor: C.tint,
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
    hint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      textAlign: "center",
      lineHeight: 18,
    },
  });
