import { HeroBlobs } from "../common";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../theme/colors";

interface AuthHeroHeaderProps {
  title?: string;
  subtitle: string;
  onBack?: () => void;
  largeLogo?: boolean;
}

export default function AuthHeroHeader({
  title,
  subtitle,
  onBack,
  largeLogo,
}: AuthHeroHeaderProps) {
  return (
    <View style={styles.hero}>
      <HeroBlobs />

      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.surface} />
        </TouchableOpacity>
      )}

      {largeLogo || !title ? (
        <>
          <View style={styles.logoBadgeLarge}>
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitleCentered}>{subtitle}</Text>
        </>
      ) : (
        <View style={styles.titleRow}>
          <View style={styles.logoBadgeSmall}>
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleTextCol}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingTop: 76,
    paddingBottom: 64,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  logoBadgeLarge: {
    width: 128,
    height: 128,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginBottom: 4,
  },
  logoBadgeSmall: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  logoImage: { width: "100%", height: "100%" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    alignSelf: "center",
    maxWidth: "100%",
  },
  titleTextCol: { flexShrink: 1, gap: 2 },
  title: {
    fontSize: typography.h1,
    fontWeight: "800",
    color: colors.surface,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: typography.caption,
    color: colors.primaryLight,
  },
  subtitleCentered: {
    fontSize: typography.caption,
    color: colors.primaryLight,
    textAlign: "center",
    marginTop: 8,
  },
});
