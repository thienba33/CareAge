import { AppAvatar } from "../common";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { ALERT_SEVERITY_BACKGROUND, ALERT_SEVERITY_COLOR, ALERT_SEVERITY_ICON } from "../../constants/alert";
import type { StaffDashboardItem } from "../../types/staff";
import { calculateAge } from "../../utils/healthProfile";
import { formatShortDate, fromDateKey, isSameDay } from "../../utils/date";

type Props = {
  item: StaffDashboardItem;
  now: Date;
  isLast: boolean;
  onPress: () => void;
};

// Một hàng trong danh sách bệnh nhân (liền mạch, ngăn bằng đường kẻ): tên, mã · tuổi và các nhãn nhỏ
// cho việc cần làm — yêu cầu chờ duyệt, cảnh báo mới, lịch khám tới (chỉ hiện nhãn khi có).
export default function PatientRow({ item, now, isLast, onPress }: Props) {
  const age = calculateAge(item.dateOfBirth);
  const next = item.nextAppointment;
  const nextDate = next ? fromDateKey(next.date) : null;
  const severity = item.unreadAlerts > 0 ? item.latestAlert?.severity : undefined;

  const labelParts = [
    `${item.name}, mã ${item.code}`,
    age !== null ? `${age} tuổi` : null,
    item.pendingRequests > 0 ? `${item.pendingRequests} yêu cầu chờ duyệt` : null,
    item.unreadAlerts > 0 ? `${item.unreadAlerts} cảnh báo mới` : null,
    next ? `lịch tới ${next.time}` : null,
  ].filter(Boolean);

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.divider]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${labelParts.join(", ")}. Xem hồ sơ`}
    >
      <AppAvatar
        name={item.name}
        size={48}
        variant="primaryLight"
        badgeColor={severity ? ALERT_SEVERITY_COLOR[severity] : undefined}
      />

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          Mã {item.code}
          {age !== null ? ` · ${age} tuổi` : ""}
        </Text>

        {item.pendingRequests > 0 || severity || (next && nextDate) ? (
          <View style={styles.tags}>
            {item.pendingRequests > 0 ? (
              <Tag icon="hourglass-outline" color={colors.warning} background={colors.warningLight}>
                {item.pendingRequests} chờ duyệt
              </Tag>
            ) : null}
            {severity ? (
              <Tag icon={ALERT_SEVERITY_ICON[severity]} color={ALERT_SEVERITY_COLOR[severity]} background={ALERT_SEVERITY_BACKGROUND[severity]}>
                {item.unreadAlerts} cảnh báo
              </Tag>
            ) : null}
            {next && nextDate ? (
              <Tag icon="calendar-outline" color={colors.info} background={colors.infoLight}>
                {next.time} · {isSameDay(nextDate, now) ? "Hôm nay" : formatShortDate(nextDate)}
              </Tag>
            ) : null}
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function Tag({
  icon,
  color,
  background,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: background }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.tagText, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },

  text: { flex: 1, gap: 2 },
  name: { fontSize: typography.body, fontWeight: "800", color: colors.text },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: typography.caption, fontWeight: "700" },
});
