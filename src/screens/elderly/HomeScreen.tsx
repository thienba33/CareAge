import {
  AppAvatar,
  LoadingOverlay,
  HeroBlobs,
  NotificationBellButton,
  UndoToast,
} from "../../components/common";
import {
  useAuth,
  useMedications,
  useHealthMetrics,
  useAppointments,
  useAlerts,
  useUndoToast,
  useNow,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useMemo, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import {
  AlertStrip,
  LoadErrorBanner,
  MedicationTodayCard,
  NextAppointmentCard,
  QuickStats,
} from "../../components/home";
import { AppointmentDetailModal } from "../../components/appointment";
import type { Appointment } from "../../types/appointment";
import { SOSButton } from "../../components/emergency";
import { alertError } from "../../utils/alertError";
import { formatLongDate } from "../../utils/date";
import { getDoseCompliance, getNextAppointment, getNextDoseGroup } from "../../utils/dashboard";
import { stripTitle } from "../../utils/text";

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const navigation = useNavigation<any>();
  const medicationsState = useMedications();
  const metricsState = useHealthMetrics();
  const appointmentsState = useAppointments();
  const alertsState = useAlerts();

  const firstName = currentUser?.name
    ? stripTitle(currentUser.name).split(/\s+/).pop() ?? "bạn"
    : "bạn";
  const canTakeDoses = currentUser?.role === "ELDERLY";
  // Cập nhật mỗi phút để "quá giờ" / lịch khám tới luôn đúng khi để app mở lâu.
  const now = useNow();

  // Dữ liệu dùng chung cache với các tab khác (React Query) nên không cần tải lại khi quay về tab.
  const reloadAll = useCallback(async () => {
    await Promise.all([
      medicationsState.reload(),
      metricsState.reload(),
      appointmentsState.reload(),
      alertsState.reload(),
    ]);
  }, [medicationsState.reload, metricsState.reload, appointmentsState.reload, alertsState.reload]);

  const pullToRefresh = usePullToRefresh(reloadAll);

  const { medications, todayDoses } = medicationsState;
  const compliance = useMemo(() => getDoseCompliance(todayDoses), [todayDoses]);
  const nextDoseGroup = useMemo(() => getNextDoseGroup(todayDoses, medications), [todayDoses, medications]);
  const nextAppointment = useMemo(
    () => getNextAppointment(appointmentsState.appointments, now),
    [appointmentsState.appointments, now]
  );

  const loadError =
    medicationsState.error ?? metricsState.error ?? appointmentsState.error ?? alertsState.error;

  const latestUnreadAlert = alertsState.alerts.find((a) => !a.readAt) ?? null;

  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const appointmentResults = useMemo(
    () =>
      detailAppointment ? metricsState.metrics.filter((m) => m.appointmentId === detailAppointment.id) : [],
    [metricsState.metrics, detailAppointment]
  );

  // Sau khi bấm "Đã uống", cho hoàn tác vài giây phòng khi bấm nhầm.
  const undoToast = useUndoToast();

  const handleTaken = async (doseIds: string[]) => {
    try {
      await Promise.all(doseIds.map((id) => medicationsState.markTaken(id)));
      undoToast.show(
        doseIds.length > 1 ? `Đã ghi nhận uống ${doseIds.length} thuốc` : "Đã ghi nhận uống thuốc",
        async () => {
          await Promise.all(doseIds.map((id) => medicationsState.markPending(id)));
        }
      );
    } catch (e) {
      alertError(e);
    }
  };

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          {...pullToRefresh.scrollProps}
        >
          <View style={commonStyles.heroCompact}>
            <HeroBlobs />

            <View style={styles.heroTopRow}>
              <View style={styles.heroGreeting}>
                <Text style={styles.eyebrow}>{formatLongDate(new Date())}</Text>
                <Text style={commonStyles.heroTitle}>Xin chào, {firstName}!</Text>
              </View>
              <View style={styles.heroActions}>
                <NotificationBellButton
                  unreadCount={alertsState.unreadCount}
                  onPress={() => navigation.navigate("Alerts")}
                />

                <TouchableOpacity
                  onPress={() => navigation.navigate("Profile")}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Hồ sơ cá nhân"
                >
                  <AppAvatar
                    name={currentUser?.name}
                    size={40}
                    variant="surface"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.sosWrapper}>
            <SOSButton variant="banner" />
          </View>

          <View style={commonStyles.sectionsLoose}>
            {loadError ? <LoadErrorBanner message={loadError} onRetry={reloadAll} /> : null}

            {latestUnreadAlert ? (
              <AlertStrip
                latestUnread={latestUnreadAlert}
                unreadCount={alertsState.unreadCount}
                onPress={() => navigation.navigate("Alerts")}
              />
            ) : null}

            <MedicationTodayCard
              compliance={compliance}
              next={nextDoseGroup}
              now={now}
              isLoading={medicationsState.isLoading}
              canTake={canTakeDoses}
              onTaken={handleTaken}
              onPress={() => navigation.navigate("Medications")}
            />

            <QuickStats
              metrics={metricsState.metrics}
              now={now}
              isLoading={metricsState.isLoading}
              onPress={() => navigation.navigate("Vitals")}
            />

            <NextAppointmentCard
              appointment={nextAppointment}
              now={now}
              isLoading={appointmentsState.isLoading}
              onPress={() => setDetailAppointment(nextAppointment)}
            />
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <AppointmentDetailModal
        appointment={detailAppointment}
        results={appointmentResults}
        onClose={() => setDetailAppointment(null)}
      />

      {undoToast.message ? (
        <UndoToast message={undoToast.message} onUndo={() => undoToast.undo().catch((e) => alertError(e))} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroGreeting: { flexShrink: 1, gap: 4 },
  eyebrow: {
    fontSize: typography.caption,
    color: colors.primaryLight,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sosWrapper: { marginHorizontal: 20, marginTop: 16 },
});
