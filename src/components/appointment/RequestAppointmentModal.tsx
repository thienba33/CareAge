import React, { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, typography } from "../../theme/colors";
import { REQUEST_DAYS_AHEAD, REQUEST_REASON_SUGGESTIONS, REQUEST_TIME_SLOTS } from "../../constants/appointmentRequest";
import { requestDateOptions } from "../../utils/appointment";
import { toDateKey } from "../../utils/date";
import type { AppointmentRequestInput, AssignedDoctor } from "../../types/appointment";
import RequestDateTimePicker from "./RequestDateTimePicker";
import { formatDoctorName } from "../../utils/staff";
import ReasonSelect from "./ReasonSelect";

type Props = {
  visible: boolean;
  // Người được đặt lịch (hiện ở tiêu đề khi người thân đặt hộ).
  elderlyName?: string;
  // Bác sĩ đang phụ trách — cơ sở y tế đi theo nơi làm việc của bác sĩ được chọn.
  doctors: AssignedDoctor[];
  isLoadingDoctors: boolean;
  doctorsError: string | null;
  onRetryDoctors: () => void;
  onClose: () => void;
  onSubmit: (input: AppointmentRequestInput) => Promise<void>;
};

// Form gửi yêu cầu đặt lịch tái khám: chọn bác sĩ phụ trách (cơ sở y tế theo nơi làm việc của bác sĩ, hiện ngay trên thẻ),
// rồi thời gian khám (ngày + khung giờ) trong một popup lịch (dễ cho người cao tuổi).
export default function RequestAppointmentModal({
  visible,
  elderlyName,
  doctors,
  isLoadingDoctors,
  doctorsError,
  onRetryDoctors,
  onClose,
  onSubmit,
}: Props) {
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const now = useMemo(() => new Date(), [visible]);
  const dates = useMemo(() => requestDateOptions(REQUEST_DAYS_AHEAD, now), [now]);

  // Chỉ bác sĩ đã có nơi làm việc mới chọn được (Backend cần nơi làm việc làm cơ sở y tế).
  const selectable = useMemo(() => doctors.filter((d) => !!d.workplace), [doctors]);

  useEffect(() => {
    if (!visible) return;
    setDate(null);
    setTime(null);
    setReason("");
    setNote("");
    setError(null);
  }, [visible]);

  // Chỉ có một bác sĩ chọn được → chọn sẵn; bác sĩ đang chọn không còn trong danh sách → bỏ chọn.
  useEffect(() => {
    if (!visible) return;
    setStaffId((current) =>
      current && selectable.some((d) => d.id === current) ? current : selectable.length === 1 ? selectable[0].id : null
    );
  }, [visible, selectable]);

  const handleSubmit = async () => {
    if (!staffId) return setError("Vui lòng chọn bác sĩ.");
    if (!date || !time) return setError("Vui lòng chọn ngày và giờ khám.");
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        date: toDateKey(date),
        time,
        staffId,
        reason: reason.trim() || undefined,
        note: note.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Đặt lịch tái khám</Text>
              {elderlyName ? <Text style={styles.subtitle}>Cho {elderlyName}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
              <Ionicons name="close" size={26} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.label}>Bác sĩ phụ trách</Text>
              {isLoadingDoctors ? (
                <View style={styles.inlineState}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.hint}>Đang tải danh sách bác sĩ…</Text>
                </View>
              ) : doctorsError ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{doctorsError}</Text>
                  <TouchableOpacity onPress={onRetryDoctors} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.retryText}>Thử lại</Text>
                  </TouchableOpacity>
                </View>
              ) : doctors.length === 0 ? (
                <View style={styles.noticeBox}>
                  <Ionicons name="information-circle" size={22} color={colors.info} />
                  <Text style={styles.noticeText}>
                    Chưa có bác sĩ phụ trách. Vui lòng liên hệ cơ sở y tế để được phân công bác sĩ trước khi đặt lịch.
                  </Text>
                </View>
              ) : (
                doctors.map((d) => {
                  const disabled = !d.workplace;
                  const active = d.id === staffId;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.doctorCard, active && styles.doctorCardActive, disabled && styles.chipDisabled]}
                      onPress={() => setStaffId(d.id)}
                      disabled={disabled}
                      activeOpacity={0.85}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active, disabled }}
                      accessibilityLabel={`${formatDoctorName(d.name, d.academicTitle, d.degree)}${d.specialty ? `, ${d.specialty}` : ""}, ${d.workplace ?? "chưa cập nhật nơi làm việc"}`}
                    >
                      <Ionicons
                        name={active ? "radio-button-on" : "radio-button-off"}
                        size={24}
                        color={disabled ? colors.textMuted : colors.primary}
                      />
                      <View style={styles.doctorText}>
                        <Text style={styles.doctorName}>{formatDoctorName(d.name, d.academicTitle, d.degree)}</Text>
                        {d.specialty || d.room ? (
                          <Text style={styles.doctorWorkplace} numberOfLines={1}>
                            {[d.specialty, d.room].filter(Boolean).join(" · ")}
                          </Text>
                        ) : null}
                        <View style={styles.doctorWorkplaceRow}>
                          <Ionicons name="business-outline" size={16} color={colors.textMuted} />
                          <Text style={styles.doctorWorkplace} numberOfLines={2}>
                            {d.workplace ?? "Chưa cập nhật nơi làm việc"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Thời gian khám</Text>
              <RequestDateTimePicker
                now={now}
                maxDate={dates[dates.length - 1]}
                timeSlots={REQUEST_TIME_SLOTS}
                date={date}
                time={time}
                onChange={(d, t) => {
                  setDate(d);
                  setTime(t);
                }}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nội dung khám (không bắt buộc)</Text>
              <ReasonSelect options={REQUEST_REASON_SUGGESTIONS} value={reason} onChange={setReason} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ghi chú cho nhân viên y tế (không bắt buộc)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="Triệu chứng, yêu cầu đi lại..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, (isSaving || selectable.length === 0) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSaving || selectable.length === 0}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitText}>Gửi yêu cầu</Text>}
            </TouchableOpacity>
            <Text style={styles.footnote}>Lịch sẽ ở trạng thái "Chờ xác nhận" cho đến khi nhân viên y tế xác nhận.</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 8 },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: typography.body, color: colors.textMuted },
  content: { paddingHorizontal: 22, paddingBottom: 32, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  hint: { fontSize: typography.body, color: colors.textMuted },
  chipDisabled: { opacity: 0.35 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: typography.body,
    color: colors.text,
  },
  inlineState: { flexDirection: "row", alignItems: "center", gap: 10 },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.infoLight,
  },
  noticeText: { flex: 1, fontSize: typography.body, color: colors.text },
  retryText: { fontSize: typography.body, fontWeight: "800", color: colors.primary },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  doctorCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  doctorText: { flex: 1, gap: 2 },
  doctorName: { fontSize: typography.body, fontWeight: "800", color: colors.text },
  doctorWorkplaceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  doctorWorkplace: { flexShrink: 1, fontSize: typography.body, color: colors.textMuted },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  error: { color: colors.danger, fontSize: typography.body, fontWeight: "600" },
  submitButton: { minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.primary },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
  footnote: { fontSize: typography.caption, color: colors.textMuted, textAlign: "center" },
});
