import { LoadingOverlay, NotificationBellButton, Skeleton } from "../../components/common";
import {
  useAuth,
  useSubject,
  useCaregiverDashboard,
  useNow,
  useInbox,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import LoadErrorBanner from "../../components/home/LoadErrorBanner";
import {
  AcceptInviteModal,
  ElderlySummaryCard,
  NoLinkedElderlyState,
} from "../../components/caregiver";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { formatLongDate } from "../../utils/date";

// Trang chủ người thân: tổng quan mọi người cao tuổi đang theo dõi.
export default function CaregiverHomeScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useAuth();
  const { select, reloadLinks } = useSubject();
  const { items, isLoading, error, reload } = useCaregiverDashboard();
  const { unreadCount, reload: reloadInbox } = useInbox();
  const [acceptVisible, setAcceptVisible] = useState(false);
  const now = useNow();
  const pullToRefresh = usePullToRefresh(useCallback(() => Promise.all([reload(), reloadLinks(), reloadInbox()]), [reload, reloadLinks, reloadInbox]));

  const firstName = currentUser?.name?.trim().split(" ").pop() ?? "bạn";

  const open = (elderlyId: string, target: "Vitals" | "Alerts") => {
    select(elderlyId);
    if (target === "Alerts") navigation.navigate("Alerts");
    else navigation.navigate("Main", { screen: "Vitals" });
  };

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={commonStyles.scrollContent} showsVerticalScrollIndicator={false} {...pullToRefresh.scrollProps}>
          <View style={commonStyles.heroCompact}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroText}>
                <Text style={styles.eyebrow}>{formatLongDate(now)}</Text>
                <Text style={commonStyles.heroTitle}>Xin chào, {firstName}!</Text>
                <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  Sức khỏe người thân hôm nay
                </Text>
              </View>
              <NotificationBellButton
                unreadCount={unreadCount}
                onPress={() => navigation.navigate("Notifications")}
              />
            </View>
          </View>

          <View style={styles.sections}>
            {error ? <LoadErrorBanner message={error} onRetry={reload} /> : null}

            {isLoading ? (
              <View style={styles.skeletonCard}>
                <Skeleton width="60%" height={24} />
                <Skeleton height={12} />
                <Skeleton width="80%" />
              </View>
            ) : items.length === 0 && !error ? (
              <View style={styles.emptyCard}>
                <NoLinkedElderlyState onLink={() => setAcceptVisible(true)} />
              </View>
            ) : (
              items.map((item) => (
                <ElderlySummaryCard
                  key={item.elderlyId}
                  item={item}
                  now={now}
                  onOpenAlerts={() => open(item.elderlyId, "Alerts")}
                  onOpenDetail={() => open(item.elderlyId, "Vitals")}
                />
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <AcceptInviteModal
        visible={acceptVisible}
        onClose={() => setAcceptVisible(false)}
        onLinked={() => {
          setAcceptVisible(false);
          reloadLinks();
          reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  heroText: { flexShrink: 1, gap: 4 },
  eyebrow: { fontSize: typography.caption, fontWeight: "700", color: colors.primaryLight, textTransform: "uppercase" },
  subtitle: { fontSize: typography.body, color: colors.primaryLight },
  sections: { gap: 16, paddingHorizontal: 20, marginTop: 16 },
  skeletonCard: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface },
  emptyCard: { borderRadius: 20, backgroundColor: colors.surface },
});
