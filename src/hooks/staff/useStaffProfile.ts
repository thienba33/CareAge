import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { staffProfileService } from "../../services";
import type { StaffProfile } from "../../types/staff";
import { useStaffAuth } from "../auth";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

// Hồ sơ chuyên môn của bác sĩ đang đăng nhập.
export function useStaffProfile() {
  const { isStaff, staffId } = useStaffAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.staffProfile(staffId),
    queryFn: () => staffProfileService.getStaffProfile(staffId),
    enabled: isStaff,
  });

  const save = useCallback(
    async (input: StaffProfile) => {
      await staffProfileService.saveStaffProfile(staffId, input);
      queryClient.setQueryData(queryKeys.staffProfile(staffId), input);
    },
    [queryClient, staffId]
  );

  return {
    profile: query.data ?? null,
    isLoading: isStaff && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    reload: query.refetch,
    save,
  };
}
