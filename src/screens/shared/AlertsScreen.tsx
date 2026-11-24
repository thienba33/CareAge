import { ElderlySwitcher } from "../../components/caregiver";
import {
  ErrorState,
  EmptyState,
  LoadingOverlay,
  LoadingScreen,
  MarkAllReadButton,
  FeedRow,
  FeedSectionHeader,
} from "../../components/common";
import {
  useAuth,
  useAlerts,
  useSubject,
  usePullToRefresh,
  useNow,
} from "../../hooks";
import React, { useLayoutEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, SectionList, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AlertDetailModal } from "../../components/alert";
import { alertError } from "../../utils/alertError";
import { formatFeedTime, groupByDay } from "../../utils/date";
import {
  ALERT_SEVERITY_BACKGROUND,
  ALERT_SEVERITY_COLOR,
  ALERT_SEVERITY_ICON,
  ALERT_SEVERITY_LABEL,
} from "../../constants/alert";
import { colors, typography } from "../../theme/colors";
import type { HealthAlert } from "../../types/alert";
import type { PatientDetailTab } from "../../navigation/RootNavigator";

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useAuth();
  const { alerts, unreadCount, isLoading, error, markAsRead, markAllAsRead, reload } = useAlerts();
  const [selected, setSelected] = useState<HealthAlert | null>(null);
  const { isSelf, subject, linkedElderly } = useSubject();
  const pullToRefresh = usePullToRefresh(reload);
  const now = useNow();
  const sections = useMemo(() => groupByDay(alerts, (a) => a.createdAt, now), [alerts, now]);

  // Người cao tuổi đánh dấu trên cảnh báo; người thân / bác sĩ có trạng thái đã đọc riêng.
  const canMarkRead = currentUser?.role !== "ADMIN";
  // Người thân / bác sĩ: tên người cao tuổi hiện ngay trong từng cảnh báo.
  const elderlyName = isSelf ? undefined : subject?.name;

  // Nút đánh dấu đã đọc tất cả nằm trên thanh tiêu đề.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        canMarkRead && unreadCount > 0 ? (
          <MarkAllReadButton unreadCount={unreadCount} onPress={() => markAllAsRead().catch((e) => alertError(e))} />
        ) : null,
    });
  }, [navigation, canMarkRead, unreadCount, markAllAsRead]);

  const openAlert = (alert: HealthAlert) => {
    setSelected(alert);
    if (canMarkRead && !alert.readAt) {
      markAsRead(alert.id).catch((e) => alertError(e));
    }
  };

  const goTo = (tab: string) => {
    setSelected(null);
    navigation.navigate("Main", { screen: tab });
  };

  // Bác sĩ không có tab Sức khỏe / Khẩn cấp — mở đúng mục trong Hồ sơ bệnh nhân.
  const isStaff = currentUser?.role === "MEDICAL_STAFF";
  const openPatient = (tab: PatientDetailTab) => {
    setSelected(null);
    navigation.navigate("PatientDetail", { tab });
  };

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (isLoading && alerts.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          {...pullToRefresh.scrollProps}
          ListHeaderComponent={
            // Chỉ cần chỗ đổi người khi theo dõi từ 2 người trở lên.
            linkedElderly.length > 1 ? (
              <View style={styles.header}>
                <ElderlySwitcher />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark"
              iconColor={colors.success}
              title="Không có cảnh báo nào"
              message="Các chỉ số đang nằm trong khoảng theo dõi an toàn."
            />
          }
          renderSectionHeader={({ section }) => <FeedSectionHeader title={section.title} />}
          renderItem={({ item }) => {
            // Người thân / bác sĩ: ghép tên người cao tuổi vào tiêu đề, như bên Thông báo.
            const title = elderlyName ? `${elderlyName}: ${item.title}` : item.title;
            const severity = ALERT_SEVERITY_LABEL[item.severity];
            return (
              <FeedRow
                icon={ALERT_SEVERITY_ICON[item.severity]}
                iconColor={ALERT_SEVERITY_COLOR[item.severity]}
                iconBackground={ALERT_SEVERITY_BACKGROUND[item.severity]}
                title={title}
                body={item.message}
                meta={`${severity} · ${formatFeedTime(item.createdAt, now)}`}
                unread={!item.readAt}
                accessibilityLabel={`${severity}. ${title}. ${item.message}`}
                onPress={() => openAlert(item)}
              />
            );
          }}
        />
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <AlertDetailModal
        alert={selected}
        onClose={() => setSelected(null)}
        onViewMetric={() => (isStaff ? openPatient("health") : goTo("Vitals"))}
        onCallContact={() => (isStaff ? openPatient("record") : goTo("Emergency"))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12 },
  flex: { flex: 1, backgroundColor: colors.surface },
  list: { paddingBottom: 40, flexGrow: 1 },
});
