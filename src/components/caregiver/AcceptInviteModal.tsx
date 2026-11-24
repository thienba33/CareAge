import { AppButton } from "../common";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { RELATIONSHIP_LABEL, RELATIONSHIPS } from "../../constants/caregiver";
import { caregiverService } from "../../services";
import type { CaregiverRelationship } from "../../types/caregiver";

type Props = {
  visible: boolean;
  onClose: () => void;
  // Liên kết thành công: trả tên người cao tuổi để màn hình làm mới danh sách và chọn người đó.
  onLinked: (elderlyName: string) => void;
};

// Người thân nhập mã 6 số do người cao tuổi tạo.
export default function AcceptInviteModal({ visible, onClose, onLinked }: Props) {
  const [code, setCode] = useState("");
  const [relationship, setRelationship] = useState<CaregiverRelationship>("CHILD");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCode("");
      setError(null);
    }
  }, [visible]);

  const submit = async () => {
    if (code.length !== 6) {
      setError("Mã gồm 6 chữ số.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await caregiverService.acceptInvite(code, relationship);
      if (result.status === "LINKED") {
        onLinked(result.elderlyName);
      } else if (result.status === "LOCKED") {
        setError("Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.");
      } else {
        setError("Mã không đúng hoặc đã hết hạn. Nhờ người cao tuổi tạo mã mới.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không liên kết được. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Nhập mã liên kết</Text>
          <Text style={styles.text}>Nhờ người cao tuổi mở Hồ sơ → "Mời người thân" để lấy mã 6 số.</Text>

          {/* Ô nhập mã 6 số */}
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="______"
            placeholderTextColor={colors.border}
            autoFocus
            accessibilityLabel="Mã liên kết 6 số"
          />

          {/* Chọn quan hệ */}
          <Text style={styles.label}>Bạn là gì của người cao tuổi?</Text>
          <View style={styles.chips}>
            {RELATIONSHIPS.map((r) => {
              const isActive = r === relationship;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setRelationship(r)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{RELATIONSHIP_LABEL[r]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Thông báo lỗi */}
          {error ? (
            <View style={commonStyles.errorBox}>
              <Text style={commonStyles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Nút liên kết */}
          <AppButton
            title="Liên kết"
            onPress={submit}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={code.length !== 6}
          />

          {/* Nút huỷ */}
          <AppButton
            title="Huỷ"
            onPress={onClose}
            variant="ghost"
            size="md"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { gap: 14, padding: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  text: { fontSize: typography.body, lineHeight: 26, color: colors.textMuted },
  codeInput: {
    minHeight: 72,
    textAlign: "center",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 10,
    color: colors.text,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  label: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: typography.body, color: colors.textMuted },
  chipTextActive: { fontWeight: "700", color: colors.primaryDark },
});
