import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

export type HealthTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  wide?: boolean;
};

export default function HealthTile({ icon, label, value, wide }: HealthTileProps) {
  return (
    <View style={[styles.tile, wide && styles.tileWide]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tileWide: {
    flex: 1,
    width: undefined,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
});
