import { useSubject } from "../../hooks";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { followedLabel } from "../../constants/caregiver";

type Props = {
  // "onPrimary": đặt trên nền xanh của phần đầu trang; "onSurface": trên nền sáng.
  variant?: "onPrimary" | "onSurface";
};

// Chip tên người cao tuổi cho người thân — bấm để đổi người cao tuổi khi theo dõi nhiều người.
// Không hiện với người cao tuổi (họ luôn xem chính mình).
export default function ElderlySwitcher({ variant = "onSurface" }: Props) {
  const { isSelf, subject, linkedElderly, select } = useSubject();
  const [open, setOpen] = useState(false);

  if (isSelf || !subject) return null;

  const canSwitch = linkedElderly.length > 1;
  const onPrimary = variant === "onPrimary";

  return (
    <>
      <TouchableOpacity
        style={[styles.chip, onPrimary ? styles.chipOnPrimary : styles.chipOnSurface]}
        onPress={() => setOpen(true)}
        disabled={!canSwitch}
        activeOpacity={0.85}
        accessibilityRole={canSwitch ? "button" : "text"}
        accessibilityLabel={`Người cao tuổi: ${subject.name}${canSwitch ? ", bấm để đổi người" : ""}`}
      >
        <Ionicons name="person-circle" size={22} color={onPrimary ? colors.surface : colors.primary} />
        <Text style={[styles.chipText, onPrimary && styles.chipTextOnPrimary]} numberOfLines={1}>
          {subject.name}
        </Text>
        {canSwitch ? (
          <Ionicons name="chevron-down" size={18} color={onPrimary ? colors.surface : colors.textMuted} />
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Chọn người cao tuổi</Text>
            {linkedElderly.map((e) => {
              const isActive = e.id === subject.id;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => {
                    select(e.id);
                    setOpen(false);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons name={isActive ? "radio-button-on" : "radio-button-off"} size={22} color={colors.primary} />
                  <View style={styles.optionText}>
                    <Text style={styles.optionName}>{e.name}</Text>
                    <Text style={styles.optionMeta}>{followedLabel(e)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    minHeight: 40,
    maxWidth: "100%",
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipOnPrimary: { backgroundColor: "rgba(255,255,255,0.2)" },
  chipOnSurface: { backgroundColor: colors.primaryLight },
  chipText: { flexShrink: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  chipTextOnPrimary: { color: colors.surface },
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { gap: 8, padding: 20, borderRadius: 20, backgroundColor: colors.surface },
  sheetTitle: { fontSize: typography.h2, fontWeight: "700", color: colors.text, marginBottom: 4 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 12, borderRadius: 14 },
  optionActive: { backgroundColor: colors.primaryLight },
  optionText: { flex: 1 },
  optionName: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  optionMeta: { fontSize: typography.caption, color: colors.textMuted },
});
