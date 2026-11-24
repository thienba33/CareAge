import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, typography } from "../../theme/colors";
import { METRIC_ICON, METRIC_ICON_COLOR, METRIC_LABEL, METRIC_TYPES, METRIC_UNIT } from "../../constants/healthMetric";
import type { HealthMetric, MetricType, MetricValue } from "../../types/health";
import { formatMetricValue, isBloodPressure } from "../../utils/metric";
import { formatFeedTime, formatShortDate, isSameDay } from "../../utils/date";

type Props = {
  metrics: HealthMetric[];
  now: Date;
};

// So sánh 2 giá trị cùng loại để hiện mũi tên xu hướng (chỉ tham khảo, không chẩn đoán).
// Với huyết áp, so sánh theo tâm thu.
function compareValues(current: MetricValue, previous: MetricValue): "up" | "down" | "flat" {
  const c = isBloodPressure(current) ? current.systolic : current;
  const p = isBloodPressure(previous) ? previous.systolic : previous;
  if (c > p) return "up";
  if (c < p) return "down";
  return "flat";
}

// "Chỉ số hôm nay" (lưới ô chỉ số được đo trong ngày hôm nay, bấm để xem biểu đồ) + nút "Lịch sử kiểm tra chỉ số".
// Dùng chung cho tab Sức khỏe và màn Hồ sơ bệnh nhân của bác sĩ.
export default function VitalsOverview({ metrics, now }: Props) {
  const navigation = useNavigation<any>();

  const todayByType = useMemo(() => {
    const map = new Map<MetricType, { latest: HealthMetric; previous?: HealthMetric }>();
    for (const type of METRIC_TYPES) {
      const readings = metrics
        .filter((m) => m.type === type && isSameDay(new Date(m.recordedAt), now))
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
      if (readings.length > 0) {
        map.set(type, { latest: readings[0], previous: readings[1] });
      }
    }
    return map;
  }, [metrics, now]);

  // Dòng phụ của nút "Lịch sử kiểm tra chỉ số": giờ đo mới nhất trong lịch sử.
  const historySummary = useMemo(() => {
    if (metrics.length === 0) return "Chưa có lần đo nào";
    const latest = metrics.reduce((a, b) => (b.recordedAt > a.recordedAt ? b : a));
    return `Mới nhất ${formatFeedTime(latest.recordedAt, now)}`;
  }, [metrics, now]);

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={styles.sectionHeading}>Chỉ số hôm nay</Text>
        <Text style={styles.subHeadingText}>{formatShortDate(now)}</Text>
      </View>

      <View style={styles.grid}>
        {METRIC_TYPES.map((type) => {
          const entry = todayByType.get(type);
          const trend = entry?.previous ? compareValues(entry.latest.value, entry.previous.value) : null;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.metricTile, !entry && styles.metricTileEmpty]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("MetricHistory", { type })}
              accessibilityRole="button"
              accessibilityLabel={`${METRIC_LABEL[type]}, ${entry ? "đã đo hôm nay" : "chưa đo hôm nay"}, xem biểu đồ`}
            >
              <View style={styles.metricTileHeader}>
                <Ionicons
                  name={METRIC_ICON[type]}
                  size={18}
                  color={entry ? METRIC_ICON_COLOR : colors.textMuted}
                />
                {entry ? (
                  <View style={styles.headerRight}>
                    {trend ? (
                      <Ionicons
                        name={
                          trend === "up"
                            ? "arrow-up"
                            : trend === "down"
                            ? "arrow-down"
                            : "remove"
                        }
                        size={13}
                        color={colors.textMuted}
                      />
                    ) : null}
                    <Text style={styles.metricTime}>{formatFeedTime(entry.latest.recordedAt, now)}</Text>
                  </View>
                ) : (
                  <Text style={styles.notMeasuredBadge}>Chưa đo</Text>
                )}
              </View>
              <Text style={[styles.metricValue, !entry && styles.metricValueEmpty]}>
                {entry ? formatMetricValue(entry.latest.value) : "--"}
                <Text style={styles.metricUnit}> {entry ? entry.latest.unit : METRIC_UNIT[type]}</Text>
              </Text>
              <View style={styles.metricLabelRow}>
                <Text style={styles.metricLabel}>{METRIC_LABEL[type]}</Text>
                <Ionicons name="stats-chart" size={14} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.historyButton}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("MeasurementHistory")}
        accessibilityRole="button"
        accessibilityLabel={`Lịch sử kiểm tra chỉ số, ${historySummary}`}
      >
        <View style={styles.historyIcon}>
          <Ionicons name="time" size={26} color={colors.primary} />
        </View>
        <View style={styles.historyText}>
          <Text style={styles.historyTitle}>Lịch sử kiểm tra chỉ số</Text>
          <Text style={styles.historySummary}>{historySummary}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  subHeadingText: { fontSize: typography.caption, fontWeight: "600", color: colors.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricTile: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  metricTileEmpty: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0.02,
  },
  metricTileHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  metricTime: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  notMeasuredBadge: { fontSize: 11, fontWeight: "500", color: colors.textMuted },
  metricValue: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  metricValueEmpty: { color: colors.textMuted },
  metricUnit: { fontSize: typography.caption, fontWeight: "600", color: colors.textMuted },
  metricLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricLabel: { fontSize: typography.caption, color: colors.textMuted },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  historyText: { flex: 1, gap: 2 },
  historyTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  historySummary: { fontSize: typography.caption, color: colors.textMuted },
});
