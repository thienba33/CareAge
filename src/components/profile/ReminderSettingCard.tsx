import { useNotificationPermission } from "../../hooks";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";

// Cho người cao tuổi biết nhắc uống thuốc / lịch khám có đang bật không, và cách bật lại.
export default function ReminderSettingCard() {
  const { permission, enable } = useNotificationPermission();

  if (permission === null || permission === "UNSUPPORTED") return null;

  const isOn = permission === "GRANTED";

  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: isOn ? colors.primaryLight : colors.dangerLight }]}>
        <Ionicons
          name={isOn ? "notifications" : "notifications-off"}
          size={22}
          color={isOn ? colors.primary : colors.danger}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Nhắc uống thuốc và lịch khám</Text>
        <Text style={styles.meta}>
          {isOn ? "Đang bật" : "Đang tắt — bạn sẽ không nhận được lời nhắc"}
        </Text>
      </View>
      {!isOn ? (
        <TouchableOpacity style={styles.button} onPress={enable} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.buttonText}>Bật</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  textCol: { flex: 1, gap: 2 },
  title: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  button: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonText: { fontSize: typography.body, fontWeight: "700", color: colors.surface },
});
