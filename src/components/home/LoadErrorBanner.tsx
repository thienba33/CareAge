import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";

type Props = {
  message: string;
  onRetry: () => void;
};

// Báo lỗi ngay trong trang thay vì thay cả màn hình — để nút SOS trên Trang chủ luôn dùng được.
export default function LoadErrorBanner({ message, onRetry }: Props) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={24} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.85} accessibilityRole="button">
        <Text style={styles.buttonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  text: { flex: 1, fontSize: typography.body, color: colors.text },
  button: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.danger,
  },
  buttonText: { fontSize: typography.body, fontWeight: "700", color: colors.surface },
});
