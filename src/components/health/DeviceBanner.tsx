import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { HEALTH_APP_NAME } from "../../constants/devices";

export type DeviceBannerProps = {
  isSyncing?: boolean;
  onSync: () => void;
  onOpenOtherDevices?: () => void;
};

/**
 * Thẻ đồng bộ Apple Health / Google Health Connect kèm liên kết kết nối thiết bị đo ngoài.
 */
export default function DeviceBanner({
  isSyncing = false,
  onSync,
  onOpenOtherDevices,
}: DeviceBannerProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Ionicons
            name={Platform.OS === "ios" ? "heart" : "pulse"}
            size={20}
            color={colors.danger}
          />
        </View>
        <Text style={styles.title}>{HEALTH_APP_NAME}</Text>

        <TouchableOpacity
          style={styles.syncBtn}
          activeOpacity={0.8}
          onPress={onSync}
          disabled={isSyncing}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Đồng bộ từ ${HEALTH_APP_NAME}`}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="sync" size={17} color={colors.surface} />
          )}
        </TouchableOpacity>
      </View>

      {onOpenOtherDevices ? (
        <TouchableOpacity
          style={styles.bottomLink}
          activeOpacity={0.7}
          onPress={onOpenOtherDevices}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Kết nối máy đo huyết áp, SpO2 kẹp tay"
        >
          <View style={styles.bottomLinkLeft}>
            <Ionicons name="bluetooth" size={14} color={colors.primary} />
            <Text style={styles.bottomLinkText}>
              Kết nối máy đo huyết áp, SpO2 kẹp tay...
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  bottomLinkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
});
