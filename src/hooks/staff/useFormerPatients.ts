import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { staffService } from "../../services";
import { useStaffAuth } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

// Cựu bệnh nhân của bác sĩ + thao tác kết thúc theo dõi một bệnh nhân.
export function useFormerPatients() {
  const { isStaff, staffId } = useStaffAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.formerPatients(staffId),
    queryFn: () => staffService.getFormerPatients(),
    enabled: isStaff,
  });

  const endAssignment = useCallback(
    async (elderlyId: string, reason: string) => {
      await staffService.endAssignment(elderlyId, reason);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.assignedPatients(staffId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.formerPatients(staffId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staffAppointments(staffId) }),
        queryClient.invalidateQueries({ queryKey: ["staffDashboard"] }),
      ]);
    },
    [queryClient, staffId]
  );

  return {
    formerPatients: query.data ?? EMPTY_ARRAY,
    isLoading: isStaff && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    reload: query.refetch,
    endAssignment,
  };
}
