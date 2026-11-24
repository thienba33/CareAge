import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme/colors";

export default function AdminUnsupportedScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="desktop-outline" size={48} color={colors.primary} />
      <Text style={styles.title}>Vui lòng dùng Website Admin</Text>
      <Text style={styles.body}>
        Tài khoản Quản trị viên hiện được quản lý trên Website Admin dành cho bệnh viện. Ứng
        dụng di động chưa hỗ trợ đầy đủ chức năng quản trị.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.text, textAlign: "center" },
  body: { fontSize: typography.body, color: colors.textMuted, textAlign: "center" },
});
