import { ElderlySwitcher, NoLinkedElderlyState } from "../../components/caregiver";
import {
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
} from "../../components/common";
import {
  useSubject,
  usePullToRefresh,
  useHealthMetrics,
  useAuth,
  useNow,
} from "../../hooks";
import React, { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ALERT_SEVERITY_LABEL } from "../../constants/alert";
import { alertError } from "../../utils/alertError";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";

import { ConnectDeviceModal, DeviceBanner, VitalsOverview } from "../../components/health";
import { MOCK_DEVICES } from "../../constants/devices";

export default function VitalsScreen() {
  const { metrics, isLoading, error, isSyncing, connectDevice, syncSmartwatch, reload } = useHealthMetrics();
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const navigation = useNavigation<any>();
  const { isSelf, subjectId } = useSubject();
  const { currentUser } = useAuth();
  const needsLink = currentUser?.role !== "ELDERLY" && !subjectId;

  const now = useNow();

  const pullToRefresh = usePullToRefresh(useCallback(() => reload(), [reload]));

  // Người thân chưa theo dõi ai → hướng dẫn liên kết thay vì màn trống.
  if (needsLink) {
    return (
      <View style={commonStyles.screen}>
        <NoLinkedElderlyState onLink={() => navigation.navigate("Main", { screen: "Profile" })} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleSyncHealthApp = () => {
    syncSmartwatch()
      .then((result) => {
        if (!result) return;
        if (result.alert) {
          Alert.alert(`${ALERT_SEVERITY_LABEL[result.alert.severity]}: ${result.alert.title}`, result.alert.message, [
            { text: "Đóng", style: "cancel" },
            { text: "Xem cảnh báo", onPress: () => navigation.navigate("Alerts") },
          ]);
        } else {
          Alert.alert(
            "Đồng bộ thành công",
            result.isRealData
              ? `Đã nhận dữ liệu THỰC TẾ từ ${result.platformName}:\n• Nhịp tim, Huyết áp, SpO2\n• Thân nhiệt, Bước chân, Giấc ngủ`
              : `Đã đồng bộ các chỉ số hôm nay qua ${result.platformName} (Chế độ mô phỏng trên Expo Go):\n• Nhịp tim, Huyết áp, SpO2\n• Thân nhiệt, Bước chân, Giấc ngủ`
          );
        }
      })
      .catch((e) => alertError(e));
  };

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          {...pullToRefresh.scrollProps}
        >
          <View style={commonStyles.hero}>
            <HeroBlobs />
            <View style={styles.titleRow}>
              <View style={styles.titleCol}>
                <Text style={commonStyles.heroTitle}>Chỉ số sức khỏe</Text>
                <Text style={commonStyles.heroSubtitle}>Kết quả đo từ bệnh viện và thiết bị kết nối</Text>
              </View>
              {isSelf ? (
                <TouchableOpacity
                  style={styles.connectHeaderBtn}
                  activeOpacity={0.85}
                  onPress={() => setDeviceModalVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Kết nối thiết bị đo ngoài"
                >
                  <Ionicons name="bluetooth" size={20} color={colors.surface} />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.switcherRow}>
              <ElderlySwitcher variant="onPrimary" />
            </View>
          </View>

          <View style={commonStyles.sectionsLoose}>
            {isSelf ? (
              <DeviceBanner
                isSyncing={isSyncing}
                onSync={handleSyncHealthApp}
                onOpenOtherDevices={() => setDeviceModalVisible(true)}
              />
            ) : null}

            <VitalsOverview metrics={metrics} now={now} />
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <ConnectDeviceModal
        visible={deviceModalVisible}
        isSyncing={isSyncing}
        onClose={() => setDeviceModalVisible(false)}
        onConnect={(deviceId: string) => {
          const device = MOCK_DEVICES.find((d) => d.id === deviceId);
          if (!device) return;
          if (device.isHealthApp) {
            setDeviceModalVisible(false);
            handleSyncHealthApp();
            return;
          }
          connectDevice(device.name, device.metricType)
            .then((alert) => {
              setDeviceModalVisible(false);
              if (alert) {
                Alert.alert(`${ALERT_SEVERITY_LABEL[alert.severity]}: ${alert.title}`, alert.message, [
                  { text: "Đóng", style: "cancel" },
                  { text: "Xem cảnh báo", onPress: () => navigation.navigate("Alerts") },
                ]);
              } else {
                Alert.alert(
                  "Đồng bộ thành công",
                  `Đã ghi nhận kết quả đo mới từ ${device.name}.`
                );
              }
            })
            .catch((e) => alertError(e));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  switcherRow: { marginTop: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleCol: { flex: 1 },
  connectHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
});
