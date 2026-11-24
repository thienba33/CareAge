import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
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
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

// Ô chọn "Nội dung khám" dạng select: bấm vào → popup danh sách có sẵn, chọn một dòng là xong;
// dòng cuối "Khác (tự nhập)" mở ô nhập tay. Không bắt buộc — có nút xoá lựa chọn.
export default function ReasonSelect({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");

  const isCustom = !!value && !options.includes(value);

  const openSelect = () => {
    setTyping(isCustom);
    setDraft(isCustom ? value : "");
    setOpen(true);
  };

  const pick = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  const confirmCustom = () => {
    if (!draft.trim()) return;
    pick(draft.trim());
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, !!value && styles.fieldFilled]}
        onPress={openSelect}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={value ? `Nội dung khám: ${value}. Bấm để đổi` : "Chọn nội dung khám"}
      >
        <Ionicons name="document-text-outline" size={24} color={value ? colors.primary : colors.textMuted} />
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]} numberOfLines={2}>
          {value || "Chọn nội dung khám"}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Xoá nội dung khám">
            <Ionicons name="close-circle" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} accessibilityLabel="Đóng" />
          <View style={styles.popup}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Nội dung khám</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
                <Ionicons name="close" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = !typing && value === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => pick(option)}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={24} color={colors.primary} />
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.option, typing && styles.optionActive]}
                onPress={() => setTyping(true)}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected: typing }}
              >
                <Ionicons name={typing ? "radio-button-on" : "radio-button-off"} size={24} color={colors.primary} />
                <Text style={styles.optionText}>Khác (tự nhập)</Text>
              </TouchableOpacity>

              {typing ? (
                <View style={styles.customBox}>
                  <TextInput
                    style={styles.input}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Ví dụ: Tái khám mắt"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    maxLength={200}
                    returnKeyType="done"
                    onSubmitEditing={confirmCustom}
                  />
                  <TouchableOpacity
                    style={[styles.confirmButton, !draft.trim() && styles.confirmButtonDisabled]}
                    onPress={confirmCustom}
                    disabled={!draft.trim()}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    <Text style={styles.confirmText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  fieldText: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  fieldPlaceholder: { fontWeight: "400", color: colors.textMuted },
  overlay: { flex: 1, justifyContent: "center", padding: 16 },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  popup: { maxHeight: "85%", gap: 8, padding: 16, borderRadius: 24, backgroundColor: colors.surface },
  popupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  popupTitle: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 12, borderRadius: 14 },
  optionActive: { backgroundColor: colors.primaryLight },
  optionText: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  customBox: { gap: 10, marginTop: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: typography.body,
    color: colors.text,
  },
  confirmButton: { minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.primary },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
