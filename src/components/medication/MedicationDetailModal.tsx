import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { MEDICATION_STATUS_LABEL } from "../../constants/medicationStatus";
import type { Medication } from "../../types/medication";

type Props = {
  medication: Medication | null;
  onClose: () => void;
};

export default function MedicationDetailModal({ medication, onClose }: Props) {
  return (
    <Modal visible={!!medication} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          {medication ? (
            <>
              <View style={styles.header}>
                <View style={styles.icon}>
                  <Ionicons name="medkit" size={22} color={colors.primary} />
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={styles.name}>{medication.name}</Text>
                  <Text style={styles.dosage}>
                    {medication.dosage}{medication.unit}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <DetailRow icon="time-outline" label="Giờ uống trong ngày">
                <View style={styles.timeChips}>
                  {medication.times.map((time) => (
                    <View key={time} style={styles.timeChip}>
                      <Text style={styles.timeChipText}>{time}</Text>
                    </View>
                  ))}
                </View>
              </DetailRow>

              <DetailRow icon="repeat-outline" label="Số lần/ngày">
                <Text style={styles.value}>{medication.frequency} lần</Text>
              </DetailRow>

              <DetailRow icon="document-text-outline" label="Hướng dẫn sử dụng">
                <Text style={styles.value}>
                  {medication.instructions || "Không có hướng dẫn cụ thể"}
                </Text>
              </DetailRow>

              <DetailRow icon="calendar-outline" label="Thời gian dùng">
                <Text style={styles.value}>
                  Từ {medication.startDate}
                  {medication.endDate ? ` đến ${medication.endDate}` : " (chưa có ngày kết thúc)"}
                </Text>
              </DetailRow>

              <DetailRow icon="checkmark-circle-outline" label="Trạng thái">
                <Text style={styles.value}>{MEDICATION_STATUS_LABEL[medication.status]}</Text>
              </DetailRow>
            </>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.primary} style={styles.rowIcon} />
      <View style={styles.rowTextCol}>
        <Text style={styles.label}>{label}</Text>
        {children}
      </View>
    </View>
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
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: { flex: 1, gap: 2 },
  name: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  dosage: { fontSize: typography.caption, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: "row", gap: 12 },
  rowIcon: { marginTop: 2 },
  rowTextCol: { flex: 1, gap: 4 },
  label: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  value: { fontSize: typography.body, color: colors.text },
  timeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeChipText: { fontSize: typography.caption, fontWeight: "700", color: colors.primaryDark },
});
