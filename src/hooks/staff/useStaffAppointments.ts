import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { staffAppointmentService } from "../../services";
import type { StaffAppointment } from "../../types/staff";
import { useStaffAuth } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";
import { toDateKey } from "../../utils/date";

// Lịch khám của bác sĩ: yêu cầu chờ duyệt + lịch đã xác nhận từ hôm nay.
export function useStaffAppointments() {
  const { isStaff, staffId } = useStaffAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.staffAppointments(staffId),
    queryFn: () => staffAppointmentService.getStaffAppointments(staffId, toDateKey(new Date())),
    enabled: isStaff,
  });

  const review = useCallback(
    async (appointment: StaffAppointment, approve: boolean, options: { reason?: string; note?: string } = {}) => {
      await staffAppointmentService.reviewAppointmentRequest(appointment.id, approve, options);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffAppointments(staffId) }),
        queryClient.invalidateQueries({ queryKey: ["staffDashboard"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments(appointment.userId) }),
      ]);
    },
    [queryClient, staffId]
  );

  return {
    appointments: query.data ?? EMPTY_ARRAY,
    isLoading: isStaff && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    reload: query.refetch,
    // note: lời dặn gửi cho bệnh nhân / người nhà (không bắt buộc).
    approve: (a: StaffAppointment, note?: string) => review(a, true, { note }),
    reject: (a: StaffAppointment, reason?: string) => review(a, false, { reason }),
  };
}
