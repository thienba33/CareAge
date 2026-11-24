import { Skeleton } from "../common";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { METRIC_ICON, METRIC_LABEL, METRIC_UNIT } from "../../constants/healthMetric";
import type { HealthMetric, MetricType } from "../../types/health";
import { getLatestMetricByType } from "../../utils/dashboard";
import { daysFromToday, relativeDayText } from "../../utils/date";
import { formatMetricValue } from "../../utils/metric";

const QUICK_STAT_TYPES: MetricType[] = ["BLOOD_PRESSURE", "HEART_RATE", "SPO2"];
// Quá số ngày này thì giá trị không còn phản ánh hiện tại — hiện "Lâu chưa đo".
const STALE_AFTER_DAYS = 7;

type Props = {
  metrics: HealthMetric[];
  now: Date;
  isLoading: boolean;
  onPress: () => void;
};

// Giá trị mới nhất của 3 chỉ số chính kèm thời điểm đo. Chỉ hiển thị số đo, không tự đánh giá cao/thấp.
export default function QuickStats({ metrics, now, isLoading, onPress }: Props) {
  return (
    <View style={styles.row}>
      {QUICK_STAT_TYPES.map((type) => {
        const latest = getLatestMetricByType(metrics, type);
        const measuredAt = latest ? new Date(latest.recordedAt) : null;
        const isStale = measuredAt ? -daysFromToday(measuredAt, now) > STALE_AFTER_DAYS : false;
        const whenText = measuredAt ? (isStale ? "Lâu chưa đo" : relativeDayText(measuredAt, now)) : "Chưa đo";

        return (
          <TouchableOpacity
            key={type}
            style={styles.card}
            activeOpacity={0.85}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={
              latest
                ? `${METRIC_LABEL[type]} ${formatMetricValue(latest.value)} ${METRIC_UNIT[type]}, đo ${relativeDayText(measuredAt!, now)}`
                : `${METRIC_LABEL[type]} chưa có số đo`
            }
          >
            <Ionicons name={METRIC_ICON[type]} size={20} color={colors.primary} />
            {isLoading ? (
              <Skeleton width={56} height={24} />
            ) : (
              <Text style={[styles.value, isStale && styles.staleValue]}>
                {latest ? formatMetricValue(latest.value) : "--"}
              </Text>
            )}
            <Text style={styles.label}>
              {METRIC_LABEL[type]} <Text style={styles.unit}>({METRIC_UNIT[type]})</Text>
            </Text>
            {isLoading ? null : <Text style={[styles.when, isStale && styles.whenStale]}>{whenText}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  staleValue: { color: colors.textMuted },
  label: { fontSize: typography.caption, color: colors.textMuted, textAlign: "center" },
  unit: { fontSize: 12 },
  when: { fontSize: typography.caption, fontWeight: "600", color: colors.text },
  whenStale: { color: colors.textMuted, fontWeight: "400" },
});
