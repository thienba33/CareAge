import React, { useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { DOSE_STATUS_COLOR, DOSE_STATUS_ICON, DOSE_STATUS_LABEL } from "../../constants/doseStatus";
import { getEffectiveDoseStatus } from "../../utils/medicationStatus";
import type { Medication, MedicationDose } from "../../types/medication";

// Vuốt quá khoảng này (px) rồi thả thì ghi nhận; ít hơn thì thẻ bật về chỗ cũ.
const SWIPE_TRIGGER = 110;
const SWIPE_MAX = 180;
const SWIPE_OUT = 500;

type Props = {
  dose: MedicationDose;
  medication: Medication;
  now: Date;
  // Chỉ ELDERLY tự đánh dấu, và chỉ với liều chưa uống.
  canManage: boolean;
  onTaken: () => Promise<void>;
  onSkipped: () => Promise<void>;
  // Bấm vào thẻ để xem thông tin thuốc.
  onPress: () => void;
};

// Thẻ liều thuốc: vuốt phải = Đã uống, vuốt trái = Bỏ qua; kèm nút bấm ✓ / ✕ cho người khó vuốt.
export default function SwipeableDoseCard({ dose, medication, now, canManage, onTaken, onSkipped, onPress }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const canSwipe = canManage && dose.status === "PENDING";

  const effectiveStatus = getEffectiveDoseStatus(dose, now);
  const statusColor = DOSE_STATUS_COLOR[effectiveStatus];

  const reset = () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();

  const commit = (direction: 1 | -1, action: () => Promise<void>) => {
    Animated.timing(translateX, { toValue: direction * SWIPE_OUT, duration: 180, useNativeDriver: true }).start(() => {
      // Dù thành công hay lỗi đều đưa thẻ về chỗ; trạng thái mới hiển thị qua dữ liệu (hoặc Alert lỗi).
      action().finally(() => translateX.setValue(0));
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Chỉ giành cử chỉ khi vuốt NGANG rõ ràng — cuộn dọc danh sách không bị ảnh hưởng.
        onMoveShouldSetPanResponderCapture: (_, g) =>
          canSwipe && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => translateX.setValue(Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, g.dx))),
        onPanResponderRelease: (_, g) => {
          if (g.dx >= SWIPE_TRIGGER) commit(1, onTaken);
          else if (g.dx <= -SWIPE_TRIGGER) commit(-1, onSkipped);
          else reset();
        },
        onPanResponderTerminate: reset,
      }),
    [canSwipe, onTaken, onSkipped]
  );

  // Nền hiện dần theo hướng vuốt.
  const takenOpacity = translateX.interpolate({ inputRange: [0, 40, SWIPE_TRIGGER], outputRange: [0, 0.6, 1], extrapolate: "clamp" });
  const skipOpacity = translateX.interpolate({ inputRange: [-SWIPE_TRIGGER, -40, 0], outputRange: [1, 0.6, 0], extrapolate: "clamp" });

  return (
    <View
      style={styles.wrapper}
      accessibilityActions={
        canSwipe
          ? [
              { name: "taken", label: "Đã uống" },
              { name: "skip", label: "Bỏ qua" },
            ]
          : undefined
      }
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "taken") onTaken();
        if (e.nativeEvent.actionName === "skip") onSkipped();
      }}
    >
      {canSwipe ? (
        <>
          <Animated.View style={[styles.background, styles.takenBackground, { opacity: takenOpacity }]}>
            <Ionicons name="checkmark-circle" size={28} color={colors.surface} />
            <Text style={styles.backgroundText}>Đã uống</Text>
          </Animated.View>
          <Animated.View style={[styles.background, styles.skipBackground, { opacity: skipOpacity }]}>
            <Text style={styles.backgroundText}>Bỏ qua</Text>
            <Ionicons name="close-circle" size={28} color={colors.surface} />
          </Animated.View>
        </>
      ) : null}

      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={onPress}
          accessibilityLabel={`${dose.scheduledTime}, ${medication.name} ${medication.dosage} ${medication.unit}, ${DOSE_STATUS_LABEL[effectiveStatus]}`}
          accessibilityHint={
            canSwipe ? "Bấm để xem thông tin thuốc. Vuốt phải nếu đã uống, vuốt trái để bỏ qua" : "Bấm để xem thông tin thuốc"
          }
        >
          <View style={[styles.timeTag, { backgroundColor: statusColor }]}>
            <Ionicons name="pin" size={11} color={colors.surface} />
            <Text style={styles.timeTagText}>{dose.scheduledTime}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.name} numberOfLines={1}>
              {medication.name}
            </Text>
            <Text style={styles.dosage}>
              {medication.dosage} {medication.unit}
            </Text>
          </View>

          {canSwipe ? (
            // Nút bấm song song với thao tác vuốt — cho người khó vuốt.
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.takenButton]}
                onPress={onTaken}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Đã uống ${medication.name}`}
              >
                <Ionicons name="checkmark" size={24} color={colors.surface} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.skipButton]}
                onPress={onSkipped}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Bỏ qua ${medication.name}`}
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusCol}>
              <Ionicons name={DOSE_STATUS_ICON[effectiveStatus]} size={26} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{DOSE_STATUS_LABEL[effectiveStatus]}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
  background: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  takenBackground: { justifyContent: "flex-start", backgroundColor: colors.success },
  skipBackground: { justifyContent: "flex-end", backgroundColor: colors.textMuted },
  backgroundText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 14,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  timeTag: {
    position: "absolute",
    top: -12,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    transform: [{ rotate: "-4deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  timeTagText: { fontSize: 12, fontWeight: "800", color: colors.surface },
  infoCol: { flex: 1, gap: 2 },
  name: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  dosage: { fontSize: typography.caption, color: colors.textMuted },
  statusCol: { alignItems: "center", gap: 2, minWidth: 72 },
  actions: { flexDirection: "row", gap: 10 },
  actionButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  takenButton: { backgroundColor: colors.success },
  skipButton: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  statusText: { fontSize: 12, fontWeight: "700" },
});
