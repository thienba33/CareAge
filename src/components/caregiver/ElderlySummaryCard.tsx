import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { ALERT_SEVERITY_COLOR, ALERT_SEVERITY_ICON } from "../../constants/alert";
import { DOSE_STATUS_COLOR, DOSE_STATUS_ICON, DOSE_STATUS_LABEL } from "../../constants/doseStatus";
import type { CaregiverDashboardItem } from "../../types/caregiver";
import { getEffectiveDoseStatus } from "../../utils/medicationStatus";
import { countdownText } from "../../utils/appointment";
import { calculateAge } from "../../utils/healthProfile";
import { daysFromToday, formatShortDate, fromDateKey, relativeDayText } from "../../utils/date";

type Props = {
  item: CaregiverDashboardItem;
  now: Date;
  onOpenAlerts: () => void;
  onOpenDetail: () => void;
};

// Thẻ tổng quan một người cao tuổi trên Trang chủ người thân.
export default function ElderlySummaryCard({ item, now, onOpenAlerts, onOpenDetail }: Props) {
  const doses = item.doses.map((d) => ({
    ...d,
    effective: getEffectiveDoseStatus({ status: d.status, scheduledTime: d.time }, now),
  }));
  const taken = doses.filter((d) => d.status === "TAKEN").length;
  const total = doses.length;
  const percent = total === 0 ? 0 : Math.round((taken / total) * 100);
  const age = calculateAge(item.dateOfBirth);
  const when = (iso?: string) => (iso ? relativeDayText(new Date(iso), now) : "Chưa đo");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={48} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{item.name}</Text>
          {age !== null ? <Text style={styles.meta}>{age} tuổi</Text> : null}
        </View>
      </View>

      {item.latestAlert && item.unreadAlerts > 0 ? (
        <TouchableOpacity
          style={[styles.alert, { borderColor: ALERT_SEVERITY_COLOR[item.latestAlert.severity] }]}
          onPress={onOpenAlerts}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Ionicons
            name={ALERT_SEVERITY_ICON[item.latestAlert.severity]}
            size={24}
            color={ALERT_SEVERITY_COLOR[item.latestAlert.severity]}
          />
          <Text style={styles.alertText} numberOfLines={2}>
            <Text style={styles.bold}>{item.unreadAlerts} cảnh báo mới: </Text>
            {item.latestAlert.title}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      {/* Thuốc hôm nay: từng liều kèm trạng thái — liều quá giờ chưa uống hiện đỏ để người thân nhắc kịp. */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
          {total > 0 ? (
            <Text style={styles.count}>
              {taken}/{total}
            </Text>
          ) : null}
        </View>
        {total === 0 ? (
          <Text style={styles.muted}>Không có lịch uống thuốc.</Text>
        ) : (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
            {doses.map((d, i) => (
              <View key={`${d.time}-${d.medication}-${i}`} style={styles.doseRow}>
                <Text style={styles.doseTime} numberOfLines={1}>
                  {d.time}
                </Text>
                <Text style={styles.doseName} numberOfLines={1}>
                  {d.medication}
                </Text>
                {/* Chỉ icon (hình dạng khác nhau cho từng trạng thái); chữ trạng thái dành cho trình đọc màn hình. */}
                <Ionicons
                  name={DOSE_STATUS_ICON[d.effective]}
                  size={24}
                  color={DOSE_STATUS_COLOR[d.effective]}
                  accessibilityLabel={DOSE_STATUS_LABEL[d.effective]}
                />
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.statsRow}>
        <Stat
          icon="water"
          label="Huyết áp"
          value={item.latestBp ? `${item.latestBp.systolic}/${item.latestBp.diastolic}` : "--"}
          when={when(item.latestBp?.recordedAt)}
        />
        <Stat icon="heart" label="Nhịp tim" value={item.latestHr ? `${item.latestHr.value}` : "--"} when={when(item.latestHr?.recordedAt)} />
        <Stat icon="fitness" label="SpO2" value={item.latestSpo2 ? `${item.latestSpo2.value}%` : "--"} when={when(item.latestSpo2?.recordedAt)} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color={colors.info} />
          <Text style={styles.sectionTitle}>Lịch khám tới</Text>
          {item.nextAppointment ? (
            <Text style={styles.countdown}>
              {countdownText(daysFromToday(fromDateKey(item.nextAppointment.date), now))}
            </Text>
          ) : null}
        </View>
        {item.nextAppointment ? (
          <>
            <Text style={styles.body}>
              {formatShortDate(fromDateKey(item.nextAppointment.date))} · {item.nextAppointment.time}
            </Text>
            <Text style={styles.muted} numberOfLines={1}>
              {item.nextAppointment.facility}
              {item.nextAppointment.doctor ? ` · ${item.nextAppointment.doctor}` : ""}
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>Chưa có lịch khám.</Text>
        )}
      </View>

      <View style={styles.actions}>
        {item.phone ? (
          <TouchableOpacity
            style={styles.callAction}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Gọi ${item.name}`}
          >
            <Ionicons name="call" size={26} color={colors.surface} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.action, styles.detailAction]}
          onPress={onOpenDetail}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Xem chi tiết sức khỏe của ${item.name}`}
        >
          <Text style={styles.detailText}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Stat({ icon, label, value, when }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; when: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text style={styles.muted}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{when}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerText: { flex: 1 },
  name: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  meta: { fontSize: typography.body, color: colors.textMuted },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.dangerLight,
  },
  alertText: { flex: 1, fontSize: typography.body, color: colors.text },
  bold: { fontWeight: "800" },
  section: { gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  count: { fontSize: typography.h2, fontWeight: "800", color: colors.primary },
  track: { height: 10, borderRadius: 999, backgroundColor: colors.primaryLight, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999, backgroundColor: colors.primary },
  doseRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 },
  // Không đặt độ rộng cố định: "08:00" đậm cỡ 18 sẽ bị xuống dòng trên một số máy.
  doseTime: { minWidth: 56, fontSize: typography.body, fontWeight: "800", color: colors.text },
  doseName: { flex: 1, fontSize: typography.body, color: colors.text },
  body: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  muted: { fontSize: typography.caption, color: colors.textMuted },
  countdown: { fontSize: typography.caption, fontWeight: "700", color: colors.info },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, gap: 2, padding: 10, borderRadius: 14, backgroundColor: colors.background },
  statHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: typography.body, fontWeight: "800", color: colors.text },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 56, borderRadius: 14 },
  // Nút gọi chỉ có icon (vuông), nhường chỗ cho "Xem chi tiết".
  callAction: { width: 56, minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.primary },
  detailAction: { borderWidth: 1.5, borderColor: colors.primary },
  detailText: { fontSize: typography.body, fontWeight: "800", color: colors.primary },
});
