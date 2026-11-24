import { ElderlySwitcher, NoLinkedElderlyState } from "../../components/caregiver";
import {
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
} from "../../components/common";
import {
  useAuth,
  useSubject,
  useAppointments,
  useAssignedDoctors,
  useHealthMetrics,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppointmentSection, AppointmentDetailModal, RequestAppointmentModal } from "../../components/appointment";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { alertError } from "../../utils/alertError";
import type { Appointment, AppointmentRequestInput } from "../../types/appointment";

// Tab "Lịch khám" (ELDERLY, CAREGIVER): lịch tái khám + gửi yêu cầu đặt lịch (nhân viên y tế xác nhận).
export default function AppointmentsScreen() {
  const { currentUser } = useAuth();
  const { subjectId, subject, isSelf } = useSubject();
  const navigation = useNavigation<any>();
  const needsLink = currentUser?.role !== "ELDERLY" && !subjectId;

  const { appointments, isLoading, error, reload, requestAppointment, cancelRequest } = useAppointments();
  // Kết quả đo tại bệnh viện của buổi khám đang xem (không chặn màn hình nếu tải lỗi).
  const { metrics, reload: reloadMetrics } = useHealthMetrics();

  const [detail, setDetail] = useState<Appointment | null>(null);
  const [requestVisible, setRequestVisible] = useState(false);
  // Chỉ tải danh sách bác sĩ khi mở form đặt lịch.
  const assignedDoctors = useAssignedDoctors(requestVisible);

  const results = useMemo(
    () => (detail ? metrics.filter((m) => m.appointmentId === detail.id) : []),
    [metrics, detail]
  );

  const pullToRefresh = usePullToRefresh(
    useCallback(() => Promise.all([reload(), reloadMetrics()]), [reload, reloadMetrics])
  );

  const handleSubmit = async (input: AppointmentRequestInput) => {
    await requestAppointment(input);
    setRequestVisible(false);
    Alert.alert("Đã gửi yêu cầu", "Nhân viên y tế sẽ xác nhận lịch khám. Bạn có thể xem trạng thái ở mục \"Đang chờ xác nhận\".");
  };

  const confirmCancel = (appointment: Appointment) => {
    Alert.alert("Hủy yêu cầu đặt lịch?", "Yêu cầu này sẽ không được gửi tới nhân viên y tế nữa.", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy yêu cầu",
        style: "destructive",
        onPress: () =>
          cancelRequest(appointment.id)
            .then(() => setDetail(null))
            .catch((e) => alertError(e)),
      },
    ]);
  };

  if (needsLink) {
    return (
      <View style={commonStyles.screen}>
        <NoLinkedElderlyState onLink={() => navigation.navigate("Main", { screen: "Profile" })} />
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={commonStyles.scrollContent} showsVerticalScrollIndicator={false} {...pullToRefresh.scrollProps}>
          <View style={commonStyles.hero}>
            <HeroBlobs />
            <Text style={commonStyles.heroTitle}>Thông tin lịch khám</Text>
            <View style={styles.switcherRow}>
              <ElderlySwitcher variant="onPrimary" />
            </View>
          </View>

          <View style={commonStyles.sections}>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => setRequestVisible(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={26} color={colors.surface} />
              <Text style={styles.requestText}>Đặt lịch tái khám</Text>
            </TouchableOpacity>

            <AppointmentSection
              appointments={appointments}
              onSelect={setDetail}
              onOpenHistory={() => navigation.navigate("AppointmentHistory")}
            />
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <AppointmentDetailModal
        appointment={detail}
        results={results}
        onClose={() => setDetail(null)}
        onCancelRequest={confirmCancel}
      />
      <RequestAppointmentModal
        visible={requestVisible}
        elderlyName={isSelf ? undefined : subject?.name}
        doctors={assignedDoctors.doctors}
        isLoadingDoctors={assignedDoctors.isLoading}
        doctorsError={assignedDoctors.error}
        onRetryDoctors={assignedDoctors.reload}
        onClose={() => setRequestVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  switcherRow: { marginTop: 12 },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  requestText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
