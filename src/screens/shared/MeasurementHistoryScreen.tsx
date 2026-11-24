import { ElderlySwitcher } from "../../components/caregiver";
import {
  ErrorState,
  EmptyState,
  LoadingOverlay,
  LoadingScreen,
  FeedRow,
  FeedSectionHeader,
} from "../../components/common";
import {
  useHealthMetrics,
  useAppointments,
  useSubject,
  usePullToRefresh,
  useNow,
} from "../../hooks";
import React, { useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, SectionList, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { colors, typography } from "../../theme/colors";
import { METRIC_ICON, METRIC_ICON_COLOR, METRIC_LABEL } from "../../constants/healthMetric";
import { formatFeedTime, groupByDay } from "../../utils/date";
import { cleanDeviceName, formatMetricValue } from "../../utils/metric";
import type { HealthMetric } from "../../types/health";

function getSourceText(metric: HealthMetric, facilityByAppointmentId: Map<string, string>): string {
  if (metric.source === "DEVICE") {
    return `Thiết bị: ${cleanDeviceName(metric.deviceName)}`;
  }
  const facility = metric.appointmentId ? facilityByAppointmentId.get(metric.appointmentId) : undefined;
  return `Đo tại ${facility ?? "bệnh viện"}`;
}

// Toàn bộ các lần đo, chia theo ngày như danh sách Thông báo. Bấm một lần đo → biểu đồ của chỉ số đó.
export default function MeasurementHistoryScreen() {
  const navigation = useNavigation<any>();
  const { metrics, isLoading, error, reload } = useHealthMetrics();
  const { appointments, reload: reloadAppointments } = useAppointments();
  const { linkedElderly } = useSubject();
  const now = useNow();
  const pullToRefresh = usePullToRefresh(
    useCallback(() => Promise.all([reload(), reloadAppointments()]), [reload, reloadAppointments])
  );

  const facilityByAppointmentId = useMemo(
    () => new Map(appointments.map((a) => [a.id, a.facility])),
    [appointments]
  );

  const sections = useMemo(() => {
    const sorted = metrics.slice().sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    return groupByDay(sorted, (m) => m.recordedAt, now);
  }, [metrics, now]);

  if (error && metrics.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <SectionList
          sections={sections}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          {...pullToRefresh.scrollProps}
          ListHeaderComponent={
            // Chỉ cần chỗ đổi người khi theo dõi từ 2 người trở lên (giống màn Cảnh báo).
            linkedElderly.length > 1 ? (
              <View style={styles.header}>
                <ElderlySwitcher />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="pulse-outline"
              title="Chưa có lần đo nào"
              message="Chỉ số sẽ xuất hiện sau khi tái khám tại bệnh viện hoặc kết nối thiết bị đo."
            />
          }
          renderSectionHeader={({ section }) => <FeedSectionHeader title={section.title} />}
          renderItem={({ item }) => {
            const title = `${METRIC_LABEL[item.type]}: ${formatMetricValue(item.value)} ${item.unit}`;
            const source = getSourceText(item, facilityByAppointmentId);
            return (
              <FeedRow
                icon={METRIC_ICON[item.type]}
                iconColor={METRIC_ICON_COLOR}
                iconBackground={colors.primaryLight}
                title={title}
                body={source}
                meta={formatFeedTime(item.recordedAt, now)}
                unread={false}
                accessibilityLabel={`${title}. ${source}. Bấm để xem biểu đồ`}
                onPress={() => navigation.navigate("MetricHistory", { type: item.type })}
              />
            );
          }}
        />
      </Animated.View>
      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  list: { paddingBottom: 40, flexGrow: 1 },
});
