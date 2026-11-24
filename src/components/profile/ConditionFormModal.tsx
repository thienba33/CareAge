import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { alertError } from "../../utils/alertError";
import { SAVE_ERROR_TITLE } from "../../constants/messages";
import { colors, typography } from "../../theme/colors";
import {
  CONDITION_CATEGORIES,
  CONDITION_CATEGORY_LABEL,
  CONDITION_STATUSES,
  CONDITION_STATUS_LABEL,
} from "../../constants/medicalCondition";
import type { ConditionInput } from "../../services";
import type { ConditionCategory, ConditionStatus, MedicalCondition } from "../../types/medicalCondition";

type Props = {
  visible: boolean;
  editingCondition: MedicalCondition | null;
  defaultCategory: ConditionCategory;
  onClose: () => void;
  onSubmit: (input: ConditionInput) => Promise<void>;
  onDelete?: (id: string) => void;
};

export default function ConditionFormModal({
  visible,
  editingCondition,
  defaultCategory,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [category, setCategory] = useState<ConditionCategory>(defaultCategory);
  const [name, setName] = useState("");
  const [diagnosedAt, setDiagnosedAt] = useState("");
  const [status, setStatus] = useState<ConditionStatus>("ACTIVE");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setCategory(editingCondition?.category ?? defaultCategory);
      setName(editingCondition?.name ?? "");
      setDiagnosedAt(editingCondition?.diagnosedAt ?? "");
      setStatus(editingCondition?.status ?? "ACTIVE");
      setNote(editingCondition?.note ?? "");
      setError(null);
    }
  }, [visible, editingCondition, defaultCategory]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        category,
        name: name.trim(),
        diagnosedAt: diagnosedAt.trim() || undefined,
        status,
        note: note.trim() || undefined,
      });
    } catch (e) {
      alertError(e, SAVE_ERROR_TITLE);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{editingCondition ? "Sửa mục" : "Thêm mục"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nhóm</Text>
            <View style={styles.chipRow}>
              {CONDITION_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                    {CONDITION_CATEGORY_LABEL[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tăng huyết áp, Penicillin..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ngày chẩn đoán (YYYY-MM-DD, không bắt buộc)</Text>
            <TextInput
              style={styles.input}
              value={diagnosedAt}
              onChangeText={setDiagnosedAt}
              placeholder="2024-02-20"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.chipRow}>
              {CONDITION_STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, status === s && styles.chipActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                    {CONDITION_STATUS_LABEL[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Ghi chú thêm..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitButtonText}>Lưu</Text>
            )}
          </TouchableOpacity>

          {editingCondition && onDelete ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(editingCondition.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.deleteButtonText}>Xoá mục này</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    gap: 16,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  field: { gap: 6 },
  label: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: "#FAFAF7",
  },
  noteInput: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.caption, fontWeight: "700", color: colors.text },
  chipTextActive: { color: colors.surface },
  errorBox: { backgroundColor: "#FDECEC", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  error: { color: colors.danger, fontSize: typography.caption, fontWeight: "600" },
  submitButton: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 15, alignItems: "center" },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: "800" },
  deleteButton: { alignItems: "center", paddingVertical: 8 },
  deleteButtonText: { color: colors.danger, fontSize: typography.caption, fontWeight: "700" },
});
