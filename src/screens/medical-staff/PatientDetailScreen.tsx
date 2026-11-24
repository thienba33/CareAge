import { ElderlyHealthRecord } from "../../components/caregiver";
import { AppAvatar, AppButton, ErrorState, LoadingOverlay, LoadingScreen } from "../../components/common";
import {
  useSubject,
  useHealthProfile,
  useMedicalConditions,
  useEmergencyContacts,
  useHealthMetrics,
  useAlerts,
  useAppointments,
  useFormerPatients,
  useNow,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Animated, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AlertStrip from "../../components/home/AlertStrip";
import VitalsOverview from "../../components/health/VitalsOverview";

import { AppointmentRow } from "../../components/appointment/AppointmentSection";
import AppointmentDetailModal from "../../components/appointment/AppointmentDetailModal";
import { ReasonPickerModal } from "../../components/staff";
import { colors, typography } from "../../theme/colors";
import { GENDER_LABEL } from "../../constants/healthProfile";
import { END_ASSIGNMENT_REASONS } from "../../constants/staff";
import { calculateAge } from "../../utils/healthProfile";
import { splitAppointments } from "../../utils/appointment";
import type { Appointment } from "../../types/appointment";
import type { MainStackParamList, PatientDetailTab } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<MainStackParamList, "PatientDetail">;

const TABS: { key: PatientDetailTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "health", label: "Sức khỏe", icon: "pulse" },
  { key: "record", label: "Hồ sơ", icon: "document-text" },
  { key: "appointments", label: "Lịch khám", icon: "calendar" },
];

const PAST_PREVIEW_COUNT = 5;

