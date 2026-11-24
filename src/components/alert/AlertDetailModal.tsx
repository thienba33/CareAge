import { AppButton } from "../common";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import {
  ALERT_SEVERITY_BACKGROUND,
  ALERT_SEVERITY_COLOR,
  ALERT_SEVERITY_ICON,
  ALERT_SEVERITY_LABEL,
} from "../../constants/alert";
import type { HealthAlert } from "../../types/alert";
import { formatDateTime } from "../../utils/date";

type Props = {
  alert: HealthAlert | null;
  onClose: () => void;
  onViewMetric: () => void;
  onCallContact: () => void;
};

export default function AlertDetailModal({ alert, onClose, onViewMetric, onCallContact }: Props) {
  return (
    <Modal visible={!!alert} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {alert ? (
          <View style={styles.sheet}>
            <View style={[styles.header, { backgroundColor: ALERT_SEVERITY_BACKGROUND[alert.severity] }]}>
              <Ionicons
                name={ALERT_SEVERITY_ICON[alert.severity]}
                size={32}
                color={ALERT_SEVERITY_COLOR[alert.severity]}
              />
              <Text style={[styles.severity, { color: ALERT_SEVERITY_COLOR[alert.severity] }]}>
                {ALERT_SEVERITY_LABEL[alert.severity]}
              </Text>
            </View>

            <Text style={styles.title}>{alert.title}</Text>
            <Text style={styles.time}>Thời điểm đo: {formatDateTime(alert.createdAt)}</Text>
            <Text style={styles.message}>{alert.message}</Text>
            <Text style={styles.disclaimer}>
              Đây là cảnh báo theo ngưỡng theo dõi, không phải chẩn đoán y khoa.
            </Text>

            {alert.metricType ? (
              <AppButton
                title="Xem chỉ số"
                onPress={onViewMetric}
                variant="outline"
                size="md"
                icon="pulse"
              />
            ) : null}

            <AppButton
              title="Liên hệ người thân / bác sĩ"
              onPress={onCallContact}
              variant="outline"
              size="md"
              icon="call"
            />

            <AppButton
              title="Đã hiểu"
              onPress={onClose}
              variant="primary"
              size="lg"
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
  },
  severity: { fontSize: typography.h2, fontWeight: "800" },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  time: { fontSize: typography.body, color: colors.textMuted },
  message: { fontSize: typography.body, color: colors.text, lineHeight: 26 },
  disclaimer: { fontSize: typography.caption, color: colors.textMuted, fontStyle: "italic" },
});
