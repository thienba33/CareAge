import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../../theme/colors";

export type EmptyCardProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  message: string;
  subMessage?: string;
  actionText?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

// Thẻ trạng thái trống nội tuyến bên trong ScrollView
export default function EmptyCard({
  icon = "file-tray-outline",
  iconSize = 32,
  iconColor = colors.textMuted,
  message,
  subMessage,
  actionText,
  onAction,
  style,
}: EmptyCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
      {actionText && onAction ? (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  message: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  subMessage: {
    fontSize: typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: -2,
    opacity: 0.85,
  },
  actionBtn: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
});
