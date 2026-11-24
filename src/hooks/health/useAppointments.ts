import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentService } from "../../services";
import type { Appointment, AppointmentRequestInput } from "../../types/appointment";
import { useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

export function useAppointments() {
  const { subjectId } = useSubject();
  const userId = subjectId ?? "";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.appointments(userId),
    queryFn: () => appointmentService.getAppointments(userId),
    enabled: !!subjectId,
  });

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments(userId) }),
    [queryClient, userId]
  );

  // Gửi yêu cầu đặt lịch tái khám cho người đang xem (chính mình, hoặc người cao tuổi người thân đang chọn).
  const requestAppointment = useCallback(
    async (input: AppointmentRequestInput) => {
      if (!subjectId) return;
      await appointmentService.requestAppointment(subjectId, input);
      await refresh();
    },
    [subjectId, refresh]
  );

  const cancelRequest = useCallback(
    async (id: string) => {
      await appointmentService.cancelAppointmentRequest(id);
      await refresh();
    },
    [refresh]
  );

  return {
    appointments: query.data ?? EMPTY_ARRAY,
    requestAppointment,
    cancelRequest,
    isLoading: !!subjectId && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    reload: query.refetch,
  };
}
