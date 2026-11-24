import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, typography } from "../../theme/colors";

interface AuthFooterLinkProps {
  prompt: string;
  actionText: string;
  onPress: () => void;
}

export default function AuthFooterLink({
  prompt,
  actionText,
  onPress,
}: AuthFooterLinkProps) {
  return (
    <TouchableOpacity
      style={styles.linkWrap}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <Text style={styles.link}>
        {prompt} <Text style={styles.linkStrong}>{actionText}</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linkWrap: { alignItems: "center", marginTop: 24 },
  link: { color: colors.textMuted, fontSize: typography.caption, fontWeight: "600" },
  linkStrong: { color: colors.primaryDark, fontWeight: "800" },
});
