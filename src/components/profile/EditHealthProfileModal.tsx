import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { alertError } from "../../utils/alertError";
import { SAVE_ERROR_TITLE } from "../../constants/messages";
import { colors, typography } from "../../theme/colors";
import { BLOOD_TYPE_LABEL, BLOOD_TYPES, GENDERS, GENDER_LABEL } from "../../constants/healthProfile";
import type { BloodType, Gender, HealthProfile } from "../../types/healthProfile";

type Props = {
  visible: boolean;
  profile: HealthProfile | null;
  onClose: () => void;
  onSubmit: (input: Omit<HealthProfile, "userId">) => Promise<void>;
};

export default function EditHealthProfileModal({ visible, profile, onClose, onSubmit }: Props) {
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bloodType, setBloodType] = useState<BloodType | undefined>(undefined);
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDateOfBirth(profile?.dateOfBirth ?? "");
      setGender(profile?.gender);
      setHeightCm(profile?.heightCm ? String(profile.heightCm) : "");
      setWeightKg(profile?.weightKg ? String(profile.weightKg) : "");
      setBloodType(profile?.bloodType);
      setAddress(profile?.address ?? "");
    }
  }, [visible, profile]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSubmit({
        dateOfBirth: dateOfBirth.trim() || undefined,
        gender,
        heightCm: heightCm.trim() ? Number(heightCm) : undefined,
        weightKg: weightKg.trim() ? Number(weightKg) : undefined,
        bloodType,
        address: address.trim() || undefined,
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
            <Text style={styles.title}>Hồ sơ sức khỏe</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={styles.formGap}>
              <View style={styles.field}>
                <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="1955-03-12"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, gender === g && styles.chipActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                        {GENDER_LABEL[g]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>Chiều cao (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={heightCm}
                    onChangeText={setHeightCm}
                    keyboardType="number-pad"
                    placeholder="160"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>Cân nặng (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={weightKg}
                    onChangeText={setWeightKg}
                    keyboardType="decimal-pad"
                    placeholder="55"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Nhóm máu</Text>
                <View style={styles.chipRow}>
                  {BLOOD_TYPES.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.chip, bloodType === b && styles.chipActive]}
                      onPress={() => setBloodType(b)}
                    >
                      <Text style={[styles.chipText, bloodType === b && styles.chipTextActive]}>
                        {BLOOD_TYPE_LABEL[b]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Địa chỉ</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
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
    paddingBottom: 24,
    gap: 16,
    maxHeight: "85%",
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  scroll: { flexGrow: 0 },
  formGap: { gap: 16, paddingBottom: 4 },
  field: { gap: 6 },
  flex1: { flex: 1 },
  row: { flexDirection: "row", gap: 12 },
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
  submitButton: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 15, alignItems: "center" },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: "800" },
});
