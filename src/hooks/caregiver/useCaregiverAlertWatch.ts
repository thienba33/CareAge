import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  notificationService,
  pushTokenService,
  realtimeService,
  toInboxNotification,
} from "../../services";
import { queryKeys } from "../../constants/queryKeys";
import { openInboxTarget } from "../../navigation/inboxNavigation";
import type { InboxNotification, InboxType } from "../../types/inbox";
import type { NotificationType } from "../../constants/notification";
import type { ReminderData } from "../../utils/reminders";
import { useAuth, useSubject } from "../auth";

const LOCAL_TYPE: Record<InboxType, NotificationType> = {
  MEDICATION_MISSED: "MEDICATION_REMINDER",
  APPOINTMENT_TOMORROW: "APPOINTMENT_REMINDER",
  HEALTH_ALERT: "HEALTH_ALERT",
  APPOINTMENT_REVIEWED: "APPOINTMENT_REMINDER",
};

export function useCaregiverAlertWatch() {
  const { currentUser } = useAuth();
  const { select } = useSubject();
  const queryClient = useQueryClient();
  const userId = currentUser?.role === "CAREGIVER" ? currentUser.id : null;

  const selectRef = useRef(select);
  selectRef.current = select;

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeService.subscribeToInbox(userId, (row) => {
      const item = toInboxNotification(row);
      queryClient.setQueryData<InboxNotification[]>(queryKeys.inbox(userId), (prev) =>
        prev && !prev.some((n) => n.id === item.id) ? [item, ...prev] : prev
      );
      queryClient.invalidateQueries({ queryKey: ["caregiverDashboard"] });
      if (item.type === "HEALTH_ALERT" && item.elderlyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts(item.elderlyId) });
      }

      if (pushTokenService.hasPushToken()) return;
      notificationService
        .presentNow(item.title, item.body, {
          type: LOCAL_TYPE[item.type],
          elderlyId: item.elderlyId,
          inboxType: item.type,
        })
        .catch(() => undefined);
    });

    const openFromTap = (data: ReminderData | null) => {
      if (data?.inboxType) openInboxTarget(data.inboxType, data.elderlyId, selectRef.current);
    };
    openFromTap(notificationService.getLaunchReminder());
    const unsubscribeTap = notificationService.onReminderTapped(openFromTap);

    return () => {
      unsubscribe();
      unsubscribeTap();
    };
  }, [userId, queryClient]);
}
