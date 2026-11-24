import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../theme/colors";
import { CHART_RANGES, type ChartRangeKey } from "../../constants/chartRange";

type Props = {
  value: ChartRangeKey;
  onChange: (key: ChartRangeKey) => void;
};

export default function RangeSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const currentRange = CHART_RANGES.find((r) => r.key === value) ?? CHART_RANGES[0];

  return (
    <>
      <TouchableOpacity
        style={styles.selectBtn}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Khoảng thời gian: ${currentRange.label}. Bấm để thay đổi`}
      >
        <Text style={styles.selectBtnText}>{currentRange.label}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn khoảng thời gian</Text>
                  <TouchableOpacity
                    onPress={() => setOpen(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Đóng"
                  >
                    <Ionicons name="close" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionList}>
                  {CHART_RANGES.map((r) => {
                    const isSelected = r.key === value;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.optionItem, isSelected && styles.optionItemActive]}
                        activeOpacity={0.7}
                        onPress={() => {
                          onChange(r.key);
                          setOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelActive,
                          ]}
                        >
                          {r.label}
                        </Text>
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                          size={20}
                          color={isSelected ? colors.primary : colors.border}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  optionList: {
    gap: 8,
    paddingTop: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  optionLabelActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
