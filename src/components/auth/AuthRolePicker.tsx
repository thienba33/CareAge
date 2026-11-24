import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { REGISTERABLE_ROLES, Role, roleLabel } from "../../types/auth";

interface AuthRolePickerProps {
  value: Role;
  onChange: (role: Role) => void;
  label?: string;
}

export default function AuthRolePicker({
  value,
  onChange,
  label = "Bạn là ai?",
}: AuthRolePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={commonStyles.formField}>
      <Text style={commonStyles.formLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectText}>{roleLabel[value]}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.selectOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.selectMenu}>
            {REGISTERABLE_ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.selectOption, value === r && styles.selectOptionActive]}
                onPress={() => {
                  onChange(r);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    value === r && styles.selectOptionTextActive,
                  ]}
                >
                  {roleLabel[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#FAFAF7",
    minHeight: 50,
  },
  selectText: { fontSize: typography.body, color: colors.text },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  selectMenu: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectOptionActive: { backgroundColor: colors.primary },
  selectOptionText: { fontSize: typography.body, color: colors.text, fontWeight: "600" },
  selectOptionTextActive: { color: colors.surface },
});
