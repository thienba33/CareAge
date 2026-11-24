import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { alertService, staffAlertsService } from "../../services";
import type { StaffAlert } from "../../types/staff";
import { useStaffAuth } from "../auth";
import { useStaffAppointments } from "./useStaffAppointments";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

// Hộp thông báo của bác sĩ: yêu cầu đặt lịch chờ duyệt + cảnh báo sức khỏe của các bệnh nhân được phân công.
export function useStaffNotifications() {
  const { isStaff, staffId } = useStaffAuth();
  const queryClient = useQueryClient();
  const schedule = useStaffAppointments();

  const alertsQuery = useQuery({
    queryKey: queryKeys.staffAlerts(staffId),
    queryFn: () => staffAlertsService.getRecentAlerts(staffId),
    enabled: isStaff,
  });
  const alerts = alertsQuery.data ?? EMPTY_ARRAY;

  const pending = useMemo(() => schedule.appointments.filter((a) => a.status === "REQUESTED"), [schedule.appointments]);
  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.readAt).length, [alerts]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await alertService.markReadForViewer(ids, staffId);
      const now = new Date().toISOString();
      queryClient.setQueryData<StaffAlert[]>(queryKeys.staffAlerts(staffId), (prev) =>
        prev?.map((a) => (ids.includes(a.id) && !a.readAt ? { ...a, readAt: now } : a))
      );
      queryClient.invalidateQueries({ queryKey: ["staffDashboard"] });
    },
    [queryClient, staffId]
  );

  const markAllRead = useCallback(
    () => markRead(alerts.filter((a) => !a.readAt).map((a) => a.id)),
    [alerts, markRead]
  );

  const reload = useCallback(() => Promise.all([alertsQuery.refetch(), schedule.reload()]), [alertsQuery.refetch, schedule.reload]);

  return {
    alerts,
    pending,
    unreadAlerts,
    // Số trên chuông: cảnh báo chưa đọc + yêu cầu chờ duyệt (việc cần bác sĩ xử lý).
    badgeCount: unreadAlerts + pending.length,
    isLoading: isStaff && (alertsQuery.isPending || schedule.isLoading),
    error: toErrorMessage(alertsQuery.error, LOAD_ERROR_MESSAGE) ?? schedule.error,
    markRead,
    markAllRead,
    reload,
  };
}
