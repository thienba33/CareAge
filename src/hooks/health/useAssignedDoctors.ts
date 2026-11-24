import { useQuery } from "@tanstack/react-query";
import { appointmentService } from "../../services";
import { useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

// Bác sĩ phụ trách người đang xem — dùng cho form đặt lịch (cơ sở y tế đi theo nơi làm việc của bác sĩ).
export function useAssignedDoctors(enabled = true) {
  const { subjectId } = useSubject();
  const userId = subjectId ?? "";

  const query = useQuery({
    queryKey: queryKeys.assignedDoctors(userId),
    queryFn: () => appointmentService.getAssignedDoctors(userId),
    enabled: enabled && !!subjectId,
  });

  return {
    doctors: query.data ?? EMPTY_ARRAY,
    isLoading: !!subjectId && enabled && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    reload: query.refetch,
  };
}
