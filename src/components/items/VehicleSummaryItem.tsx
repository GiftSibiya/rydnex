import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";
import { getCarLogo } from "@/constants/carLogos";
import { STATUS_BG, STATUS_COLOR, STATUS_LABEL } from "@/constants/Constants";
import { LastCheck, LicenseDisk, PartRule, Vehicle } from "@/contexts/VehicleContext";

const C = Colors.dark;

const CHECK_FIELDS = ["oil", "tyrePressure", "coolant", "spareWheel", "lights"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getDiskDaysLeft(disk: LicenseDisk | undefined): number | null {
  if (!disk?.expiryDate) return null;
  return Math.ceil((new Date(disk.expiryDate).getTime() - Date.now()) / 86400000);
}

export function getNextService(rules: PartRule[], odo: number) {
  if (!rules.length) return null;
  return rules
    .map((r) => ({ name: r.partName, kmLeft: r.lastReplacedKm + r.intervalKm - odo }))
    .sort((a, b) => a.kmLeft - b.kmLeft)[0];
}

export type StatusLevel = "good" | "warn" | "danger" | "unknown";

export function getStatusLevel(
  v: Vehicle,
  disk: LicenseDisk | undefined,
  rules: PartRule[],
  checks: LastCheck | undefined
): StatusLevel {
  const days = getDiskDaysLeft(disk);
  if (days !== null && days < 0) return "danger";
  const overdueRules = rules.filter((r) => {
    const km = v.currentOdometer - r.lastReplacedKm;
    const d = Math.floor((Date.now() - new Date(r.lastReplacedDate).getTime()) / 86400000);
    return km >= r.intervalKm || d >= r.intervalDays;
  });
  if (overdueRules.length > 0) return "danger";
  if (days !== null && days <= 30) return "warn";
  const overdueChecks = CHECK_FIELDS.filter((f) => {
    const d = checks?.[f];
    if (!d) return false;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000) > 14;
  });
  if (overdueChecks.length > 0) return "warn";
  if (!disk && !rules.length) return "unknown";
  return "good";
}

// ─── Props ───────────────────────────────────────────────────────────────────

