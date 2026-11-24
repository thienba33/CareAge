import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { BLOOD_TYPE_LABEL, GENDER_LABEL } from "../../constants/healthProfile";
import { CONDITION_CATEGORIES, CONDITION_CATEGORY_LABEL, CONDITION_STATUS_LABEL } from "../../constants/medicalCondition";
import { calculateAge, calculateBmi } from "../../utils/healthProfile";
import type { HealthProfile } from "../../types/healthProfile";
import type { MedicalCondition } from "../../types/medicalCondition";
import type { EmergencyContact } from "../../types";

type Props = {
  profile: HealthProfile | null;
  conditions: MedicalCondition[];
  contacts: EmergencyContact[];
};

// Hồ sơ sức khỏe chỉ xem của một người cao tuổi: dị ứng (lên đầu), thông tin cơ bản, bệnh nền & tiền sử,
// liên hệ khẩn cấp. Dùng chung cho màn của người thân và màn Hồ sơ bệnh nhân của bác sĩ.
export default function ElderlyHealthRecord({ profile, conditions, contacts }: Props) {
  const age = calculateAge(profile?.dateOfBirth);
  const bmi = calculateBmi(profile?.heightCm, profile?.weightKg);
  const allergies = conditions.filter((c) => c.category === "ALLERGY" && c.status === "ACTIVE");

  return (
    <View style={styles.container}>
      {/* Dị ứng lên đầu: thông tin cần biết ngay khi đưa đi khám / cấp cứu. */}
      {allergies.length > 0 ? (
        <View style={[styles.card, styles.allergyCard]}>
          <View style={styles.row}>
            <Ionicons name="warning" size={22} color={colors.danger} />
            <Text style={styles.sectionTitle}>Dị ứng</Text>
          </View>
          {allergies.map((a) => (
            <Text key={a.id} style={styles.body}>
              • {a.name}
              {a.note ? ` — ${a.note}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.heading}>Hồ sơ sức khỏe</Text>
      <View style={styles.card}>
        <InfoRow label="Tuổi" value={age !== null ? `${age}` : "--"} />
        <InfoRow label="Giới tính" value={profile?.gender ? GENDER_LABEL[profile.gender] : "--"} />
        <InfoRow label="Nhóm máu" value={profile?.bloodType ? BLOOD_TYPE_LABEL[profile.bloodType] : "--"} />
        <InfoRow label="Chiều cao" value={profile?.heightCm ? `${profile.heightCm} cm` : "--"} />
        <InfoRow label="Cân nặng" value={profile?.weightKg ? `${profile.weightKg} kg` : "--"} />
        <InfoRow label="BMI" value={bmi !== null ? bmi.toFixed(1) : "--"} />
        <InfoRow label="Địa chỉ" value={profile?.address ?? "--"} isLast />
      </View>

      <Text style={styles.heading}>Bệnh nền & Tiền sử</Text>
      {CONDITION_CATEGORIES.filter((c) => c !== "ALLERGY").map((category) => {
        const items = conditions.filter((c) => c.category === category);
        return (
          <View key={category} style={styles.card}>
            <Text style={styles.sectionTitle}>{CONDITION_CATEGORY_LABEL[category]}</Text>
            {items.length === 0 ? (
              <Text style={styles.muted}>Chưa có mục nào.</Text>
            ) : (
              items.map((c) => (
                <Text key={c.id} style={styles.body}>
                  • {c.name} <Text style={styles.muted}>({CONDITION_STATUS_LABEL[c.status]})</Text>
                </Text>
              ))
            )}
          </View>
        );
      })}

      <Text style={styles.heading}>Liên hệ khẩn cấp</Text>
      <View style={styles.card}>
        {contacts.length === 0 ? (
          <Text style={styles.muted}>Chưa có liên hệ nào.</Text>
        ) : (
          contacts.map((c) => (
            <View key={c.id} style={styles.contactRow}>
              <View style={styles.flex}>
                <Text style={styles.body}>{c.name}</Text>
                <Text style={styles.muted}>{c.relationship}</Text>
              </View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => Linking.openURL(`tel:${c.phone}`)}
                accessibilityRole="button"
                accessibilityLabel={`Gọi ${c.name}`}
              >
                <Ionicons name="call" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

    </View>
  );
}

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.divider]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  flex: { flex: 1 },
  card: { gap: 8, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  allergyCard: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { fontSize: typography.h2, fontWeight: "700", color: colors.text, marginTop: 8 },
  sectionTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  body: { fontSize: typography.body, lineHeight: 26, color: colors.text },
  muted: { fontSize: typography.caption, color: colors.textMuted },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 8 },
  infoValue: { flexShrink: 1, fontSize: typography.body, fontWeight: "700", color: colors.text, textAlign: "right" },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: colors.background },
});
