import { useSOS } from "../../hooks";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { EMERGENCY_NUMBER } from "../../constants/emergency";

type Props = {
  // "banner": nút ngang trên Trang chủ; "large": nút to ở màn Khẩn cấp.
  variant: "banner" | "large";
};

export default function SOSButton({ variant }: Props) {
  const { trigger, isRunning } = useSOS();
  const label = `Gọi khẩn cấp ${EMERGENCY_NUMBER} và nhắn vị trí cho người thân`;

  if (variant === "large") {
    return (
      <TouchableOpacity
        style={styles.large}
        activeOpacity={0.85}
        onPress={trigger}
        disabled={isRunning}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.largeIconRing}>
          {isRunning ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Ionicons name="call" size={30} color={colors.surface} />
          )}
        </View>
        <Text style={styles.largeTitle}>KHẨN CẤP</Text>
        <Text style={styles.subtitle}>Gọi {EMERGENCY_NUMBER} · Nhắn vị trí cho người thân</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.85}
      onPress={trigger}
      disabled={isRunning}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.bannerIcon}>
        {isRunning ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Ionicons name="call" size={22} color={colors.surface} />
        )}
      </View>
      <View style={styles.bannerTextCol}>
        <Text style={styles.bannerTitle}>Gọi khẩn cấp (SOS)</Text>
        <Text style={styles.subtitle}>Gọi {EMERGENCY_NUMBER} và nhắn vị trí cho người thân</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.surface} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    backgroundColor: colors.danger,
    borderRadius: 18,
    padding: 16,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextCol: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
  subtitle: { fontSize: typography.caption, color: "rgba(255,255,255,0.9)" },
  large: {
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.danger,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 16,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  largeIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  largeTitle: { fontSize: typography.h2, fontWeight: "800", color: colors.surface, letterSpacing: 0.5 },
});
