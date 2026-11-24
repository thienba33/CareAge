import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, typography } from "../../theme/colors";
import { HEALTH_APP_NAME, MOCK_DEVICES } from "../../constants/devices";
import { METRIC_LABEL } from "../../constants/healthMetric";

type Props = {
  visible: boolean;
  isSyncing: boolean;
  onClose: () => void;
  onConnect: (deviceId: string) => void;
};

export default function ConnectDeviceModal({ visible, isSyncing, onClose, onConnect }: Props) {
  const [connectedId, setConnectedId] = useState<string | null>(null);

  const handleConnect = (deviceId: string) => {
    setConnectedId(deviceId);
    onConnect(deviceId);
  };

  const handleClose = () => {
    setConnectedId(null);
    onClose();
  };

  const healthAppDevice = MOCK_DEVICES.find((d) => d.isHealthApp) ?? MOCK_DEVICES[0];
  const otherDevices = MOCK_DEVICES.filter((d) => !d.isHealthApp);
  const isHealthAppSyncing = isSyncing && connectedId === healthAppDevice.id;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Đồng bộ thiết bị đo</Text>
              <Text style={styles.subtitle}>Kết nối đồng hồ thông minh và máy đo y tế</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Thẻ Đồng bộ Apple Health / Google Health Connect (Khuyên dùng) ── */}
          <View style={styles.featuredCard}>
            <View style={styles.featuredTopRow}>
              <View style={styles.featuredIconBox}>
                <Ionicons
                  name={Platform.OS === "ios" ? "heart" : "pulse"}
                  size={24}
                  color={colors.danger}
                />
              </View>
              <View style={styles.featuredTextCol}>
                <View style={styles.badgeRow}>
                  <Text style={styles.featuredTitle}>{HEALTH_APP_NAME}</Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Khuyên dùng</Text>
                  </View>
                </View>
                <Text style={styles.featuredBrand}>Apple Watch · Samsung · Garmin · Xiaomi</Text>
              </View>
            </View>

            <Text style={styles.featuredDesc}>
              Tự động nhận chỉ số nhịp tim và SpO2 từ đồng hồ thông minh thông qua trung tâm dữ liệu{" "}
              {HEALTH_APP_NAME}.
            </Text>

            <TouchableOpacity
              style={styles.featuredButton}
              activeOpacity={0.85}
              onPress={() => handleConnect(healthAppDevice.id)}
              disabled={isSyncing}
            >
              {isHealthAppSyncing ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="sync" size={18} color={colors.surface} />
                  <Text style={styles.featuredButtonText}>Đồng bộ từ {HEALTH_APP_NAME}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Thiết bị đo Bluetooth khác ── */}
          <View style={styles.otherSection}>
            <Text style={styles.otherSectionTitle}>THIẾT BỊ ĐO TẠI NHÀ KHÁC</Text>
            <View style={styles.deviceList}>
              {otherDevices.map((device, index) => {
                const isThisSyncing = isSyncing && connectedId === device.id;
                return (
                  <TouchableOpacity
                    key={device.id}
                    style={[
                      styles.deviceRow,
                      index !== otherDevices.length - 1 && styles.deviceRowDivider,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleConnect(device.id)}
                    disabled={isSyncing}
                  >
                    <View style={styles.deviceIcon}>
                      <Ionicons name={device.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.deviceInfoCol}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceMeta}>
                        Đo {METRIC_LABEL[device.metricType]} · {device.brand}
                      </Text>
                    </View>
                    {isThisSyncing ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <View style={styles.connectBadge}>
                        <Text style={styles.connectText}>Đo ngay</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  // Featured Card (Apple Health / Google Health Connect)
  featuredCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    padding: 16,
    gap: 12,
  },
  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featuredIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredTextCol: { flex: 1, gap: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featuredTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  recommendedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedBadgeText: { fontSize: 10, fontWeight: "800", color: colors.surface },
  featuredBrand: { fontSize: 12, color: colors.textMuted },
  featuredDesc: { fontSize: 13, color: colors.text, lineHeight: 18 },
  featuredButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  featuredButtonText: { fontSize: 14, fontWeight: "700", color: colors.surface },

  // Other devices
  otherSection: { gap: 8, marginTop: 4 },
  otherSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  deviceList: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  deviceRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  deviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceInfoCol: { flex: 1, gap: 2 },
  deviceName: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  deviceMeta: { fontSize: 12, color: colors.textMuted },
  connectBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  connectText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
