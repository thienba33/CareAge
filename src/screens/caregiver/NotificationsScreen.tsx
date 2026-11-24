import {
  EmptyState,
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  MarkAllReadButton,
  FeedRow,
  FeedSectionHeader,
} from "../../components/common";
import {
  useInbox,
  useSubject,
  usePullToRefresh,
  useNow,
} from "../../hooks";
import React, { useCallback, useLayoutEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { Animated, SectionList, StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { INBOX_BACKGROUND, INBOX_COLOR, INBOX_ICON } from "../../constants/inbox";
import { openInboxTarget } from "../../navigation/inboxNavigation";
import { alertError } from "../../utils/alertError";
import { formatFeedTime, groupByDay } from "../../utils/date";
import type { InboxEntry } from "../../types/inbox";

// Hộp thông báo của người thân: quên uống thuốc, lịch khám ngày mai, cảnh báo sức khỏe.
export default function NotificationsScreen() {
  const { items, entries, unreadCount, isLoading, error, markRead, markAllRead, reload } = useInbox();
  const { select } = useSubject();
  const now = useNow();
  const pullToRefresh = usePullToRefresh(useCallback(() => reload(), [reload]));
  const navigation = useNavigation();

  // Nút "Đánh dấu đã đọc tất cả" nằm trên thanh tiêu đề, cùng hàng chữ "Thông báo" — icon kèm số chưa đọc.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        unreadCount > 0 ? (
          <MarkAllReadButton unreadCount={unreadCount} onPress={() => markAllRead().catch((e) => alertError(e))} />
        ) : null,
    });
  }, [navigation, unreadCount, markAllRead]);

  const sections = useMemo(() => groupByDay(entries, (n) => n.createdAt, now), [entries, now]);

  const open = (n: InboxEntry) => {
    if (n.unreadIds.length > 0) markRead(n.unreadIds).catch((e) => alertError(e));
    openInboxTarget(n.type, n.elderlyId, select);
  };

  if (error && items.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <SectionList
          sections={sections}
          keyExtractor={(n) => n.key}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          {...pullToRefresh.scrollProps}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Chưa có thông báo"
              message="Bạn sẽ nhận thông báo khi người thân quên uống thuốc, sắp có lịch khám hoặc có chỉ số bất thường."
            />
          }
          renderSectionHeader={({ section }) => <FeedSectionHeader title={section.title} />}
          renderItem={({ item }) => (
            <FeedRow
              icon={INBOX_ICON[item.type]}
              iconColor={INBOX_COLOR[item.type]}
              iconBackground={INBOX_BACKGROUND[item.type]}
              title={item.count > 1 ? `${item.title} (${item.count})` : item.title}
              body={item.body}
              meta={formatFeedTime(item.createdAt, now)}
              unread={item.unreadIds.length > 0}
              accessibilityLabel={`${item.title}.${item.count > 1 ? ` Đã nhắc ${item.count} lần.` : ""} ${item.body}`}
              onPress={() => open(item)}
            />
          )}
        />
      </Animated.View>
      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  list: { paddingBottom: 40, flexGrow: 1 },
});
