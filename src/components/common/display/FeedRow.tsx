import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../../theme/colors";

export type FeedRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  body?: string;
  meta: string;
  unread: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

export default function FeedRow({
  icon,
  iconColor,
  iconBackground,
  title,
  body,
  meta,
  unread,
  accessibilityLabel,
  onPress,
}: FeedRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, unread && styles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? "Chưa đọc. " : ""}${accessibilityLabel}`}
    >
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, unread && styles.titleUnread]}>{title}</Text>
        {body ? (
          <Text style={styles.body} numberOfLines={3}>
            {body}
          </Text>
        ) : null}
        <Text style={styles.meta}>{meta}</Text>
      </View>
      {unread ? <View style={styles.dot} /> : <View style={styles.dotSpace} />}
    </TouchableOpacity>
  );
}

export function FeedSectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowUnread: { backgroundColor: colors.primaryLight },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
  title: { fontSize: typography.body, color: colors.text },
  titleUnread: { fontWeight: "800" },
  body: { fontSize: typography.caption, lineHeight: 20, color: colors.text },
  meta: { fontSize: typography.caption, color: colors.textMuted, marginTop: 2 },
  dot: { alignSelf: "flex-start", width: 12, height: 12, marginTop: 4, borderRadius: 6, backgroundColor: colors.primary },
  dotSpace: { width: 12 },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "800",
    color: colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
