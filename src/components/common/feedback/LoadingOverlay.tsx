import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../../theme/colors";

export type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

export function LoadingBox({ message = "CareAge" }: { message?: string }) {
  return (
    <View style={styles.box} accessibilityRole="progressbar" accessibilityLabel="Đang tải dữ liệu">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export default function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none" accessibilityLiveRegion="polite">
      <LoadingBox message={message} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250,250,247,0.55)",
  },
  box: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 22,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  text: { fontSize: typography.h2, fontWeight: "800", color: colors.primary },
});
