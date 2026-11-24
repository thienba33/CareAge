import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, typography } from "../../theme/colors";
import { ALERT_SEVERITY_COLOR, ALERT_SEVERITY_ICON } from "../../constants/alert";
import type { HealthAlert } from "../../types/alert";

type Props = {
  latestUnread: HealthAlert;
  unreadCount: number;
  onPress: () => void;
};

// Dải báo cảnh báo mới — chỉ hiện khi có cảnh báo chưa đọc; chi tiết ở màn Cảnh báo.
export default function AlertStrip({ latestUnread, unreadCount, onPress }: Props) {
  const color = ALERT_SEVERITY_COLOR[latestUnread.severity];

  return (
    <TouchableOpacity
      style={[styles.strip, { borderColor: color }]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unreadCount} cảnh báo mới. ${latestUnread.title}`}
    >
      <Ionicons name={ALERT_SEVERITY_ICON[latestUnread.severity]} size={26} color={color} />
      <Text style={styles.text} numberOfLines={2}>
        <Text style={styles.count}>{unreadCount} cảnh báo mới: </Text>
        {latestUnread.title}
      </Text>
      <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: colors.dangerLight,
  },
  text: { flex: 1, fontSize: typography.body, color: colors.text },
  count: { fontWeight: "800" },
});
