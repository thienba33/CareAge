import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { DOSE_STATUS_COLOR, DOSE_STATUS_ICON } from "../../constants/doseStatus";
import { getEffectiveDoseStatus } from "../../utils/medicationStatus";
import type { DoseCompliance, DoseGroup } from "../../utils/dashboard";
import HomeSectionCard from "./HomeSectionCard";

type Props = {
  compliance: DoseCompliance;
  next: DoseGroup | null;
  now: Date;
  isLoading: boolean;
  // Chỉ ELDERLY được tự đánh dấu đã uống.
  canTake: boolean;
  onTaken: (doseIds: string[]) => Promise<void>;
  onPress: () => void;
};

// Tổng quan thuốc trong ngày: tiến độ + khung giờ uống tiếp theo (gộp các thuốc cùng giờ).
export default function MedicationTodayCard({ compliance, next, now, isLoading, canTake, onTaken, onPress }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { taken, total } = compliance;
  const percent = total === 0 ? 0 : Math.round((taken / total) * 100);

  const handleTaken = async () => {
    if (!next) return;
    setIsSubmitting(true);
    try {
      await onTaken(next.items.map((i) => i.dose.id));
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = next ? getEffectiveDoseStatus(next.items[0].dose, now) : null;
  const count = next?.items.length ?? 0;

  return (
    <HomeSectionCard
      icon="medkit"
      title="Thuốc hôm nay"
      headerRight={total > 0 ? <Text style={styles.count}>{taken}/{total}</Text> : null}
      isLoading={isLoading}
      isEmpty={total === 0}
      emptyText="Hôm nay không có lịch uống thuốc."
      onPress={onPress}
    >
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel={`Đã uống ${taken} trên ${total} liều`}
        accessibilityValue={{ min: 0, max: total, now: taken }}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>

      {next && status ? (
        <>
          <View style={styles.nextRow}>
            <Ionicons name={DOSE_STATUS_ICON[status]} size={22} color={DOSE_STATUS_COLOR[status]} />
            <Text style={styles.nextTime}>{next.time}</Text>
            {count > 1 ? <Text style={styles.nextCount}>· {count} thuốc</Text> : null}
          </View>
          {next.items.map(({ dose, medication }) => (
            <Text key={dose.id} style={styles.medLine} numberOfLines={1}>
              • {medication.name} {medication.dosage} {medication.unit}
            </Text>
          ))}
          {status === "MISSED" ? <Text style={styles.lateText}>Đã quá giờ — vẫn có thể uống trễ</Text> : null}

          {canTake ? (
            <TouchableOpacity
              style={styles.takenButton}
              activeOpacity={0.85}
              onPress={handleTaken}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={`Đánh dấu đã uống ${next.items.map((i) => i.medication.name).join(", ")}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={colors.surface} />
                  <Text style={styles.takenText}>{count > 1 ? `Đã uống cả ${count}` : "Đã uống"}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <View style={styles.nextRow}>
          <Ionicons name="checkmark-done-circle" size={22} color={colors.success} />
          <Text style={styles.doneText}>Đã xong các liều hôm nay</Text>
        </View>
      )}
    </HomeSectionCard>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: typography.h2, fontWeight: "800", color: colors.primary },
  track: { height: 10, borderRadius: 999, backgroundColor: colors.primaryLight, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999, backgroundColor: colors.primary },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nextTime: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  nextCount: { fontSize: typography.body, color: colors.textMuted },
  medLine: { fontSize: typography.body, color: colors.text, paddingLeft: 4 },
  doneText: { flex: 1, fontSize: typography.body, color: colors.text },
  lateText: { fontSize: typography.caption, color: colors.textMuted },
  takenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.success,
  },
  takenText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
