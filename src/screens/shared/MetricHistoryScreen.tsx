import { ElderlySwitcher } from "../../components/caregiver";
import { ErrorState, LoadingOverlay, LoadingScreen } from "../../components/common";
import {
  usePullToRefresh,
  useHealthMetrics,
  useAlerts,
  useAlertThresholds,
  useAppointments,
  useSubject,
} from "../../hooks";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  MetricHeroCard,
  MetricChart,
  MetricStatsSummary,
  MetricReadingList,
  RangeSelector,
} from "../../components/health";
import { colors } from "../../theme/colors";

import { CHART_RANGES, DEFAULT_CHART_RANGE, type ChartRangeKey } from "../../constants/chartRange";
import { METRIC_ICON, METRIC_LABEL, METRIC_UNIT } from "../../constants/healthMetric";
import type { MainStackParamList } from "../../navigation/RootNavigator";
import { buildSeries, filterByRange, getReferenceLines } from "../../utils/chart";

type Props = NativeStackScreenProps<MainStackParamList, "MetricHistory">;

export default function MetricHistoryScreen({ route, navigation }: Props) {
  const { type } = route.params;
  const { metrics, isLoading, error, reload } = useHealthMetrics();
  const { alerts, reload: reloadAlerts } = useAlerts();
  const { thresholds, reload: reloadThresholds } = useAlertThresholds(type);
  const { appointments, reload: reloadAppointments } = useAppointments();
  const { linkedElderly } = useSubject();
  const [rangeKey, setRangeKey] = useState<ChartRangeKey>(DEFAULT_CHART_RANGE);

  useLayoutEffect(() => {
    navigation.setOptions({ title: METRIC_LABEL[type] });
  }, [navigation, type]);

  const range = CHART_RANGES.find((r) => r.key === rangeKey)!;
  const unit = METRIC_UNIT[type];

  const { inRange, series, from, to } = useMemo(() => {
    const now = new Date();
    const filtered = filterByRange(metrics, type, range.days, now);
    return {
      inRange: filtered,
      series: buildSeries(filtered, type),
      from: now.getTime() - range.days * 86_400_000,
      to: now.getTime(),
    };
  }, [metrics, type, range.days]);

  const referenceLines = useMemo(
    () => getReferenceLines(thresholds, series[0]?.key ?? "value"),
    [thresholds, series]
  );

  const abnormalMetricIds = useMemo(
    () => new Set(alerts.filter((a) => a.metricType === type && a.metricId).map((a) => a.metricId!)),
    [alerts, type]
  );

  const pullToRefresh = usePullToRefresh(
    useCallback(
      () => Promise.all([reload(), reloadAlerts(), reloadThresholds(), reloadAppointments()]),
      [reload, reloadAlerts, reloadThresholds, reloadAppointments]
    )
  );

  const facilityMap = useMemo(
    () => new Map(appointments.map((a) => [a.id, a.facility])),
    [appointments]
  );

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading && metrics.length === 0) {
    return <LoadingScreen />;
  }

  const latest = inRange[inRange.length - 1] ?? null;
  const isLatestAbnormal = latest ? abnormalMetricIds.has(latest.id) : false;
  const history = inRange.slice().reverse();

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          {...pullToRefresh.scrollProps}
        >
          {linkedElderly.length > 1 ? (
            <View style={styles.switcherWrap}>
              <ElderlySwitcher />
            </View>
          ) : null}

          {/* Thẻ Hero hiển thị số đo gần nhất */}
          <MetricHeroCard
            type={type}
            latest={latest}
            unit={unit}
            facilityMap={facilityMap}
            isAbnormal={isLatestAbnormal}
          />

          {/* Thẻ biểu đồ với bộ chọn khoảng thời gian ở header */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Biểu đồ xu hướng</Text>
              <RangeSelector value={rangeKey} onChange={setRangeKey} />
            </View>

            {inRange.length === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons name={METRIC_ICON[type]} size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Chưa có lần đo nào</Text>
                <Text style={styles.emptyText}>Không có dữ liệu trong {range.label} vừa qua.</Text>
              </View>
            ) : (
              <MetricChart
                series={series}
                referenceLines={referenceLines}
                abnormalMetricIds={abnormalMetricIds}
                unit={unit}
                from={from}
                to={to}
              />
            )}
          </View>

          {inRange.length > 0 ? (
            <>
              {/* Tóm tắt thống kê: Thấp nhất | Trung bình | Cao nhất */}
              <MetricStatsSummary series={series} unit={unit} />

              {/* Danh sách các lần đo */}
              <MetricReadingList
                history={history}
                facilityMap={facilityMap}
                abnormalMetricIds={abnormalMetricIds}
              />

              <Text style={styles.disclaimer}>
                Biểu đồ dùng để theo dõi xu hướng sinh lý, không thay thế chẩn đoán chuyên sâu từ bác sĩ.
              </Text>
            </>
          ) : null}
        </ScrollView>
      </Animated.View>
      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  switcherWrap: { marginBottom: 2 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  emptyChart: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});
