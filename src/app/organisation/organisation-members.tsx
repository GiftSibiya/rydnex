import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LuxCard from "@/components/elements/LuxCard";
import { organisationService } from "@/backend/services/OrganisationService";
import { useAuth } from "@/contexts/AuthContext";
import useAuthStore from "@/stores/data/AuthStore";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
import type { OrganisationMemberDisplay } from "@/types/Types";

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function OrganisationMembersScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { organisationId, userName, userEmail } = useAuth();
  const userId = useAuthStore((s) => s.user_id);

  const [members, setMembers] = useState<OrganisationMemberDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!organisationId) return;
    const org = await organisationService.fetchOwnedOrganisation(userId);
    if (!org) {
      setMembers([]);
      return;
    }
    const roster = await organisationService.fetchOrganisationMemberRoster(org, {
      name: userName?.trim() || "Organisation admin",
      email: userEmail,
    });
    setMembers(roster);
  }, [organisationId, userId, userName, userEmail]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMembers();
      setLoading(false);
    })();
  }, [fetchMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.tint} />}
    >
      <Text style={styles.pageTitle}>Organisation members</Text>
      <Text style={styles.pageSubtitle}>
        You and every driver with an approved link to your organisation.
      </Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.tint} />
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Feather name="users" size={32} color={C.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>No members yet</Text>
          <Text style={styles.emptyDesc}>
            Share your join code so drivers can request access. You will always appear here as the administrator.
          </Text>
        </View>
      ) : (
        <LuxCard noPad>
          {members.map((m, i) => (
            <React.Fragment key={`${m.user_id}-${m.role}`}>
              <View style={styles.memberRow}>
                <View style={styles.avatar}>
                  <Feather name={m.role === "admin" ? "shield" : "user"} size={18} color={C.tint} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.user_name ?? "Unknown user"}</Text>
                  {m.user_email ? <Text style={styles.memberEmail}>{m.user_email}</Text> : null}
                  <View style={styles.badgeRow}>
                    <View style={[styles.roleBadge, m.role === "admin" ? styles.badgeAdmin : styles.badgeDriver]}>
                      <Text style={[styles.roleBadgeText, m.role === "admin" ? styles.badgeAdminText : styles.badgeDriverText]}>
                        {m.role === "admin" ? "Administrator" : "Driver"}
                      </Text>
                    </View>
                    {m.role === "driver" && m.member_since ? (
                      <Text style={styles.sinceText}>Joined {formatDate(m.member_since)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
              {i < members.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </LuxCard>
      )}
    </ScrollView>
  );
}

const createStyles = (C: AppThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 80,
      gap: 16,
    },
    pageTitle: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: C.text,
    },
    pageSubtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      lineHeight: 20,
    },
    centered: {
      paddingVertical: 60,
      alignItems: "center",
    },
    emptyWrap: {
      paddingVertical: 60,
      alignItems: "center",
      gap: 12,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: C.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.surfaceBorder,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: C.text,
    },
    emptyDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
      textAlign: "center",
      lineHeight: 20,
      maxWidth: 280,
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(46,204,113,0.1)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(46,204,113,0.2)",
    },
    memberInfo: {
      flex: 1,
      gap: 4,
    },
    memberName: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: C.text,
    },
    memberEmail: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 2,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    badgeAdmin: {
      backgroundColor: "rgba(245,158,11,0.1)",
      borderColor: "rgba(245,158,11,0.35)",
    },
    badgeAdminText: {
      color: "#D97706",
    },
    badgeDriver: {
      backgroundColor: "rgba(46,204,113,0.08)",
      borderColor: "rgba(46,204,113,0.25)",
    },
    badgeDriverText: {
      color: C.tint,
    },
    roleBadgeText: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    sinceText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: C.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: C.separator,
      marginHorizontal: 16,
    },
  });
