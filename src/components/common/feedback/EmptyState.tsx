import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../../theme/colors";

export type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function EmptyState({
  icon,
  iconColor = colors.textMuted,
  iconSize = 56,
  title,
  message,
  actionText,
  onAction,
  children,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionText && onAction ? (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionBtnText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  message: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  actionBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
