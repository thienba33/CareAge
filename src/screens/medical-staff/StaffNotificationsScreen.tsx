import {
  EmptyState,
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  MarkAllReadButton,
  FeedRow,
  FeedSectionHeader,
} from "../../components/common";
import {
  useSubject,
  useStaffNotifications,
  useNow,
  usePullToRefresh,
} from "../../hooks";
import React, { useLayoutEffect, useMemo } from "react";
import { Animated, SectionList, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import {
  ALERT_SEVERITY_BACKGROUND,
  ALERT_SEVERITY_COLOR,
  ALERT_SEVERITY_ICON,
  ALERT_SEVERITY_LABEL,
} from "../../constants/alert";
import { alertError } from "../../utils/alertError";
import { formatFeedTime, formatShortDate, fromDateKey, groupByDay } from "../../utils/date";
import type { StaffAlert, StaffAppointment } from "../../types/staff";

type Entry = { kind: "request"; item: StaffAppointment } | { kind: "alert"; item: StaffAlert };

// Thông báo của bác sĩ: "Yêu cầu chờ duyệt" lên đầu (cần thao tác), rồi cảnh báo sức khỏe của bệnh nhân theo ngày.
export default function StaffNotificationsScreen() {
  const navigation = useNavigation<any>();
  const { select } = useSubject();
  const { alerts, pending, unreadAlerts, isLoading, error, markRead, markAllRead, reload } = useStaffNotifications();
  const now = useNow();
  const pullToRefresh = usePullToRefresh(reload);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        unreadAlerts > 0 ? (
          <MarkAllReadButton unreadCount={unreadAlerts} onPress={() => markAllRead().catch((e) => alertError(e))} />
        ) : null,
    });
  }, [navigation, unreadAlerts, markAllRead]);

  const sections = useMemo(() => {
    const requestSection =
      pending.length > 0
        ? [{ title: `Yêu cầu chờ duyệt (${pending.length})`, data: pending.map((item): Entry => ({ kind: "request", item })) }]
        : [];
    const alertSections = groupByDay(alerts, (a) => a.createdAt, now).map((s) => ({
      title: s.title,
      data: s.data.map((item): Entry => ({ kind: "alert", item })),
    }));
    return [...requestSection, ...alertSections];
  }, [pending, alerts, now]);

  const openAlert = (a: StaffAlert) => {
    if (!a.readAt) markRead([a.id]).catch((e) => alertError(e));
    select(a.userId);
    navigation.navigate("Alerts");
  };

  if (error && alerts.length === 0 && pending.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <SectionList
          sections={sections}
          keyExtractor={(e) => `${e.kind}:${e.item.id}`}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          {...pullToRefresh.scrollProps}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Chưa có thông báo"
              message="Bạn sẽ thấy ở đây yêu cầu đặt lịch cần duyệt và cảnh báo sức khỏe của bệnh nhân."
            />
          }
          renderSectionHeader={({ section }) => <FeedSectionHeader title={section.title} />}
          renderItem={({ item: entry }) => {
            if (entry.kind === "request") {
              const a = entry.item;
              const when = `${a.time} · ${formatShortDate(fromDateKey(a.date))}`;
              return (
                <FeedRow
                  icon="hourglass-outline"
                  iconColor={colors.warning}
                  iconBackground={colors.warningLight}
                  title={`${a.patientName} xin đặt lịch khám`}
                  body={`${when} — ${a.reason ?? "Tái khám"}`}
                  meta="Chờ bạn duyệt"
                  unread
                  accessibilityLabel={`${a.patientName} xin đặt lịch khám ${when}. Bấm để duyệt`}
                  onPress={() => navigation.navigate("Main", { screen: "Appointments" })}
                />
              );
            }
            const a = entry.item;
            const severity = ALERT_SEVERITY_LABEL[a.severity];
            return (
              <FeedRow
                icon={ALERT_SEVERITY_ICON[a.severity]}
                iconColor={ALERT_SEVERITY_COLOR[a.severity]}
                iconBackground={ALERT_SEVERITY_BACKGROUND[a.severity]}
                title={`${a.patientName}: ${a.title}`}
                body={a.message}
                meta={`${severity} · ${formatFeedTime(a.createdAt, now)}`}
                unread={!a.readAt}
                accessibilityLabel={`${severity}. ${a.patientName}: ${a.title}. ${a.message}`}
                onPress={() => openAlert(a)}
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
  list: { paddingBottom: 40, flexGrow: 1 },
});
