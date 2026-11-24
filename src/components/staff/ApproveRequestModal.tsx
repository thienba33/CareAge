import React, { useEffect, useState } from "react";
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
import { APPROVE_NOTE_SUGGESTIONS } from "../../constants/appointmentRequest";
import type { StaffAppointment } from "../../types/staff";
import { formatLongDate, fromDateKey } from "../../utils/date";

const MAX_NOTE = 500;

type Props = {
  appointment: StaffAppointment | null;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
};

// Xác nhận lịch khám kèm lời dặn (không bắt buộc) — lời dặn hiện trong chi tiết lịch của người cao tuổi
// và được gửi kèm thông báo cho người thân.
export default function ApproveRequestModal({ appointment, onClose, onSubmit }: Props) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!appointment) return;
    setNote("");
    setError(null);
  }, [appointment]);

  // Bấm gợi ý: thêm thành một dòng mới; bấm lần nữa thì bỏ dòng đó.
  const toggleSuggestion = (text: string) => {
    const lines = note.split("\n").map((l) => l.trim()).filter(Boolean);
    const next = lines.includes(text) ? lines.filter((l) => l !== text) : [...lines, text];
    setNote(next.join("\n").slice(0, MAX_NOTE));
  };

  const submit = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(note.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xác nhận được. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const lines = note.split("\n").map((l) => l.trim());

  return (
    <Modal visible={!!appointment} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Đóng" />
        {appointment ? (
          <View style={styles.popup}>
            <View style={styles.header}>
              <Text style={styles.title}>Xác nhận lịch khám</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
                <Ionicons name="close" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <View style={styles.summary}>
                <Text style={styles.patient}>{appointment.patientName}</Text>
                <Text style={styles.summaryText}>
                  <Text style={styles.bold}>{appointment.time}</Text> · {formatLongDate(fromDateKey(appointment.date))}
                </Text>
                <Text style={styles.summaryText}>{appointment.reason ?? "Tái khám"}</Text>
              </View>

              <Text style={styles.label}>Lời dặn cho bệnh nhân và người nhà</Text>
              <Text style={styles.hint}>Không bắt buộc. Người nhà nhận kèm thông báo, người cao tuổi xem trong chi tiết lịch.</Text>
              <View style={styles.chips}>
                {APPROVE_NOTE_SUGGESTIONS.map((s) => {
                  const active = lines.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleSuggestion(s)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      {active ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="Ví dụ: Mang theo kết quả xét nghiệm lần trước"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={MAX_NOTE}
              />
              <Text style={styles.counter}>
                {note.length}/{MAX_NOTE}
              </Text>
            </ScrollView>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.confirmButton, isSaving && styles.disabled]}
              onPress={submit}
              disabled={isSaving}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={colors.surface} />
                  <Text style={styles.confirmText}>{note.trim() ? "Xác nhận và gửi lời dặn" : "Xác nhận lịch"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: 16 },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  popup: { maxHeight: "90%", gap: 12, padding: 16, borderRadius: 24, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  content: { gap: 10 },
  summary: { gap: 2, padding: 12, borderRadius: 14, backgroundColor: colors.background },
  patient: { fontSize: typography.body, fontWeight: "800", color: colors.text },
  summaryText: { fontSize: typography.caption, color: colors.text },
  bold: { fontWeight: "800" },
  label: { fontSize: typography.body, fontWeight: "700", color: colors.text, marginTop: 4 },
  hint: { fontSize: typography.caption, color: colors.textMuted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: typography.caption, color: colors.text },
  chipTextActive: { fontWeight: "700", color: colors.primary },
  input: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  counter: { alignSelf: "flex-end", fontSize: 12, color: colors.textMuted },
  error: { fontSize: typography.body, fontWeight: "600", color: colors.danger },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  disabled: { opacity: 0.6 },
  confirmText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
