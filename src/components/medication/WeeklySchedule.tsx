import { EmptyCard } from "../common";
import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import type { Medication, MedicationDose } from "../../types/medication";
import { WEEKDAY_SHORT, addDays, isSameDay, startOfWeek, toDateKey } from "../../utils/date";
import { getEffectiveDoseStatus } from "../../utils/medicationStatus";
import { DOSE_STATUS_COLOR, DOSE_STATUS_ICON, DOSE_STATUS_LABEL } from "../../constants/doseStatus";

type ScheduledDose = {
  key: string;
  time: string;
  medication: Medication;
  dose?: MedicationDose; // chỉ có khi ngày được chọn là hôm nay
};

type Props = {
  medications: Medication[];
  todayDoses: MedicationDose[];
  canManage: boolean;
  onTaken: (doseId: string) => void;
  onSkipped: (doseId: string) => void;
  onMedicationLongPress: (medication: Medication) => void;
};

export default function WeeklySchedule({
  medications,
  todayDoses,
  canManage,
  onTaken,
  onSkipped,
  onMedicationLongPress,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(
    () => addDays(startOfWeek(today), weekOffset * 7),
    [today, weekOffset]
  );
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const defaultIndex = weekDates.findIndex((d) => isSameDay(d, today));
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);
  const selectedDate = weekDates[selectedIndex];
  const isSelectedToday = isSameDay(selectedDate, today);

  const schedule: ScheduledDose[] = useMemo(() => {
    const dateKey = toDateKey(selectedDate);
    const items = medications
      .filter((m) => m.status === "ACTIVE")
      .filter((m) => dateKey >= m.startDate && (!m.endDate || dateKey <= m.endDate))
      .flatMap((medication) =>
        medication.times.map((time) => ({
          key: `${medication.id}-${time}`,
          time,
          medication,
          dose: isSelectedToday
            ? todayDoses.find((d) => d.medicationId === medication.id && d.scheduledTime === time)
            : undefined,
        }))
      );
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, selectedDate, isSelectedToday, todayDoses]);

  return (
    <View>
      <View style={styles.weekNav}>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => setWeekOffset((w) => w - 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          {weekOffset === 0 ? "Tuần này" : weekOffset > 0 ? `${weekOffset} tuần sau` : `${-weekOffset} tuần trước`}
        </Text>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => setWeekOffset((w) => w + 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayRow}
      >
        {weekDates.map((date, index) => {
          const active = index === selectedIndex;
          const isToday = isSameDay(date, today);
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => setSelectedIndex(index)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayChipWeekday, active && styles.dayChipTextActive]}>
                {WEEKDAY_SHORT[index]}
              </Text>
              <Text style={[styles.dayChipDate, active && styles.dayChipTextActive]}>
                {date.getDate()}
              </Text>
              {isToday ? <View style={[styles.todayDot, active && styles.todayDotActive]} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.scheduleList}>
        {schedule.length === 0 ? (
          <EmptyCard
            icon="calendar-outline"
            iconSize={26}
            message="Không có lịch uống thuốc cho ngày này."
          />
        ) : (
          schedule.map((item) => {
            const effectiveStatus = item.dose ? getEffectiveDoseStatus(item.dose) : null;
            const tagColor = effectiveStatus ? DOSE_STATUS_COLOR[effectiveStatus] : colors.primary;

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.scheduleCard}
                activeOpacity={0.85}
                onLongPress={() => onMedicationLongPress(item.medication)}
                delayLongPress={350}
              >
                <View style={[styles.scheduleTimeTag, { backgroundColor: tagColor }]}>
                  <Ionicons name="pin" size={10} color={colors.surface} />
                  <Text style={styles.scheduleTimeTagText}>{item.time}</Text>
                </View>

                <View style={styles.scheduleInfoCol}>
                  <Text style={styles.scheduleName} numberOfLines={1}>
                    {item.medication.name}
                  </Text>
                  <Text style={styles.scheduleDosage}>
                    {item.medication.dosage}{item.medication.unit}
                  </Text>
                </View>

                {item.dose ? (
                  canManage && item.dose.status === "PENDING" ? (
                    <View style={styles.scheduleActions}>
                      <TouchableOpacity
                        style={[styles.scheduleActionButton, styles.scheduleActionTaken]}
                        onPress={() => onTaken(item.dose!.id)}
                        activeOpacity={0.8}
                        accessibilityLabel="Đánh dấu đã uống"
                      >
                        <Ionicons name="checkmark" size={18} color={colors.surface} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.scheduleActionButton, styles.scheduleActionSkipped]}
                        onPress={() => onSkipped(item.dose!.id)}
                        activeOpacity={0.8}
                        accessibilityLabel="Bỏ qua liều này"
                      >
                        <Ionicons name="close" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Ionicons
                      name={DOSE_STATUS_ICON[effectiveStatus!]}
                      size={22}
                      color={tagColor}
                      accessibilityLabel={DOSE_STATUS_LABEL[effectiveStatus!]}
                    />
                  )
                ) : (
                  <Text style={styles.scheduleUpcoming}>Dự kiến</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  weekLabel: { fontSize: typography.caption, fontWeight: "700", color: colors.text },
  dayRow: { gap: 8, paddingBottom: 4 },
  dayChip: {
    width: 48,
    alignItems: "center",
    gap: 2,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipWeekday: { fontSize: typography.caption, color: colors.textMuted, fontWeight: "600" },
  dayChipDate: { fontSize: typography.body, color: colors.text, fontWeight: "800" },
  dayChipTextActive: { color: colors.surface },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 2 },
  todayDotActive: { backgroundColor: colors.surface },
  scheduleList: { gap: 18, marginTop: 18 },

  scheduleCard: {
    position: "relative",
    overflow: "visible",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  scheduleTimeTag: {
    position: "absolute",
    top: -11,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    transform: [{ rotate: "-4deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  scheduleTimeTagText: { fontSize: 11, fontWeight: "800", color: colors.surface },
  scheduleInfoCol: { flex: 1, gap: 2 },
  scheduleName: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  scheduleDosage: { fontSize: typography.caption, color: colors.textMuted },
  scheduleUpcoming: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scheduleActions: { flexDirection: "row", gap: 8 },
  scheduleActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleActionTaken: { backgroundColor: colors.success },
  scheduleActionSkipped: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
