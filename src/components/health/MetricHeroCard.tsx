import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { METRIC_ICON } from "../../constants/healthMetric";
import type { HealthMetric, MetricType } from "../../types/health";
import { cleanDeviceName, formatMetricValue } from "../../utils/metric";
import { formatDateTime } from "../../utils/date";

type Props = {
  type: MetricType;
  latest: HealthMetric | null;
  unit: string;
  facilityMap: Map<string, string>;
  isAbnormal: boolean;
};

export default function MetricHeroCard({
  type,
  latest,
  unit,
  facilityMap,
  isAbnormal,
}: Props) {
  const sourceLabel = latest
    ? latest.source === "HOSPITAL"
      ? facilityMap.get(latest.appointmentId ?? "") ?? "Bệnh viện"
      : cleanDeviceName(latest.deviceName)
    : "";

  return (
    <View style={styles.card}>
      <View style={styles.main}>
        <View style={styles.leftCol}>
          <Text style={styles.sectionTag}>LẦN ĐO GẦN NHẤT</Text>

          <View style={styles.valueRow}>
            <Text style={styles.value}>
              {latest ? formatMetricValue(latest.value) : "--"}
            </Text>
            <Text style={styles.unit}> {latest ? latest.unit : unit}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {latest ? `${formatDateTime(latest.recordedAt)} · ${sourceLabel}` : "Chưa có dữ liệu đo"}
            </Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <View
            style={[
              styles.iconCircle,
              isAbnormal ? styles.iconCircleDanger : styles.iconCircleNormal,
            ]}
          >
            <Ionicons
              name={METRIC_ICON[type]}
              size={26}
              color={isAbnormal ? colors.danger : colors.primary}
            />
          </View>

          {latest ? (
            <View
              style={[
                styles.statusPill,
                isAbnormal ? styles.statusPillDanger : styles.statusPillNormal,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isAbnormal ? styles.statusDotDanger : styles.statusDotNormal,
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  isAbnormal ? styles.statusPillTextDanger : styles.statusPillTextNormal,
                ]}
              >
                {isAbnormal ? "Cần chú ý" : "Bình thường"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: 2,
  },
  value: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    flexShrink: 1,
  },
  rightCol: {
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleNormal: {
    backgroundColor: colors.primaryLight,
  },
  iconCircleDanger: {
    backgroundColor: colors.dangerLight,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillNormal: {
    backgroundColor: colors.primaryLight,
  },
  statusPillDanger: {
    backgroundColor: colors.dangerLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotNormal: {
    backgroundColor: colors.primary,
  },
  statusDotDanger: {
    backgroundColor: colors.danger,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusPillTextNormal: {
    color: colors.primaryDark,
  },
  statusPillTextDanger: {
    color: colors.danger,
  },
});
