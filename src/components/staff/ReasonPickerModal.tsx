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

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  reasons: string[];
  // Giải thích hậu quả của thao tác (hiện trên nút xác nhận).
  warning?: string;
  confirmLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
};

const CUSTOM = "__custom__";

// Popup chọn lý do có sẵn hoặc tự nhập rồi xác nhận — dùng cho từ chối yêu cầu đặt lịch, kết thúc theo dõi bệnh nhân.
export default function ReasonPickerModal({
  visible,
  title,
  subtitle,
  reasons,
  warning,
  confirmLabel,
  onClose,
  onSubmit,
}: Props) {
  const [choice, setChoice] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setChoice(null);
    setCustom("");
    setError(null);
  }, [visible]);

  const reason = choice === CUSTOM ? custom.trim() : choice ?? "";

  const submit = async () => {
    if (!reason) return setError("Vui lòng chọn hoặc nhập lý do.");
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(reason);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thực hiện được. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={styles.popup}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
              <Ionicons name="close" size={26} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Lý do</Text>
            {[...reasons, CUSTOM].map((option) => {
              const active = choice === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setChoice(option)}
                  activeOpacity={0.85}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={24} color={colors.primary} />
                  <Text style={styles.optionText}>{option === CUSTOM ? "Khác (tự nhập)" : option}</Text>
                </TouchableOpacity>
              );
            })}
            {choice === CUSTOM ? (
              <TextInput
                style={styles.input}
                value={custom}
                onChangeText={setCustom}
                placeholder="Nhập lý do..."
                placeholderTextColor={colors.textMuted}
                autoFocus
                multiline
                maxLength={500}
              />
            ) : null}
          </ScrollView>

          {warning ? (
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={22} color={colors.warning} />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.rejectButton, (!reason || isSaving) && styles.buttonDisabled]}
            onPress={submit}
            disabled={!reason || isSaving}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.rejectText}>{confirmLabel}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: 16 },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  popup: { maxHeight: "88%", gap: 12, padding: 16, borderRadius: 24, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: typography.body, color: colors.textMuted },
  label: { fontSize: typography.body, fontWeight: "700", color: colors.text, marginBottom: 4 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 12, borderRadius: 14 },
  optionActive: { backgroundColor: colors.primaryLight },
  optionText: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  input: {
    minHeight: 80,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: typography.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  warningBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.warningLight },
  warningText: { flex: 1, fontSize: typography.caption, lineHeight: 20, color: colors.text },
  error: { fontSize: typography.body, fontWeight: "600", color: colors.danger },
  rejectButton: { minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.danger },
  buttonDisabled: { opacity: 0.5 },
  rejectText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
