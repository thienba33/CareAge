import { EmptyCard } from "../common";
import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import type { Appointment } from "../../types/appointment";
import { countdownText, splitAppointments } from "../../utils/appointment";
import { daysFromToday, formatLongDate, formatShortDate, fromDateKey } from "../../utils/date";
import AppointmentStatusBadge from "./AppointmentStatusBadge";

type Props = {
  appointments: Appointment[];
  onSelect: (appointment: Appointment) => void;
  onOpenHistory: () => void;
};

// Lịch tái khám: lần khám tới được làm nổi bật, yêu cầu đang chờ xác nhận, các lịch sắp tới khác;
// lịch đã qua nằm ở màn "Lịch sử khám" (mở bằng nút cuối trang).
export default function AppointmentSection({ appointments, onSelect, onOpenHistory }: Props) {
  const { pending, upcoming, past } = useMemo(() => splitAppointments(appointments), [appointments]);
  const [next, ...laterUpcoming] = upcoming;

  // Dòng phụ của nút "Lịch sử khám": ngày của buổi khám gần nhất đã qua.
  const lastPast = past[0];
  const historySummary = lastPast
    ? `Gần nhất ${formatShortDate(fromDateKey(lastPast.date))}/${fromDateKey(lastPast.date).getFullYear()}`
    : "Chưa có buổi khám nào";

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Lần khám tới</Text>
      {next ? (
        <NextAppointmentHighlight appointment={next} onPress={() => onSelect(next)} />
      ) : (
        <EmptyCard
          icon="calendar-outline"
          iconSize={28}
          message="Chưa có lịch tái khám sắp tới."
        />
      )}

      {pending.length > 0 ? (
        <>
          <Text style={[styles.heading, styles.headingSpaced]}>Đang chờ xác nhận</Text>
          <View style={styles.list}>
            {pending.map((a, i) => (
              <AppointmentRow key={a.id} appointment={a} isLast={i === pending.length - 1} onPress={() => onSelect(a)} />
            ))}
          </View>
        </>
      ) : null}

      {laterUpcoming.length > 0 ? (
        <>
          <Text style={[styles.heading, styles.headingSpaced]}>Các lịch sắp tới khác</Text>
          <View style={styles.list}>
            {laterUpcoming.map((a, i) => (
              <AppointmentRow key={a.id} appointment={a} isLast={i === laterUpcoming.length - 1} onPress={() => onSelect(a)} />
            ))}
          </View>
        </>
      ) : null}

      <TouchableOpacity
        style={styles.historyButton}
        activeOpacity={0.85}
        onPress={onOpenHistory}
        accessibilityRole="button"
        accessibilityLabel={`Lịch sử khám, ${historySummary}`}
      >
        <View style={styles.historyIcon}>
          <Ionicons name="time" size={26} color={colors.primary} />
        </View>
        <View style={styles.historyText}>
          <Text style={styles.historyTitle}>Lịch sử khám</Text>
          <Text style={styles.historySummary}>{historySummary}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function NextAppointmentHighlight({ appointment, onPress }: { appointment: Appointment; onPress: () => void }) {
  const date = fromDateKey(appointment.date);
  const days = daysFromToday(date);

  return (
    <TouchableOpacity
      style={styles.highlight}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Lần khám tới: ${formatLongDate(date)}, ${appointment.time}, tại ${appointment.facility}. ${countdownText(days)}`}
    >
      <View style={styles.highlightTop}>
        <View style={styles.countdown}>
          <Ionicons name="hourglass-outline" size={16} color={colors.info} />
          <Text style={styles.countdownText}>{countdownText(days)}</Text>
        </View>
      </View>
      <Text style={styles.highlightTime}>{appointment.time}</Text>
      <Text style={styles.highlightDate}>{formatLongDate(date)}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="business-outline" size={18} color={colors.textMuted} />
        <Text style={styles.meta} numberOfLines={1}>
          {appointment.facility}
        </Text>
      </View>
      {appointment.reason ? (
        <View style={styles.metaRow}>
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>
            {appointment.reason}
          </Text>
        </View>
      ) : null}
      {appointment.staffNote ? (
        <View style={styles.staffNote}>
          <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
          <Text style={styles.staffNoteText} numberOfLines={2}>
            <Text style={styles.staffNoteLabel}>Bác sĩ dặn: </Text>
            {appointment.staffNote.replace(/\n+/g, "; ")}
          </Text>
        </View>
      ) : null}
      <View style={styles.highlightFooter}>
        <Text style={styles.detailLink}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

export function AppointmentRow({
  appointment,
  isLast,
  onPress,
}: {
  appointment: Appointment;
  isLast: boolean;
  onPress: () => void;
}) {
  const date = fromDateKey(appointment.date);
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowDivider]}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.dateBox}>
        <Text style={styles.dateBoxDay}>{date.getDate()}</Text>
        <Text style={styles.dateBoxMonth}>Th {date.getMonth() + 1}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {appointment.reason ?? "Tái khám"}
        </Text>
        <Text style={styles.rowMeta}>
          {formatShortDate(date)}/{date.getFullYear()} · {appointment.time}
        </Text>
        <AppointmentStatusBadge status={appointment.status} />
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  headingSpaced: { marginTop: 12 },

  highlight: {
    gap: 6,
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.info,
    backgroundColor: colors.surface,
  },
  highlightTop: { flexDirection: "row", alignItems: "center" },
  countdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.infoLight,
  },
  countdownText: { fontSize: typography.body, fontWeight: "800", color: colors.info },
  highlightTime: { fontSize: 36, fontWeight: "800", color: colors.text },
  highlightDate: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { flex: 1, fontSize: typography.body, color: colors.textMuted },
  staffNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  staffNoteText: { flex: 1, fontSize: typography.body, color: colors.text },
  staffNoteLabel: { fontWeight: "800", color: colors.primary },
  highlightFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 4 },
  detailLink: { fontSize: typography.body, fontWeight: "700", color: colors.primary },
  list: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dateBox: {
    width: 56,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  dateBoxDay: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  dateBoxMonth: { fontSize: typography.caption, color: colors.textMuted },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: typography.caption, color: colors.textMuted },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  historyText: { flex: 1, gap: 2 },
  historyTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  historySummary: { fontSize: typography.caption, color: colors.textMuted },
});
