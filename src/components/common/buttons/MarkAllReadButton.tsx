import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, typography } from "../../../theme/colors";

export type MarkAllReadButtonProps = {
  unreadCount: number;
  onPress: () => void;
};

// Nút "Đánh dấu đã đọc tất cả" đặt trên thanh tiêu đề (headerRight): icon kèm số chưa đọc.
export default function MarkAllReadButton({ unreadCount, onPress }: MarkAllReadButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Đánh dấu đã đọc tất cả, ${unreadCount} chưa đọc`}
    >
      <Ionicons name="checkmark-done" size={28} color={colors.primary} />
      <Text style={styles.count}>({unreadCount})</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, minWidth: 44, height: 44 },
  count: { fontSize: typography.body, fontWeight: "700", color: colors.primary },
});
