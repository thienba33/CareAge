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
import type { EmergencyContact } from "../../types";
import type { ContactInput } from "../../services";

type Props = {
  visible: boolean;
  editingContact: EmergencyContact | null;
  onClose: () => void;
  onSubmit: (input: ContactInput) => Promise<void>;
};

export default function ContactFormModal({ visible, editingContact, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(editingContact?.name ?? "");
      setRelationship(editingContact?.relationship ?? "");
      setPhone(editingContact?.phone ?? "");
      setError(null);
    }
  }, [visible, editingContact]);

  const handleSubmit = async () => {
    if (!name.trim() || !relationship.trim() || !phone.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({ name: name.trim(), relationship: relationship.trim(), phone: phone.trim() });
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
            <Text style={styles.title}>{editingContact ? "Sửa liên hệ" : "Thêm liên hệ"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mối quan hệ</Text>
            <TextInput
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="Con trai, con gái, bác sĩ..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="09xxxxxxxx"
              placeholderTextColor={colors.textMuted}
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
              <Text style={styles.submitButtonText}>{editingContact ? "Lưu thay đổi" : "Thêm liên hệ"}</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
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
  errorBox: {
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: colors.danger, fontSize: typography.caption, fontWeight: "600" },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: "800" },
});
