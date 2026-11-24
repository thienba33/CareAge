import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import type { Appointment } from "../../types/appointment";
import { countdownText } from "../../utils/appointment";
import { daysFromToday, fromDateKey, WEEKDAY_LONG } from "../../utils/date";
import HomeSectionCard from "./HomeSectionCard";

// Cùng một cỡ icon và cỡ chữ (theo theme typography) cho cả ô lịch và cột thông tin.
const ICON_SIZE = 20;
const LINE_HEIGHT = 24;

type Props = {
  appointment: Appointment | null;
  now: Date;
  isLoading: boolean;
  onPress: () => void;
};

export default function NextAppointmentCard({ appointment, now, isLoading, onPress }: Props) {
  const date = appointment ? fromDateKey(appointment.date) : null;
  const days = date ? daysFromToday(date, now) : 0;
  const isSoon = days <= 1;

  return (
    <HomeSectionCard
      icon="calendar"
      iconColor={colors.info}
      iconBackground={colors.infoLight}
      title="Lịch khám tới"
      headerRight={
        appointment ? (
          <View style={[styles.countdown, isSoon && styles.countdownSoon]}>
            <Text style={[styles.countdownText, isSoon && styles.countdownTextSoon]}>{countdownText(days)}</Text>
          </View>
        ) : null
      }
      isLoading={isLoading}
      isEmpty={!appointment}
      emptyText="Chưa có lịch khám."
      onPress={appointment ? onPress : undefined}
    >
      {appointment && date ? (
        <View style={styles.row}>
          {/* Ô lịch: thứ / ngày / tháng / giờ khám — gom thời gian vào một chỗ */}
          <View style={styles.calendar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={styles.calendarWeekday}>{WEEKDAY_LONG[date.getDay()]}</Text>
            <Text style={styles.calendarDate}>
              {date.getDate()} tháng {date.getMonth() + 1}
            </Text>
            <View style={styles.calendarTime}>
              <Ionicons name="time-outline" size={ICON_SIZE} color={colors.surface} />
              <Text style={styles.calendarTimeText}>{appointment.time}</Text>
            </View>
          </View>

          <View
            style={styles.info}
            accessible
            accessibilityLabel={`${appointment.time}, ${WEEKDAY_LONG[date.getDay()]} ngày ${date.getDate()} tháng ${
              date.getMonth() + 1
            }, tại ${appointment.facility}${appointment.doctor ? `, ${appointment.doctor}` : ""}`}
          >
            <InfoLine icon="business-outline" text={appointment.facility} emphasized />
            {appointment.doctor ? <InfoLine icon="person-outline" text={appointment.doctor} /> : null}
            {appointment.reason ? <InfoLine icon="document-text-outline" text={appointment.reason} /> : null}
          </View>
        </View>
      ) : null}
    </HomeSectionCard>
  );
}

function InfoLine({
  icon,
  text,
  emphasized,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  // Dòng chính (cơ sở y tế): chữ đậm, cho phép 2 dòng.
  emphasized?: boolean;
}) {
  return (
    <View style={styles.infoLine}>
      <Ionicons
        name={icon}
        size={ICON_SIZE}
        color={emphasized ? colors.info : colors.textMuted}
        style={styles.infoIcon}
      />
      <Text style={[styles.infoText, emphasized && styles.infoTextStrong]} numberOfLines={emphasized ? 2 : 1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  countdown: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.infoLight },
  countdownSoon: { backgroundColor: colors.info },
  countdownText: { fontSize: typography.caption, fontWeight: "700", color: colors.info },
  countdownTextSoon: { color: colors.surface },
  // stretch: ô lịch và cột thông tin luôn cao bằng nhau.
  row: { flexDirection: "row", alignItems: "stretch", gap: 14 },
  calendar: {
    width: 112,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.infoLight,
  },
  calendarWeekday: { fontSize: typography.caption, lineHeight: 20, fontWeight: "700", color: colors.info },
  calendarDate: { fontSize: typography.body, lineHeight: LINE_HEIGHT, fontWeight: "700", color: colors.text },
  calendarTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.info,
  },
  calendarTimeText: { fontSize: typography.body, lineHeight: LINE_HEIGHT, fontWeight: "700", color: colors.surface },
  info: { flex: 1, justifyContent: "center", gap: 12 },
  // Icon căn theo dòng chữ đầu tiên để mép trái các dòng thẳng hàng, kể cả khi chữ xuống dòng.
  infoLine: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  infoIcon: { marginTop: (LINE_HEIGHT - ICON_SIZE) / 2 },
  infoText: { flex: 1, fontSize: typography.body, lineHeight: LINE_HEIGHT, color: colors.text },
  infoTextStrong: { fontWeight: "700" },
});
