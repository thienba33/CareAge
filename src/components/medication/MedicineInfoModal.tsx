import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import type { Medication } from "../../types/medication";

type Props = {
  medication: Medication | null;
  onClose: () => void;
};

// Giới thiệu chung về thuốc (thuốc này là gì, thành phần, chữa bệnh gì) —
// khác với MedicationDetailModal vốn hiển thị lịch uống (giờ giấc, hướng dẫn sử dụng).
export default function MedicineInfoModal({ medication, onClose }: Props) {
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
                  {medication.activeIngredient ? (
                    <Text style={styles.ingredient}>{medication.activeIngredient}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {medication.description ? (
                <Text style={styles.description}>{medication.description}</Text>
              ) : null}

              {medication.indication ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Công dụng</Text>
                  <Text style={styles.sectionValue}>{medication.indication}</Text>
                </View>
              ) : null}

              {!medication.description && !medication.indication ? (
                <Text style={styles.description}>Chưa có thông tin giới thiệu cho thuốc này.</Text>
              ) : null}
            </>
          ) : null}
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
  ingredient: { fontSize: typography.caption, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border },
  description: { fontSize: typography.body, color: colors.text, lineHeight: 22 },
  section: { gap: 4 },
  sectionLabel: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  sectionValue: { fontSize: typography.body, color: colors.text, lineHeight: 22 },
});
