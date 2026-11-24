import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import HomeSectionCard from "../home/HomeSectionCard";
import { colors, typography } from "../../theme/colors";
import type { StaffAppointment } from "../../types/staff";
import { daysFromToday, formatShortDate, fromDateKey } from "../../utils/date";
import { appointmentDateTime } from "../../utils/appointment";

const PREVIEW_COUNT = 4;

type Props = {
  // Lịch đã xác nhận từ hôm nay (gần nhất trước).
  upcoming: StaffAppointment[];
  now: Date;
  isLoading: boolean;
  onOpenPatient: (appointment: StaffAppointment) => void;
  onPress: () => void;
};

function dayLabel(dateKey: string, now: Date): string {
  const date = fromDateKey(dateKey);
  const days = daysFromToday(date, now);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Ngày mai";
  return formatShortDate(date);
}

// Các lịch khám gần nhất (đã xác nhận, chưa qua giờ): giờ + ngày, bệnh nhân, nội dung. Bấm để mở hồ sơ bệnh nhân.
export default function UpcomingScheduleCard({ upcoming, now, isLoading, onOpenPatient, onPress }: Props) {
  const next = upcoming.filter((a) => appointmentDateTime(a).getTime() >= now.getTime()).slice(0, PREVIEW_COUNT);

  return (
    <HomeSectionCard
      icon="calendar"
      iconColor={colors.info}
      iconBackground={colors.infoLight}
      title="Lịch khám gần nhất"
      isLoading={isLoading}
      isEmpty={next.length === 0}
      emptyText="Chưa có lịch khám sắp tới."
      onPress={onPress}
    >
      {next.map((a, i) => {
        const day = dayLabel(a.date, now);
        return (
          <TouchableOpacity
            key={a.id}
            style={[styles.row, i > 0 && styles.rowDivider]}
            onPress={() => onOpenPatient(a)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${a.time} ${day}, ${a.patientName}, ${a.reason ?? "Tái khám"}`}
          >
            <View style={styles.when}>
              <Text style={styles.time}>{a.time}</Text>
              <Text style={[styles.day, day === "Hôm nay" && styles.dayToday]}>{day}</Text>
            </View>
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {a.patientName}
              </Text>
              <Text style={styles.muted} numberOfLines={1}>
                {a.reason ?? "Tái khám"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        );
      })}
    </HomeSectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 6 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  when: { width: 76, alignItems: "flex-start" },
  time: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  day: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  dayToday: { color: colors.info },
  text: { flex: 1, gap: 2 },
  name: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  muted: { fontSize: typography.caption, color: colors.textMuted },
});