export type VehicleSummaryItemProps = {
  vehicle: Vehicle;
  disk?: LicenseDisk;
  rules?: PartRule[];
  checks?: LastCheck;
  isActive?: boolean;
  onPress: () => void;
  variant?: "full" | "small";
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function VehicleSummaryItem({
  vehicle: v,
  disk,
  rules = [],
  checks,
  isActive = false,
  onPress,
  variant = "full",
}: VehicleSummaryItemProps) {
  const status = getStatusLevel(v, disk, rules, checks);
  const statusColor = STATUS_COLOR[status];
  const statusBg = STATUS_BG[status];
  const diskDays = getDiskDaysLeft(disk);
  const diskExpired = diskDays !== null && diskDays < 0;
  const diskSoon = diskDays !== null && diskDays >= 0 && diskDays <= 30;
  const nextSvc = getNextService(rules, v.currentOdometer);
  const overdueChecks = CHECK_FIELDS.filter((f) => {
    const d = checks?.[f];
    if (!d) return false;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000) > 14;
  });

  const logo = getCarLogo(v.make);
  const isSmall = variant === "small";

  return (
    <View style={[styles.card, isActive && !isSmall && styles.cardActive, isSmall && styles.cardSmall]}>
      {/* Active indicator bar (full only) */}
      {isActive && !isSmall && <View style={styles.cardActiveLine} />}

      {/* Card header */}
      <View style={[styles.cardHeader, isSmall && styles.cardHeaderSmall]}>
        {/* Logo + status ring */}
        <View style={[
          styles.logoRing,
          { borderColor: statusColor, shadowColor: statusColor },
          isSmall && styles.logoRingSmall,
        ]}>
          <View style={[styles.logoBg, { backgroundColor: statusBg }, isSmall && styles.logoBgSmall]}>
            {logo ? (
              <Image source={logo} style={[styles.logoImg, isSmall && styles.logoImgSmall]} resizeMode="contain" />
            ) : (
              <Feather name="truck" size={isSmall ? 16 : 22} color={statusColor} />
            )}
          </View>
        </View>

        {/* Make / model info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardMake, isSmall && styles.cardMakeSmall]} numberOfLines={1}>
            {v.year} {v.make}
          </Text>
          <Text style={[styles.cardModel, isSmall && styles.cardModelSmall]} numberOfLines={1}>
            {v.model}{v.trim ? ` ${v.trim}` : ""}
          </Text>
          {!isSmall && v.color ? <Text style={styles.cardColor}>{v.color}</Text> : null}
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusColor}40` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.sep} />

      {/* Stats row */}
      <View style={[styles.statsRow, isSmall && styles.statsRowSmall]}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Odometer</Text>
          <Text style={[styles.statValue, isSmall && styles.statValueSmall]}>{v.currentOdometer.toLocaleString()}</Text>
          <Text style={styles.statUnit}>km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Registration</Text>
          <Text style={[styles.statValue, isSmall && styles.statValueSmall]} numberOfLines={1}>{v.registration || "—"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Year</Text>
          <Text style={[styles.statValue, isSmall && styles.statValueSmall]}>{v.year}</Text>
        </View>
      </View>

      {/* Status items — full variant only */}
      {!isSmall && (
        <>
          <View style={styles.sep} />
          <View style={styles.statusItems}>
            {/* Service */}
            <View style={styles.statusItem}>
              <View style={[
                styles.statusItemIcon,
                nextSvc && nextSvc.kmLeft <= 0 && { backgroundColor: "rgba(231,76,60,0.1)" },
              ]}>
                <Feather
                  name="tool"
                  size={12}
                  color={nextSvc && nextSvc.kmLeft <= 0 ? C.danger : C.tint}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusItemLabel}>Next Service</Text>
                <Text style={[
                  styles.statusItemValue,
                  nextSvc && nextSvc.kmLeft <= 0 && { color: C.danger },
                ]}>
                  {nextSvc
                    ? nextSvc.kmLeft <= 0
                      ? `${nextSvc.name} — Overdue`
                      : `${nextSvc.kmLeft.toLocaleString()} km · ${nextSvc.name}`
                    : "No rules set"}
                </Text>
              </View>
            </View>

            {/* License disk */}
            <View style={styles.statusItem}>
              <View style={[
                styles.statusItemIcon,
                diskExpired && { backgroundColor: "rgba(231,76,60,0.1)" },
                diskSoon && !diskExpired && { backgroundColor: "rgba(243,156,18,0.1)" },
              ]}>
                <Feather
                  name="file-text"
                  size={12}
                  color={diskExpired ? C.danger : diskSoon ? C.warning : C.tint}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusItemLabel}>License Disk</Text>
                <Text style={[
                  styles.statusItemValue,
                  diskExpired && { color: C.danger },
                  diskSoon && !diskExpired && { color: C.warning },
                ]}>
                  {disk
                    ? diskExpired
                      ? "Expired"
                      : diskSoon
                      ? `Expires in ${diskDays} day${diskDays !== 1 ? "s" : ""}`
                      : `Valid · expires ${disk.expiryDate}`
                    : "Not captured"}
                </Text>
              </View>
            </View>

            {/* Health checks */}
            <View style={styles.statusItem}>
              <View style={[
                styles.statusItemIcon,
                overdueChecks.length > 0 && { backgroundColor: "rgba(243,156,18,0.1)" },
              ]}>
                <Feather
                  name="shield"
                  size={12}
                  color={overdueChecks.length > 0 ? C.warning : C.tint}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusItemLabel}>Health Checks</Text>
                <Text style={[
                  styles.statusItemValue,
                  overdueChecks.length > 0 && { color: C.warning },
                ]}>
                  {overdueChecks.length === 0
                    ? "All checks up to date"
                    : `${overdueChecks.length} check${overdueChecks.length > 1 ? "s" : ""} overdue`}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Footer CTA */}
      <TouchableOpacity
        style={[styles.cardFooter, isSmall && styles.cardFooterSmall]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.cardFooterText}>{isSmall ? "View Details" : "View Full Details"}</Text>
        <Feather name="chevron-right" size={13} color={C.tint} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Card base
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  cardActive: {
    borderColor: "rgba(46,204,113,0.35)",
    backgroundColor: "#0E1610",
  },
  cardSmall: {
    borderRadius: 16,
  },
  cardActiveLine: {
    height: 3,
    backgroundColor: C.tint,
    borderRadius: 3,
  },

  // Card header
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  cardHeaderSmall: {
    padding: 12,
    paddingBottom: 10,
    alignItems: "center",
  },

  // Logo
  logoRing: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  logoRingSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  logoBg: {
    width: 50,
    height: 50,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBgSmall: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  logoImg: { width: 34, height: 34 },
  logoImgSmall: { width: 24, height: 24 },

  // Info
  cardInfo: { flex: 1, paddingTop: 2 },
  cardMake: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  cardMakeSmall: { fontSize: 14 },
  cardModel: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  cardModelSmall: { fontSize: 12 },
  cardColor: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSubtle, marginTop: 3 },

  // Status badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  sep: { height: 1, backgroundColor: C.separator, marginHorizontal: 16 },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsRowSmall: {
    paddingVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 32, backgroundColor: C.separator },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text, textAlign: "center" },
  statValueSmall: { fontSize: 12 },
  statUnit: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 },

  // Status items (full only)
  statusItems: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
  statusItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(46,204,113,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusItemLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: C.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusItemValue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.text,
    marginTop: 1,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 10,
  },
  cardFooterSmall: {
    marginTop: 4,
    paddingVertical: 9,
  },
  cardFooterText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.tint },
});
