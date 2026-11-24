import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { alertService } from "../../services";
import type { HealthAlert } from "../../types/alert";
import { useAuth, useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

export function useAlerts() {
  const { currentUser } = useAuth();
  const { subjectId, isSelf } = useSubject();
  const queryClient = useQueryClient();
  const userId = subjectId ?? "";
  const viewerId = currentUser?.id ?? "";

  const query = useQuery({
    queryKey: queryKeys.alerts(userId),
    queryFn: () => (isSelf ? alertService.getAlerts(userId) : alertService.getAlertsForViewer(userId, viewerId)),
    enabled: !!subjectId,
  });

  const alerts = query.data ?? EMPTY_ARRAY;
  const unreadCount = useMemo(() => alerts.filter((a) => !a.readAt).length, [alerts]);

  const setRead = useCallback(
    (ids: string[]) => {
      const now = new Date().toISOString();
      queryClient.setQueryData<HealthAlert[]>(queryKeys.alerts(userId), (prev) =>
        prev?.map((a) => (ids.includes(a.id) && !a.readAt ? { ...a, readAt: now } : a))
      );
      if (!isSelf) {
        queryClient.invalidateQueries({ queryKey: ["caregiverDashboard"] });
        queryClient.invalidateQueries({ queryKey: ["staffDashboard"] });
        queryClient.invalidateQueries({ queryKey: ["staffAlerts"] });
      }
    },
    [queryClient, userId, isSelf]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      if (isSelf) await alertService.markAsRead(id);
      else await alertService.markReadForViewer([id], viewerId);
      setRead([id]);
    },
    [isSelf, viewerId, setRead]
  );

  const markAllAsRead = useCallback(async () => {
    if (!subjectId) return;
    const unreadIds = alerts.filter((a) => !a.readAt).map((a) => a.id);
    if (isSelf) await alertService.markAllAsRead(subjectId);
    else await alertService.markReadForViewer(unreadIds, viewerId);
    setRead(unreadIds);
  }, [subjectId, isSelf, alerts, viewerId, setRead]);

  return {
    alerts,
    unreadCount,
    isLoading: !!subjectId && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    markAsRead,
    markAllAsRead,
    reload: query.refetch,
  };
}
