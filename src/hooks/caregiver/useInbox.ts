import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inboxService } from "../../services";
import type { InboxNotification } from "../../types/inbox";
import { groupInbox } from "../../utils/inbox";
import { useAuth } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

// Hộp thông báo của người đăng nhập (hiện dùng cho người thân).
export function useInbox() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = currentUser?.id ?? "";
  const enabled = currentUser?.role === "CAREGIVER";

  const query = useQuery({
    queryKey: queryKeys.inbox(userId),
    queryFn: () => inboxService.getInbox(userId),
    enabled,
  });

  const items = query.data ?? EMPTY_ARRAY;
  // Mỗi dòng hiển thị (đã gộp lần nhắc lại) tính là một thông báo chưa đọc.
  const entries = useMemo(() => groupInbox(items), [items]);
  const unreadCount = useMemo(() => entries.filter((e) => e.unreadIds.length > 0).length, [entries]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await inboxService.markRead(ids);
      const now = new Date().toISOString();
      queryClient.setQueryData<InboxNotification[]>(queryKeys.inbox(userId), (prev) =>
        prev?.map((n) => (ids.includes(n.id) && !n.readAt ? { ...n, readAt: now } : n))
      );
    },
    [queryClient, userId]
  );

  const markAllRead = useCallback(
    () => markRead(items.filter((n) => !n.readAt).map((n) => n.id)),
    [items, markRead]
  );

  return {
    items,
    entries,
    unreadCount,
    isLoading: enabled && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    markRead,
    markAllRead,
    reload: query.refetch,
  };
}
