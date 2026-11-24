import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { METRIC_LABEL } from "../../constants/healthMetric";
import {
  APPOINTMENT_EVE_REMINDER_HOUR,
  APPOINTMENT_REMINDER_HOURS_BEFORE,
} from "../../constants/notification";
import type { Appointment } from "../../types/appointment";
import type { HealthMetric } from "../../types/health";
import { countdownText, directionsUrl } from "../../utils/appointment";
import { daysFromToday, formatLongDate, fromDateKey } from "../../utils/date";
import { formatMetricValue } from "../../utils/metric";
import AppointmentStatusBadge from "./AppointmentStatusBadge";

type Props = {
  appointment: Appointment | null;
  // Chỉ số đo tại bệnh viện gắn với lịch khám này (hiện ở buổi đã khám).
  results: HealthMetric[];
  onClose: () => void;
  // Hủy yêu cầu đặt lịch đang chờ xác nhận (không truyền → không hiện nút).
  onCancelRequest?: (appointment: Appointment) => void;
  // Bác sĩ xem: hiện tên bệnh nhân, ẩn lời nhắc dành cho bệnh nhân; yêu cầu chờ duyệt có nút Từ chối / Xác nhận.
  staffView?: StaffView;
};

type StaffView = {
  patientName: string;
  onApprove?: () => void;
  onReject?: () => void;
};

