import { Skeleton } from "../common";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  isLoading?: boolean;
  // Hiện khi không có dữ liệu (và không đang tải).
  emptyText?: string;
  isEmpty?: boolean;
  onPress?: () => void;
  // Nội dung ngắn bên phải tiêu đề (vd. "1/3").
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
};

// Khung thẻ dùng chung của Trang chủ: icon + tiêu đề, xử lý sẵn trạng thái đang tải / trống.
export default function HomeSectionCard({
  icon,
  iconColor = colors.primary,
  iconBackground = colors.primaryLight,
  title,
  isLoading,
  emptyText,
  isEmpty,
  onPress,
  headerRight,
  children,
}: Props) {
  const content = isLoading ? (
    <>
      <Skeleton width="70%" height={22} />
      <Skeleton width="45%" />
    </>
  ) : isEmpty ? (
    <Text style={styles.mutedText}>{emptyText}</Text>
  ) : (
    children
  );

  const body = (
    <>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {headerRight}
        {onPress ? <Ionicons name="chevron-forward" size={22} color={colors.textMuted} /> : null}
      </View>
      <View style={styles.content}>{content}</View>
    </>
  );

  if (!onPress) return <View style={styles.card}>{body}</View>;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress} accessibilityRole="button">
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  content: { gap: 8 },
  mutedText: { fontSize: typography.body, color: colors.textMuted },
});
