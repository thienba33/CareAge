import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { WEEKDAY_SHORT, addDays, formatLongDate, isSameDay, startOfWeek, toDateKey } from "../../utils/date";

type Props = {
  // Thời điểm mở form — ngày đầu được chọn là hôm nay, hôm nay chỉ chọn được khung giờ chưa qua.
  now: Date;
  // Ngày cuối được chọn (00:00 giờ local).
  maxDate: Date;
  timeSlots: string[];
  date: Date | null;
  time: string | null;
  onChange: (date: Date, time: string) => void;
};

const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const toMinutes = (slot: string) => {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
};

// Ô "Thời gian khám": bấm vào → popup gồm lịch tháng dạng lưới (T2 → CN, ô lớn dễ bấm) và khung giờ
// (sáng / chiều) ngay bên dưới. Chọn đủ ngày + giờ rồi bấm "Xác nhận" mới cập nhật vào form.
export default function RequestDateTimePicker({ now, maxDate, timeSlots, date, time, onChange }: Props) {
  const minDate = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftTime, setDraftTime] = useState<string | null>(null);

  const dayLabel = (d: Date) => `${isSameDay(d, minDate) ? "Hôm nay, " : ""}${formatLongDate(d)}`;

  // Hôm nay chỉ cho chọn khung giờ chưa qua.
  const isSlotPast = (d: Date | null, slot: string) =>
    !!d && isSameDay(d, now) && toMinutes(slot) <= now.getHours() * 60 + now.getMinutes();

  const slotGroups = useMemo(
    () => [
      { title: "Buổi sáng", slots: timeSlots.filter((s) => toMinutes(s) < 12 * 60) },
      { title: "Buổi chiều", slots: timeSlots.filter((s) => toMinutes(s) >= 12 * 60) },
    ].filter((g) => g.slots.length > 0),
    [timeSlots]
  );

  // Mở popup với lựa chọn hiện tại, ở tháng của ngày đang chọn (hoặc tháng hiện tại).
  const openPicker = () => {
    const base = date ?? minDate;
    setMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setDraftDate(date);
    setDraftTime(time);
    setOpen(true);
  };

  const pickDate = (d: Date) => {
    setDraftDate(d);
    // Đổi sang hôm nay mà giờ đang chọn đã qua → bỏ chọn giờ.
    if (draftTime && isSlotPast(d, draftTime)) setDraftTime(null);
  };

  const confirm = () => {
    if (!draftDate || !draftTime) return;
    onChange(draftDate, draftTime);
    setOpen(false);
  };

  const canPrev = monthKey(month) > monthKey(minDate);
  const canNext = monthKey(month) < monthKey(maxDate);

  // Các tuần phủ tháng đang xem, mỗi tuần 7 ô (ô của tháng khác để trống).
  const weeks = useMemo(() => {
    const first = startOfWeek(month);
    const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const rows: (Date | null)[][] = [];
    for (let start = first; start <= lastOfMonth; start = addDays(start, 7)) {
      rows.push(
        Array.from({ length: 7 }, (_, i) => {
          const d = addDays(start, i);
          return d.getMonth() === month.getMonth() ? d : null;
        })
      );
    }
    return rows;
  }, [month]);

  const shiftMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <>
      <TouchableOpacity
        style={[styles.field, !!date && !!time && styles.fieldFilled]}
        onPress={openPicker}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={
          date && time ? `Thời gian khám: ${time}, ${dayLabel(date)}. Bấm để đổi` : "Chọn ngày và giờ khám"
        }
      >
        <Ionicons name="calendar" size={24} color={date && time ? colors.primary : colors.textMuted} />
        {date && time ? (
          <View style={styles.fieldTextCol}>
            <Text style={styles.fieldTime}>{time}</Text>
            <Text style={styles.fieldText}>{dayLabel(date)}</Text>
          </View>
        ) : (
          <Text style={[styles.fieldText, styles.fieldPlaceholder]}>Chọn ngày và giờ khám</Text>
        )}
        <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} accessibilityLabel="Đóng" />
          <View style={styles.popup}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Thời gian khám</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
                <Ionicons name="close" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.popupContent}>
              <Text style={styles.stepTitle}>1. Ngày khám</Text>
              <View style={styles.header}>
                <TouchableOpacity
                  style={[styles.navButton, !canPrev && styles.hidden]}
                  onPress={() => shiftMonth(-1)}
                  disabled={!canPrev}
                  accessibilityRole="button"
                  accessibilityLabel="Tháng trước"
                >
                  <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  Tháng {month.getMonth() + 1}/{month.getFullYear()}
                </Text>
                <TouchableOpacity
                  style={[styles.navButton, !canNext && styles.hidden]}
                  onPress={() => shiftMonth(1)}
                  disabled={!canNext}
                  accessibilityRole="button"
                  accessibilityLabel="Tháng sau"
                >
                  <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                {WEEKDAY_SHORT.map((w) => (
                  <Text key={w} style={styles.weekday}>
                    {w}
                  </Text>
                ))}
              </View>

              {weeks.map((week, wi) => (
                <View key={wi} style={styles.row}>
                  {week.map((d, di) => {
                    if (!d) return <View key={di} style={styles.cell} />;
                    const disabled = d < minDate || d > maxDate;
                    const active = !!draftDate && isSameDay(d, draftDate);
                    const isToday = isSameDay(d, minDate);
                    return (
                      <TouchableOpacity
                        key={toDateKey(d)}
                        style={styles.cell}
                        onPress={() => pickDate(d)}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active, disabled }}
                        accessibilityLabel={`${isToday ? "Hôm nay, " : ""}${formatLongDate(d)}`}
                      >
                        <View style={[styles.day, isToday && styles.dayToday, active && styles.dayActive]}>
                          <Text
                            style={[
                              styles.dayText,
                              disabled && styles.dayTextDisabled,
                              active && styles.dayTextActive,
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              <Text style={[styles.stepTitle, styles.stepTitleSpaced]}>2. Giờ khám</Text>
              {draftDate ? (
                slotGroups.map((group) => (
                  <View key={group.title} style={styles.slotGroup}>
                    <Text style={styles.slotGroupTitle}>{group.title}</Text>
                    <View style={styles.slotWrap}>
                      {group.slots.map((slot) => {
                        const disabled = isSlotPast(draftDate, slot);
                        const active = draftTime === slot;
                        return (
                          <TouchableOpacity
                            key={slot}
                            style={[styles.slot, active && styles.slotActive, disabled && styles.slotDisabled]}
                            onPress={() => setDraftTime(slot)}
                            disabled={disabled}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active, disabled }}
                          >
                            <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.hint}>Chọn ngày ở lịch phía trên để xem giờ khám.</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmButton, !(draftDate && draftTime) && styles.confirmButtonDisabled]}
              onPress={confirm}
              disabled={!(draftDate && draftTime)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>
                {draftDate && draftTime ? `Xác nhận ${draftTime} · ${formatLongDate(draftDate)}` : "Xác nhận"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  fieldTextCol: { flex: 1, paddingVertical: 8 },
  fieldTime: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  fieldText: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  fieldPlaceholder: { fontWeight: "400", color: colors.textMuted },
  overlay: { flex: 1, justifyContent: "center", padding: 16 },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  popup: { maxHeight: "92%", gap: 12, padding: 16, borderRadius: 24, backgroundColor: colors.surface },
  popupContent: { gap: 4 },
  stepTitle: { fontSize: typography.body, fontWeight: "800", color: colors.text, marginBottom: 4 },
  stepTitleSpaced: { marginTop: 12 },
  hint: { fontSize: typography.body, color: colors.textMuted },
  slotGroup: { gap: 6, marginBottom: 8 },
  slotGroupTitle: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    minWidth: 76,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotDisabled: { opacity: 0.35 },
  slotText: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  slotTextActive: { color: colors.surface },
  confirmButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { fontSize: typography.body, fontWeight: "800", color: colors.surface, textAlign: "center" },
  popupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  popupTitle: { fontSize: typography.h2, fontWeight: "800", color: colors.text },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  navButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },
  hidden: { opacity: 0 },
  monthTitle: { fontSize: typography.body, fontWeight: "800", color: colors.text },
  row: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 4,
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
  },
  cell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  day: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  dayTextDisabled: { color: colors.border },
  dayTextActive: { color: colors.surface },
});
