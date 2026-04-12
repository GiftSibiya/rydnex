import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LuxCard from "@/components/elements/LuxCard";
import { organisationService } from "@/backend/services/OrganisationService";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";
import { OrgJoinRequest } from "@/types/Types";

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function OrganisationRequestsScreen() {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { organisationId } = useAuth();

  const [requests, setRequests] = useState<OrgJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!organisationId) return;
    const data = await organisationService.listPendingRequests(organisationId);
    setRequests(data);
  }, [organisationId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchRequests();
      setLoading(false);
    })();
  }, [fetchRequests]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleApprove = async (req: OrgJoinRequest) => {
    setProcessingId(req.id);
    const result = await organisationService.approveRequest(req.id);
    setProcessingId(null);
    if (result.success) {
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    }
  };

  const handleReject = async (req: OrgJoinRequest) => {
    setProcessingId(req.id);
    const result = await organisationService.rejectRequest(req.id);
    setProcessingId(null);
    if (result.success) {
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.tint} />}
    >
      <Text style={styles.pageTitle}>Join Requests</Text>
      <Text style={styles.pageSubtitle}>
        Review requests from drivers who want to join your organisation.
      </Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.tint} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Feather name="inbox" size={32} color={C.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptyDesc}>
            Share your join code with drivers and their requests will appear here.
          </Text>
        </View>
      ) : (
        <LuxCard noPad>
          {requests.map((req, i) => (
            <React.Fragment key={req.id}>
              <View style={styles.requestRow}>
                <View style={styles.avatar}>
                  <Feather name="user" size={18} color={C.tint} />
                </View>
                <View style={styles.reqInfo}>
                  <Text style={styles.reqName}>{req.user_name ?? "Unknown User"}</Text>
                  {req.user_email ? (
                    <Text style={styles.reqEmail}>{req.user_email}</Text>
                  ) : null}
                  <Text style={styles.reqDate}>Requested {formatDate(req.created_at)}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    activeOpacity={0.8}
                    onPress={() => handleApprove(req)}
                    disabled={processingId === req.id}
                  >
                    {processingId === req.id ? (
                      <ActivityIndicator size="small" color={C.tint} />
                    ) : (
                      <Feather name="check" size={16} color={C.tint} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    activeOpacity={0.8}
                    onPress={() => handleReject(req)}
                    disabled={processingId === req.id}
                  >
                    <Feather name="x" size={16} color={C.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              {i < requests.length - 1 && <View style={styles.divider} />}
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
    requestRow: {
      flexDirection: "row",
      alignItems: "center",
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
    reqInfo: {
      flex: 1,
      gap: 2,
    },
    reqName: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: C.text,
    },
    reqEmail: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: C.textSubtle,
    },
    reqDate: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: C.textMuted,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    approveBtn: {
      backgroundColor: "rgba(46,204,113,0.08)",
      borderColor: "rgba(46,204,113,0.25)",
    },
    rejectBtn: {
      backgroundColor: "rgba(231,76,60,0.08)",
      borderColor: "rgba(231,76,60,0.2)",
    },
    divider: {
      height: 1,
      backgroundColor: C.separator,
      marginHorizontal: 16,
    },
  });
