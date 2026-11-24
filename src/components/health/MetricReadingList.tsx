import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import type { HealthMetric } from "../../types/health";
import { cleanDeviceName, formatMetricValue } from "../../utils/metric";
import { formatDateTime } from "../../utils/date";

type Props = {
  history: HealthMetric[];
  facilityMap: Map<string, string>;
  abnormalMetricIds: Set<string>;
};

export default function MetricReadingList({
  history,
  facilityMap,
  abnormalMetricIds,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Lịch sử đo gần đây</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{history.length} lần</Text>
        </View>
      </View>

      <View style={styles.card}>
        {history.map((m, i) => {
          const hasAlert = abnormalMetricIds.has(m.id);
          const sourceLabel =
            m.source === "HOSPITAL"
              ? facilityMap.get(m.appointmentId ?? "") ?? "Bệnh viện"
              : cleanDeviceName(m.deviceName);

          return (
            <View
              key={m.id}
              style={[styles.row, i === history.length - 1 && styles.rowLast]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.dot,
                    hasAlert ? styles.dotDanger : styles.dotNormal,
                  ]}
                />
                <View style={styles.textCol}>
                  <Text style={styles.value}>
                    {formatMetricValue(m.value)} <Text style={styles.unit}>{m.unit}</Text>
                  </Text>
                  <Text style={styles.meta}>
                    {formatDateTime(m.recordedAt)} · {sourceLabel}
                  </Text>
                </View>
              </View>

              {hasAlert ? (
                <View style={styles.alertTag}>
                  <Ionicons name="warning" size={13} color={colors.danger} />
                  <Text style={styles.alertTagText}>Cảnh báo</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    marginTop: 4,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotNormal: {
    backgroundColor: colors.primary,
  },
  dotDanger: {
    backgroundColor: colors.danger,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  unit: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  alertTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
  },
  alertTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.danger,
  },
});
