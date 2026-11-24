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
import {
  ACADEMIC_TITLES,
  ACADEMIC_TITLE_LABEL,
  DEGREE_LABEL,
  SPECIALTY_SUGGESTIONS,
  STAFF_DEGREES,
} from "../../constants/staff";
import type { StaffProfile } from "../../types/staff";

type Props = {
  visible: boolean;
  profile: StaffProfile | null;
  onClose: () => void;
  onSubmit: (input: StaffProfile) => Promise<void>;
};

type Form = {
  academicTitle?: StaffProfile["academicTitle"];
  degree?: StaffProfile["degree"];
  specialty: string;
  department: string;
  room: string;
  licenseNumber: string;
  yearsExperience: string;
  workingHours: string;
  bio: string;
  workplace: string;
  workplacePhone: string;
};

const toForm = (p: StaffProfile | null): Form => ({
  academicTitle: p?.academicTitle,
  degree: p?.degree,
  specialty: p?.specialty ?? "",
  department: p?.department ?? "",
  room: p?.room ?? "",
  licenseNumber: p?.licenseNumber ?? "",
  yearsExperience: p?.yearsExperience !== undefined ? String(p.yearsExperience) : "",
  workingHours: p?.workingHours ?? "",
  bio: p?.bio ?? "",
  workplace: p?.workplace ?? "",
  workplacePhone: p?.workplacePhone ?? "",
});

// Sửa hồ sơ chuyên môn của bác sĩ: học hàm / học vị, chuyên khoa, kinh nghiệm, chứng chỉ; nơi làm việc; giới thiệu.
export default function EditStaffProfileModal({ visible, profile, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Form>(() => toForm(profile));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(toForm(profile));
    setError(null);
  }, [visible, profile]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const years = form.yearsExperience.trim();
    if (years && !/^\d{1,2}$/.test(years)) return setError("Số năm kinh nghiệm phải là số từ 0 đến 70.");
    if (years && Number(years) > 70) return setError("Số năm kinh nghiệm phải là số từ 0 đến 70.");
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        academicTitle: form.academicTitle,
        degree: form.degree,
        specialty: form.specialty,
        department: form.department,
        room: form.room,
        licenseNumber: form.licenseNumber,
        yearsExperience: years ? Number(years) : undefined,
        workingHours: form.workingHours,
        bio: form.bio,
        workplace: form.workplace,
        workplacePhone: form.workplacePhone,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được. Vui lòng thử lại.");
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
            <Text style={styles.title}>Hồ sơ chuyên môn</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
              <Ionicons name="close" size={26} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.group}>Chuyên môn</Text>

            <Field label="Học vị">
              <Chips
                options={STAFF_DEGREES.map((d) => ({ value: d, label: DEGREE_LABEL[d] }))}
                value={form.degree}
                onChange={(v) => set("degree", v)}
              />
            </Field>
            <Field label="Học hàm (nếu có)">
              <Chips
                options={ACADEMIC_TITLES.map((t) => ({ value: t, label: ACADEMIC_TITLE_LABEL[t] }))}
                value={form.academicTitle}
                onChange={(v) => set("academicTitle", v)}
              />
            </Field>
            <Field label="Chuyên khoa">
              <Input value={form.specialty} onChangeText={(v) => set("specialty", v)} placeholder="Nội tổng quát" maxLength={100} />
              <View style={styles.chips}>
                {SPECIALTY_SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, form.specialty === s && styles.chipActive]}
                    onPress={() => set("specialty", s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, form.specialty === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
            <View style={styles.row}>
              <Field label="Số năm kinh nghiệm" style={styles.rowItem}>
                <Input
                  value={form.yearsExperience}
                  onChangeText={(v) => set("yearsExperience", v.replace(/[^\d]/g, ""))}
                  placeholder="10"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </Field>
              <Field label="Số chứng chỉ hành nghề" style={styles.rowItemWide}>
                <Input value={form.licenseNumber} onChangeText={(v) => set("licenseNumber", v)} placeholder="001234/HNO-CCHN" maxLength={50} />
              </Field>
            </View>

            <Text style={styles.group}>Nơi làm việc</Text>
            <Field label="Cơ sở y tế">
              <Input value={form.workplace} onChangeText={(v) => set("workplace", v)} placeholder="Phenikaamec" maxLength={200} />
            </Field>
            <View style={styles.row}>
              <Field label="Khoa" style={styles.rowItemWide}>
                <Input value={form.department} onChangeText={(v) => set("department", v)} placeholder="Khoa Khám bệnh" maxLength={100} />
              </Field>
              <Field label="Phòng khám" style={styles.rowItem}>
                <Input value={form.room} onChangeText={(v) => set("room", v)} placeholder="Phòng 203" maxLength={50} />
              </Field>
            </View>
            <Field label="Hotline cơ sở y tế">
              <Input
                value={form.workplacePhone}
                onChangeText={(v) => set("workplacePhone", v)}
                placeholder="1900 1000"
                keyboardType="phone-pad"
                maxLength={30}
              />
            </Field>
            <Field label="Giờ làm việc">
              <Input
                value={form.workingHours}
                onChangeText={(v) => set("workingHours", v)}
                placeholder="Thứ 2 – Thứ 6: 7:30 – 16:30"
                maxLength={200}
              />
            </Field>

            <Text style={styles.group}>Giới thiệu</Text>
            <Field label={`Giới thiệu ngắn (${form.bio.length}/1000)`}>
              <Input
                value={form.bio}
                onChangeText={(v) => set("bio", v)}
                placeholder="Kinh nghiệm, lĩnh vực theo dõi chính..."
                multiline
                maxLength={1000}
                style={styles.bioInput}
              />
            </Field>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabled]}
              onPress={submit}
              disabled={isSaving}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>Lưu hồ sơ</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, style, children }: { label: string; style?: object; children: React.ReactNode }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;
}

// Chọn một (bấm lại để bỏ chọn).
function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value?: T;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(active ? undefined : o.value)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  group: { fontSize: typography.caption, fontWeight: "800", color: colors.primary, textTransform: "uppercase", marginTop: 6 },
  field: { gap: 6 },
  label: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  row: { flexDirection: "row", gap: 10 },
  rowItem: { flex: 1 },
  rowItemWide: { flex: 1.6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: typography.body,
    color: colors.text,
  },
  bioInput: { minHeight: 100, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: typography.caption, color: colors.text },
  chipTextActive: { fontWeight: "700", color: colors.primary },
  error: { fontSize: typography.body, fontWeight: "600", color: colors.danger },
  saveButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.primary },
  disabled: { opacity: 0.6 },
  saveText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
