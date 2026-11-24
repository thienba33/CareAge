import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";

export type NotificationBellButtonProps = {
  unreadCount: number;
  onPress: () => void;
  iconColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export default function NotificationBellButton({
  unreadCount,
  onPress,
  iconColor = colors.surface,
  accessibilityLabel,
  style,
}: NotificationBellButtonProps) {
  const defaultLabel =
    unreadCount > 0
      ? `Thông báo, ${unreadCount} thông báo chưa đọc`
      : "Thông báo";

  return (
    <TouchableOpacity
      style={[styles.bellButton, style]}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? defaultLabel}
    >
      <Ionicons name="notifications" size={22} color={iconColor} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.surface,
    textAlign: "center",
  },
});