export default function AppointmentDetailModal({ appointment, results, onClose, onCancelRequest, staffView }: Props) {
  return (
    <Modal visible={!!appointment} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Đóng" />
        {appointment ? (
          <DetailSheet
            appointment={appointment}
            results={results}
            onClose={onClose}
            onCancelRequest={onCancelRequest}
            staffView={staffView}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function DetailSheet({
  appointment,
  results,
  onClose,
  onCancelRequest,
  staffView,
}: {
  appointment: Appointment;
  results: HealthMetric[];
  onClose: () => void;
  onCancelRequest?: (appointment: Appointment) => void;
  staffView?: StaffView;
}) {
  const date = fromDateKey(appointment.date);
  const days = daysFromToday(date);
  const isUpcoming = appointment.status === "UPCOMING" && days >= 0;
  const isPending = appointment.status === "REQUESTED" && days >= 0;

  return (
    <View style={styles.sheet}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppointmentStatusBadge status={appointment.status} />
          {isUpcoming ? <Text style={styles.countdown}>{countdownText(days)}</Text> : null}
        </View>

        <View style={styles.when}>
          <Ionicons name="calendar" size={24} color={colors.info} style={styles.whenIcon} />
          <Text style={styles.whenText}>
            {appointment.time} · {formatLongDate(date)}
          </Text>
        </View>

        <View style={styles.divider} />

        {staffView ? <DetailRow icon="person-circle-outline" label="Bệnh nhân" value={staffView.patientName} /> : null}
        <DetailRow icon="business-outline" label="Cơ sở y tế" value={appointment.facility} />
        {appointment.doctor && !staffView ? <DetailRow icon="person-outline" label="Bác sĩ" value={appointment.doctor} /> : null}
        {appointment.reason ? (
          <DetailRow icon="document-text-outline" label="Nội dung khám" value={appointment.reason} />
        ) : null}
        {appointment.note ? <DetailRow icon="chatbox-ellipses-outline" label="Ghi chú" value={appointment.note} /> : null}

        {/* Lời dặn bác sĩ ghi khi xác nhận lịch — nổi bật để người cao tuổi / người nhà không bỏ sót. */}
        {appointment.staffNote ? (
          <View style={styles.staffNote}>
            <View style={styles.staffNoteHeader}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
              <Text style={styles.staffNoteTitle}>Lời dặn của bác sĩ</Text>
            </View>
            <Text style={styles.staffNoteText}>{appointment.staffNote}</Text>
          </View>
        ) : null}

        {isPending && !staffView ? (
          <View style={styles.note}>
            <Ionicons name="hourglass-outline" size={22} color={colors.primary} />
            <Text style={styles.noteText}>
              Yêu cầu đã được gửi. Nhân viên y tế sẽ xác nhận lịch; bạn sẽ được nhắc lịch sau khi lịch được xác nhận.
            </Text>
          </View>
        ) : null}

        {appointment.status === "REJECTED" ? (
          <View style={[styles.note, styles.noteDanger]}>
            <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
            <Text style={styles.noteText}>
              Lịch này chưa được nhận{appointment.rejectReason ? `: ${appointment.rejectReason}` : ""}. Bạn có thể đặt
              lịch vào thời gian khác.
            </Text>
          </View>
        ) : null}

        {isUpcoming && !staffView ? (
          <View style={styles.note}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            <Text style={styles.noteText}>
              Bạn sẽ được nhắc lúc {APPOINTMENT_EVE_REMINDER_HOUR}:00 tối hôm trước và {APPOINTMENT_REMINDER_HOURS_BEFORE} giờ
              trước giờ khám. Nhớ mang theo thẻ BHYT, sổ khám và đơn thuốc đang dùng.
            </Text>
          </View>
        ) : null}

        {appointment.status === "COMPLETED" ? (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Kết quả đo tại buổi khám</Text>
            {results.length === 0 ? (
              <Text style={styles.muted}>Chưa có kết quả đo được ghi nhận.</Text>
            ) : (
              results.map((m) => (
                <View key={m.id} style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{METRIC_LABEL[m.type]}</Text>
                  <Text style={styles.resultValue}>
                    {formatMetricValue(m.value)} {m.unit}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {isPending && staffView?.onApprove && staffView.onReject ? (
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[styles.reviewButton, styles.rejectButton]}
              onPress={staffView.onReject}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.rejectText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reviewButton, styles.approveButton]}
              onPress={staffView.onApprove}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={20} color={colors.surface} />
              <Text style={styles.approveText}>Xác nhận lịch</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.actions}>
          {appointment.facilityPhone && !staffView ? (
            <ActionButton
              icon="call"
              label={`Gọi ${appointment.facility}`}
              onPress={() => Linking.openURL(`tel:${appointment.facilityPhone!.replace(/\s/g, "")}`)}
            />
          ) : null}
          {isUpcoming && !staffView ? (
            <ActionButton
              icon="navigate"
              label="Chỉ đường đến nơi khám"
              onPress={() => Linking.openURL(directionsUrl(appointment.facility))}
            />
          ) : null}
        </View>

        {isPending && onCancelRequest ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onCancelRequest(appointment)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Hủy yêu cầu</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.closeText}>Đóng</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.primary} style={styles.rowIcon} />
      <View style={styles.rowTextCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.actionText} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: { padding: 22, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  countdown: { fontSize: typography.body, fontWeight: "800", color: colors.info },
  // Giờ và ngày khám trên cùng một dòng (xuống dòng tự nhiên nếu màn hình hẹp).
  when: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  whenIcon: { marginTop: 2 },
  whenText: { flex: 1, fontSize: typography.h2, lineHeight: 28, fontWeight: "700", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: "row", gap: 12 },
  rowIcon: { marginTop: 2 },
  rowTextCol: { flex: 1, gap: 2 },
  label: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  value: { fontSize: typography.body, color: colors.text },
  note: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },
  noteDanger: { backgroundColor: colors.dangerLight },
  staffNote: {
    gap: 6,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  staffNoteHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  staffNoteTitle: { fontSize: typography.body, fontWeight: "800", color: colors.primary },
  staffNoteText: { fontSize: typography.body, lineHeight: 26, color: colors.text },
  noteText: { flex: 1, fontSize: typography.body, color: colors.text, lineHeight: 26 },
  results: { gap: 8, padding: 14, borderRadius: 14, backgroundColor: colors.background },
  resultsTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  resultRow: { flexDirection: "row", justifyContent: "space-between" },
  resultLabel: { fontSize: typography.body, color: colors.textMuted },
  resultValue: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  muted: { fontSize: typography.body, color: colors.textMuted },
  actions: { gap: 10 },
  reviewActions: { flexDirection: "row", gap: 10 },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  rejectButton: { backgroundColor: colors.background },
  rejectText: { fontSize: typography.body, fontWeight: "700", color: colors.danger },
  approveButton: { flex: 1, backgroundColor: colors.primary },
  approveText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  actionText: { flexShrink: 1, fontSize: typography.body, fontWeight: "700", color: colors.primary },
  cancelButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  cancelText: { fontSize: typography.body, fontWeight: "700", color: colors.danger },
  closeButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  closeText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
