import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../../theme/colors";

export type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

// Trạng thái lỗi khi tải dữ liệu thất bại — không để màn hình trắng (skill mục 23).
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={56} color={colors.textMuted} />
      <Text style={styles.title}>Không tải được dữ liệu</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.85}>
        <Ionicons name="refresh" size={22} color={colors.surface} />
        <Text style={styles.buttonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
    backgroundColor: colors.background,
  },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.text, textAlign: "center" },
  message: { fontSize: typography.body, color: colors.textMuted, textAlign: "center" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    minHeight: 56,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  buttonText: { fontSize: typography.body, fontWeight: "700", color: colors.surface },
});