// Hồ sơ bệnh nhân (MEDICAL_STAFF): mọi dữ liệu của bệnh nhân đang xem trong một màn —
// Sức khỏe (cảnh báo mới, chỉ số, lịch sử đo) | Hồ sơ (dị ứng, bệnh nền, liên hệ) | Lịch khám (sắp tới, đã qua).
export default function PatientDetailScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<PatientDetailTab>(route.params?.tab ?? "health");
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [endVisible, setEndVisible] = useState(false);
  const { endAssignment } = useFormerPatients();
  const now = useNow();

  const { subject, linkedElderly } = useSubject();
  const patient = linkedElderly.find((e) => e.id === subject?.id);
  const profileState = useHealthProfile();
  const conditionsState = useMedicalConditions();
  const contactsState = useEmergencyContacts();
  const metricsState = useHealthMetrics();
  const alertsState = useAlerts();
  const appointmentsState = useAppointments();

  const pullToRefresh = usePullToRefresh(
    useCallback(
      () =>
        Promise.all([
          profileState.reload(),
          conditionsState.reload(),
          contactsState.reload(),
          metricsState.reload(),
          alertsState.reload(),
          appointmentsState.reload(),
        ]),
      [profileState.reload, conditionsState.reload, contactsState.reload, metricsState.reload, alertsState.reload, appointmentsState.reload]
    )
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: subject?.name ?? "Hồ sơ bệnh nhân" });
  }, [navigation, subject?.name]);

  const { pending, upcoming, past } = useMemo(() => splitAppointments(appointmentsState.appointments, now), [appointmentsState.appointments, now]);
  const upcomingAll = useMemo(() => [...upcoming, ...pending], [upcoming, pending]);
  const results = useMemo(
    () => (detail ? metricsState.metrics.filter((m) => m.appointmentId === detail.id) : []),
    [metricsState.metrics, detail]
  );
  const latestUnreadAlert = alertsState.alerts.find((a) => !a.readAt) ?? null;

  if (profileState.error) return <ErrorState message={profileState.error} onRetry={profileState.reload} />;

  if (profileState.isLoading) {
    return <LoadingScreen />;
  }

  const profile = profileState.profile;
  const age = calculateAge(profile?.dateOfBirth);
  const metaParts = [
    patient ? `Mã ${patient.code}` : null,
    age !== null ? `${age} tuổi` : null,
    profile?.gender ? GENDER_LABEL[profile.gender] : null,
  ].filter(Boolean);

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} {...pullToRefresh.scrollProps}>
          <View style={styles.patientCard}>
            <AppAvatar name={subject?.name} size={56} variant="primaryLight" />
            <View style={styles.patientText}>
              <Text style={styles.patientName} numberOfLines={1}>
                {subject?.name}
              </Text>
              <Text style={styles.patientMeta}>{metaParts.join(" · ")}</Text>
            </View>
            {patient?.phone ? (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${patient.phone}`)}
                accessibilityRole="button"
                accessibilityLabel={`Gọi ${subject?.name}`}
              >
                <Ionicons name="call" size={22} color={colors.surface} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.tabsCard}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => setTab(t.key)}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={t.icon} size={18} color={active ? colors.surface : colors.textMuted} />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === "health" ? (
            <View style={styles.section}>
              {latestUnreadAlert ? (
                <AlertStrip
                  latestUnread={latestUnreadAlert}
                  unreadCount={alertsState.unreadCount}
                  onPress={() => navigation.navigate("Alerts")}
                />
              ) : (
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => navigation.navigate("Alerts")}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Ionicons name="shield-checkmark" size={22} color={colors.success} />
                  <Text style={styles.linkText}>Không có cảnh báo mới</Text>
                  <Text style={styles.linkAction}>Xem cảnh báo</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <VitalsOverview metrics={metricsState.metrics} now={now} />
            </View>
          ) : null}

          {tab === "record" ? (
            <ElderlyHealthRecord profile={profile} conditions={conditionsState.conditions} contacts={contactsState.contacts} />
          ) : null}

          {tab === "appointments" ? (
            <View style={styles.section}>
              <Text style={styles.heading}>Sắp tới</Text>
              {upcomingAll.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có lịch khám sắp tới.</Text>
              ) : (
                <View style={styles.list}>
                  {upcomingAll.map((a, i) => (
                    <AppointmentRow key={a.id} appointment={a} isLast={i === upcomingAll.length - 1} onPress={() => setDetail(a)} />
                  ))}
                </View>
              )}

              <Text style={[styles.heading, styles.headingSpaced]}>Đã qua</Text>
              {past.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có buổi khám nào.</Text>
              ) : (
                <>
                  <View style={styles.list}>
                    {past.slice(0, PAST_PREVIEW_COUNT).map((a, i, arr) => (
                      <AppointmentRow key={a.id} appointment={a} isLast={i === arr.length - 1} onPress={() => setDetail(a)} />
                    ))}
                  </View>
                  {past.length > PAST_PREVIEW_COUNT ? (
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => navigation.navigate("AppointmentHistory")}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                    >
                      <Text style={styles.moreText}>Xem toàn bộ lịch sử khám ({past.length})</Text>
                      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
          ) : null}

          {/* Kết thúc theo dõi → cựu bệnh nhân (điều trị xong, chuyển bác sĩ / cơ sở...). */}
          <AppButton
            title="Kết thúc theo dõi bệnh nhân"
            icon="exit-outline"
            variant="outline"
            onPress={() => setEndVisible(true)}
            style={styles.endButton}
            textStyle={{ color: colors.danger }}
            accessibilityHint="Chuyển người này sang danh sách cựu bệnh nhân"
          />
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <AppointmentDetailModal
        appointment={detail}
        results={results}
        onClose={() => setDetail(null)}
        staffView={subject ? { patientName: subject.name } : undefined}
      />
      <ReasonPickerModal
        visible={endVisible}
        title="Kết thúc theo dõi"
        subtitle={subject ? `${subject.name}${patient ? ` · Mã ${patient.code}` : ""}` : undefined}
        reasons={END_ASSIGNMENT_REASONS}
        warning="Người này sẽ chuyển sang Cựu bệnh nhân và bạn không còn xem được dữ liệu sức khỏe của họ. Yêu cầu đặt lịch đang chờ gửi cho bạn sẽ bị từ chối và người thân được thông báo."
        confirmLabel="Kết thúc theo dõi"
        onClose={() => setEndVisible(false)}
        onSubmit={async (reason) => {
          if (!subject) return;
          const name = subject.name;
          await endAssignment(subject.id, reason);
          setEndVisible(false);
          navigation.goBack();
          Alert.alert("Đã kết thúc theo dõi", `${name} đã được chuyển sang Cựu bệnh nhân.`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patientText: { flex: 1, gap: 2 },
  patientName: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  patientMeta: { fontSize: typography.body, color: colors.textMuted },
  callButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  tabsCard: {
    flexDirection: "row",
    gap: 6,
    padding: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    borderRadius: 12,
  },
  tabButtonActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  tabLabelActive: { color: colors.surface },
  section: { gap: 12 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  linkText: { flex: 1, fontSize: typography.body, color: colors.text },
  linkAction: { fontSize: typography.caption, fontWeight: "700", color: colors.primary },
  heading: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  headingSpaced: { marginTop: 8 },
  emptyText: { fontSize: typography.body, color: colors.textMuted },
  list: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  endButton: {
    marginTop: 16,
    borderColor: colors.danger,
  },
  moreButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 48 },
  moreText: { fontSize: typography.body, fontWeight: "700", color: colors.primary },
});
