import { NoLinkedElderlyState } from "../../components/caregiver";
import { AppAvatar, HeroBlobs, LoadingOverlay, NotificationBellButton } from "../../components/common";
import {
  useAuth,
  useSubject,
  useStaffDashboard,
  useStaffNotifications,
  useStaffAppointments,
  useNow,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import LoadErrorBanner from "../../components/home/LoadErrorBanner";
import HomeSectionCard from "../../components/home/HomeSectionCard";
import { UpcomingScheduleCard } from "../../components/staff";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { daysFromToday, formatLongDate, fromDateKey } from "../../utils/date";

const AVATAR_PREVIEW = 5;

// Lời chào ngắn gọn cho vừa một dòng: "BS. Phạm Thị Hoa" → "BS. Hoa" (gọi bằng tên, như trang chủ các role khác).
function greetingName(fullName?: string): string {
  const name = fullName?.trim();
  if (!name) return "Bác sĩ";
  const withoutTitle = name.replace(/^(bs|bác sĩ|ths|ts|pgs)\.?\s+/i, "");
  const given = withoutTitle.split(/\s+/).pop() ?? withoutTitle;
  return `BS. ${given}`;
}

// Trang chủ bác sĩ: lời chào + chuông Thông báo (yêu cầu chờ duyệt, cảnh báo mới), ô số liệu trong ngày,
// lịch khám gần nhất và danh sách bệnh nhân.
export default function StaffHomeScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useAuth();
  const { select, reloadLinks } = useSubject();
  const dashboard = useStaffDashboard();
  const schedule = useStaffAppointments();
  const notifications = useStaffNotifications();
  const now = useNow();
  const pullToRefresh = usePullToRefresh(
    useCallback(
      () => Promise.all([dashboard.reload(), notifications.reload(), reloadLinks()]),
      [dashboard.reload, notifications.reload, reloadLinks]
    )
  );

  const patients = dashboard.items;
  const upcoming = useMemo(() => schedule.appointments.filter((a) => a.status === "UPCOMING"), [schedule.appointments]);
  const todayCount = useMemo(
    () => upcoming.filter((a) => daysFromToday(fromDateKey(a.date), now) === 0).length,
    [upcoming, now]
  );
  const pendingCount = notifications.pending.length;
  const badge = notifications.badgeCount;

  const name = greetingName(currentUser?.name);
  const summaryParts = [
    todayCount > 0 ? `${todayCount} lịch khám` : null,
    pendingCount > 0 ? `${pendingCount} yêu cầu chờ duyệt` : null,
  ].filter(Boolean);
  const summary = summaryParts.length > 0 ? `Hôm nay: ${summaryParts.join(" · ")}` : "Hôm nay chưa có việc cần xử lý";

  const error = dashboard.error ?? schedule.error;
  const hasNoPatients = !dashboard.isLoading && !dashboard.error && patients.length === 0;

  const goTab = (screen: "Appointments" | "Patients") => navigation.navigate("Main", { screen });
  const openPatient = (elderlyId: string) => {
    select(elderlyId);
    navigation.navigate("PatientDetail");
  };

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={commonStyles.scrollContent} showsVerticalScrollIndicator={false} {...pullToRefresh.scrollProps}>
          <View style={styles.hero}>
            <HeroBlobs />
            <View style={styles.heroText}>
              <Text style={styles.eyebrow}>{formatLongDate(now)}</Text>
              <Text style={commonStyles.heroTitle} numberOfLines={1}>
                Xin chào, {name}!
              </Text>
              <Text style={styles.subtitle}>{summary}</Text>
            </View>

            {/* Chuông ghim góc phải phần đầu trang — lời chào dài cũng không đẩy mất. */}
            <NotificationBellButton
              style={styles.bell}
              unreadCount={badge}
              onPress={() => navigation.navigate("StaffNotifications")}
              accessibilityLabel={badge > 0 ? `Thông báo, ${badge} việc cần xử lý` : "Thông báo"}
            />
          </View>

          {/* Ô số liệu nổi lên phần đầu trang — bấm để tới đúng nơi xử lý. */}
          <View style={styles.statsCard}>
            <StatTile
              icon="hourglass-outline"
              color={colors.warning}
              value={pendingCount}
              label="Chờ duyệt"
              onPress={() => goTab("Appointments")}
            />
            <View style={styles.statDivider} />
            <StatTile icon="calendar" color={colors.info} value={todayCount} label="Khám hôm nay" onPress={() => goTab("Appointments")} />
            <View style={styles.statDivider} />
            <StatTile icon="people" color={colors.primary} value={patients.length} label="Bệnh nhân" onPress={() => goTab("Patients")} />
          </View>

          <View style={styles.sections}>
            {error ? (
              <LoadErrorBanner
                message={error}
                onRetry={() => {
                  dashboard.reload();
                  schedule.reload();
                }}
              />
            ) : null}

            {hasNoPatients ? (
              <View style={styles.emptyCard}>
                <NoLinkedElderlyState />
              </View>
            ) : (
              <>
                <UpcomingScheduleCard
                  upcoming={upcoming}
                  now={now}
                  isLoading={schedule.isLoading}
                  onOpenPatient={(a) => openPatient(a.userId)}
                  onPress={() => goTab("Appointments")}
                />

                <HomeSectionCard
                  icon="people"
                  title="Bệnh nhân của bạn"
                  isLoading={dashboard.isLoading}
                  onPress={() => goTab("Patients")}
                  headerRight={<Text style={styles.count}>{patients.length}</Text>}
                >
                  <View style={styles.avatarRow}>
                    {patients.slice(0, AVATAR_PREVIEW).map((p) => (
                      <AppAvatar
                        key={p.elderlyId}
                        name={p.name}
                        size={44}
                        variant="primaryLight"
                      />
                    ))}
                    {patients.length > AVATAR_PREVIEW ? (
                      <AppAvatar
                        name={`+${patients.length - AVATAR_PREVIEW}`}
                        size={44}
                        variant="muted"
                      />
                    ) : null}
                  </View>
                  <Text style={styles.muted}>Xem hồ sơ, chỉ số và lịch sử khám của từng người.</Text>
                </HomeSectionCard>
              </>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

function StatTile({
  icon,
  color,
  value,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statTile}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.statTop}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: colors.primary,
    overflow: "hidden",
  },
  // Chừa chỗ bên phải cho chuông (48) + khoảng cách.
  heroText: { gap: 4, paddingRight: 60 },
  eyebrow: { fontSize: typography.caption, fontWeight: "700", color: colors.primaryLight, textTransform: "uppercase" },
  subtitle: { fontSize: typography.body, color: colors.primaryLight },
  bell: {
    position: "absolute",
    top: 64,
    right: 24,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: -32,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  statTile: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 6, minHeight: 56, justifyContent: "center" },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  statValue: { fontSize: typography.h1, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  statDivider: { width: 1, alignSelf: "stretch", marginVertical: 6, backgroundColor: colors.border },
  sections: { gap: 16, paddingHorizontal: 20, marginTop: 20 },
  emptyCard: { borderRadius: 20, backgroundColor: colors.surface },
  count: { fontSize: typography.h2, fontWeight: "800", color: colors.primary },
  avatarRow: { flexDirection: "row", gap: 8 },
  muted: { fontSize: typography.caption, color: colors.textMuted },
});
