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
  useAppointments,
  useHealthMetrics,
  useSubject,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, SectionList, StyleSheet, Text, View } from "react-native";

import { AppointmentDetailModal } from "../../components/appointment";
import { colors, typography } from "../../theme/colors";
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_ICON,
  APPOINTMENT_STATUS_LABEL,
} from "../../constants/appointmentStatus";
import { splitAppointments } from "../../utils/appointment";
import { fromDateKey } from "../../utils/date";
import type { Appointment } from "../../types/appointment";

// Chia lịch đã qua theo tháng ("Tháng 10/2026"), mới nhất trước.
function groupByMonth(appointments: Appointment[]): { title: string; data: Appointment[] }[] {
  const groups = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const d = fromDateKey(a.date);
    const title = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
    const group = groups.get(title);
    if (group) group.push(a);
    else groups.set(title, [a]);
  }
  return Array.from(groups, ([title, data]) => ({ title, data }));
}

// Lịch sử khám: các lịch đã khám, đã hủy, lỡ hẹn, bị từ chối — giao diện danh sách như Thông báo.
export default function AppointmentHistoryScreen() {
  const { appointments, isLoading, error, reload } = useAppointments();
  // Kết quả đo tại bệnh viện của buổi khám đang xem.
  const { metrics, reload: reloadMetrics } = useHealthMetrics();
  const { linkedElderly } = useSubject();
  const [detail, setDetail] = useState<Appointment | null>(null);
  const pullToRefresh = usePullToRefresh(
    useCallback(() => Promise.all([reload(), reloadMetrics()]), [reload, reloadMetrics])
  );

  const sections = useMemo(() => groupByMonth(splitAppointments(appointments).past), [appointments]);
  const results = useMemo(
    () => (detail ? metrics.filter((m) => m.appointmentId === detail.id) : []),
    [metrics, detail]
  );

  if (error && appointments.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <SectionList
          sections={sections}
          keyExtractor={(a) => a.id}
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
              icon="calendar-clear-outline"
              title="Chưa có lịch sử khám"
              message="Các buổi khám đã qua sẽ hiện ở đây."
            />
          }
          renderSectionHeader={({ section }) => <FeedSectionHeader title={section.title} />}
          renderItem={({ item }) => {
            const color = APPOINTMENT_STATUS_COLOR[item.status];
            const status = APPOINTMENT_STATUS_LABEL[item.status];
            const d = fromDateKey(item.date);
            const when = `${item.time} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            const title = item.reason ?? "Tái khám";
            return (
              <FeedRow
                icon={APPOINTMENT_STATUS_ICON[item.status]}
                iconColor={color}
                iconBackground={`${color}1A`}
                title={title}
                body={item.facility}
                meta={`${status} · ${when}`}
                unread={false}
                accessibilityLabel={`${title}. ${item.facility}. ${status}, ${when}`}
                onPress={() => setDetail(item)}
              />
            );
          }}
        />
      </Animated.View>
      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <AppointmentDetailModal appointment={detail} results={results} onClose={() => setDetail(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  list: { paddingBottom: 40, flexGrow: 1 },
});
