import { AppAvatar } from "../common";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import type { StaffAppointment } from "../../types/staff";
import { daysFromToday, formatShortDate, fromDateKey } from "../../utils/date";

type Props = {
  appointment: StaffAppointment;
  now: Date;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
};

// Thẻ gọn một yêu cầu đặt lịch chờ duyệt: tên; một dòng giờ · ngày · nội dung; ghi chú (nếu có);
// bấm vào thẻ để xem chi tiết; hai nút Từ chối / Xác nhận ngay dưới.
export default function RequestCard({ appointment: a, now, onOpen, onApprove, onReject }: Props) {
  const date = fromDateKey(a.date);
  const isToday = daysFromToday(date, now) === 0;
  const reason = a.reason ?? "Tái khám";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onOpen}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${a.patientName}, ${a.time} ${isToday ? "hôm nay" : formatShortDate(date)}, ${reason}. Bấm để xem chi tiết`}
    >
      <AppAvatar
        name={a.patientName}
        size={40}
        variant="primaryLight"
      />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {a.patientName}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <Text style={styles.summary} numberOfLines={1}>
          <Text style={styles.time}>{a.time}</Text> · {isToday ? "Hôm nay" : formatShortDate(date)} · {reason}
        </Text>

        {a.note ? (
          <Text style={styles.note} numberOfLines={2}>
            “{a.note}”
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={onReject}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Từ chối yêu cầu của ${a.patientName}`}
          >
            <Text style={styles.rejectText}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={onApprove}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Xác nhận lịch khám của ${a.patientName}`}
          >
            <Ionicons name="checkmark" size={18} color={colors.surface} />
            <Text style={styles.approveText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  body: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: typography.body, fontWeight: "800", color: colors.text },
  summary: { fontSize: typography.caption, color: colors.text },
  time: { fontWeight: "800" },
  note: { fontSize: typography.caption, lineHeight: 19, fontStyle: "italic", color: colors.textMuted },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  rejectButton: { backgroundColor: colors.background },
  rejectText: { fontSize: typography.caption, fontWeight: "700", color: colors.danger },
  approveButton: { flex: 1, backgroundColor: colors.primary },
  approveText: { fontSize: typography.caption, fontWeight: "800", color: colors.surface },
});
