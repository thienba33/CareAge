import {
  EmptyCard,
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
} from "../../components/common";
import { useStaffAppointments, useNow, usePullToRefresh } from "../../hooks";
import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AppointmentDetailModal from "../../components/appointment/AppointmentDetailModal";
import {
  ApproveRequestModal,
  ReasonPickerModal,
  RequestCard,
} from "../../components/staff";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { daysFromToday, formatLongDate, fromDateKey } from "../../utils/date";
import type { StaffAppointment } from "../../types/staff";
import { REJECT_REASON_SUGGESTIONS } from "../../constants/appointmentRequest";

const EMPTY_RESULTS: never[] = [];

type ListSection = "pending" | "upcoming";

function dayTitle(dateKey: string, now: Date): string {
  const date = fromDateKey(dateKey);
  const days = daysFromToday(date, now);
  if (days === 0) return `Hôm nay · ${formatLongDate(date)}`;
  if (days === 1) return `Ngày mai · ${formatLongDate(date)}`;
  return formatLongDate(date);
}

// Tab "Lịch khám" (MEDICAL_STAFF): 2 mục — "Chờ duyệt" (yêu cầu gửi tới mình) và "Sắp tới" (lịch đã xác nhận theo ngày).
export default function StaffAppointmentsScreen() {
  const { appointments, isLoading, error, reload, approve, reject } = useStaffAppointments();
  const [view, setView] = useState<ListSection>("pending");
  const [rejecting, setRejecting] = useState<StaffAppointment | null>(null);
  const [detail, setDetail] = useState<StaffAppointment | null>(null);
  const [approving, setApproving] = useState<StaffAppointment | null>(null);
  const now = useNow();
  const pullToRefresh = usePullToRefresh(reload);

  const pending = useMemo(() => appointments.filter((a) => a.status === "REQUESTED"), [appointments]);
  const upcoming = useMemo(() => appointments.filter((a) => a.status === "UPCOMING"), [appointments]);
  const upcomingByDay = useMemo(() => {
    const groups = new Map<string, StaffAppointment[]>();
    for (const a of upcoming) {
      const group = groups.get(a.date);
      if (group) group.push(a);
      else groups.set(a.date, [a]);
    }
    return Array.from(groups, ([date, items]) => ({ date, items }));
  }, [upcoming]);

  if (error && appointments.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  const tabs: { key: ListSection; label: string; icon: keyof typeof Ionicons.glyphMap; count: number }[] = [
    { key: "pending", label: "Chờ duyệt", icon: "hourglass-outline", count: pending.length },
    { key: "upcoming", label: "Sắp tới", icon: "calendar-outline", count: upcoming.length },
  ];

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={commonStyles.scrollContent} showsVerticalScrollIndicator={false} {...pullToRefresh.scrollProps}>
          <View style={commonStyles.heroCompact}>
            <HeroBlobs />
            <Text style={commonStyles.heroTitle}>Thông tin lịch khám</Text>
            <Text style={commonStyles.heroSubtitle}>
              {pending.length > 0 ? `${pending.length} yêu cầu đang chờ bạn duyệt` : "Không có yêu cầu nào chờ duyệt"}
            </Text>
          </View>

          <View style={styles.tabsCard}>
            {tabs.map((t) => {
              const active = view === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => setView(t.key)}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${t.label}, ${t.count}`}
                >
                  <Ionicons name={t.icon} size={18} color={active ? colors.surface : colors.textMuted} />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                  {t.count > 0 ? (
                    <View style={[styles.tabCount, active && styles.tabCountActive]}>
                      <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{t.count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sections}>
            {view === "pending" ? (
              pending.length === 0 ? (
                <EmptyCard icon="checkmark-done-circle-outline" message="Bạn đã xử lý hết các yêu cầu đặt lịch." />
              ) : (
                pending.map((a) => (
                  <RequestCard
                    key={a.id}
                    appointment={a}
                    now={now}
                    onOpen={() => setDetail(a)}
                    onApprove={() => setApproving(a)}
                    onReject={() => setRejecting(a)}
                  />
                ))
              )
            ) : upcomingByDay.length === 0 ? (
              <EmptyCard icon="calendar-clear-outline" message="Chưa có lịch khám sắp tới." />
            ) : (
              upcomingByDay.map((group) => (
                <View key={group.date} style={styles.dayGroup}>
                  <Text style={styles.dayTitle}>{dayTitle(group.date, now)}</Text>
                  <View style={styles.list}>
                    {group.items.map((a, i) => (
                      <TouchableOpacity
                        key={a.id}
                        style={[styles.row, i < group.items.length - 1 && styles.rowDivider]}
                        onPress={() => setDetail(a)}
                        activeOpacity={0.6}
                        accessibilityRole="button"
                        accessibilityLabel={`${a.time}, ${a.patientName}, ${a.reason ?? "Tái khám"}`}
                      >
                        <View style={styles.timePill}>
                          <Text style={styles.timeText}>{a.time}</Text>
                        </View>
                        <View style={styles.rowText}>
                          <Text style={styles.rowName} numberOfLines={1}>
                            {a.patientName}
                          </Text>
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {a.reason ?? "Tái khám"}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <ApproveRequestModal
        appointment={approving}
        onClose={() => setApproving(null)}
        onSubmit={async (note) => {
          if (!approving) return;
          await approve(approving, note || undefined);
          setApproving(null);
        }}
      />
      <ReasonPickerModal
        visible={!!rejecting}
        title="Từ chối yêu cầu"
        subtitle={rejecting ? `${rejecting.patientName} · ${rejecting.time}, ${formatLongDate(fromDateKey(rejecting.date))}` : undefined}
        reasons={REJECT_REASON_SUGGESTIONS}
        confirmLabel="Từ chối yêu cầu"
        onClose={() => setRejecting(null)}
        onSubmit={async (reason) => {
          if (!rejecting) return;
          await reject(rejecting, reason);
          setRejecting(null);
        }}
      />
      <AppointmentDetailModal
        appointment={detail}
        results={EMPTY_RESULTS}
        onClose={() => setDetail(null)}
        staffView={
          detail
            ? {
                patientName: detail.patientName,
                // Duyệt ngay trong chi tiết: đóng chi tiết rồi dùng chung luồng xác nhận / từ chối của thẻ.
                onApprove: () => {
                  const a = detail;
                  setDetail(null);
                  setApproving(a);
                },
                onReject: () => {
                  const a = detail;
                  setDetail(null);
                  setRejecting(a);
                },
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabsCard: {
    flexDirection: "row",
    gap: 6,
    padding: 6,
    marginHorizontal: 20,
    marginTop: -22,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: 12,
  },
  tabButtonActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  tabLabelActive: { color: colors.surface },
  tabCount: { minWidth: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: "center", backgroundColor: colors.background },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText: { fontSize: 12, lineHeight: 20, fontWeight: "800", color: colors.textMuted },
  tabCountTextActive: { color: colors.surface },
  sections: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  dayGroup: { gap: 8 },
  dayTitle: { fontSize: typography.caption, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase" },
  list: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  timePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.infoLight },
  timeText: { fontSize: typography.body, fontWeight: "800", color: colors.info },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: typography.caption, color: colors.textMuted },
});
