import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { healthProfileService } from "../../services";
import type { HealthProfile } from "../../types/healthProfile";
import { useSubject } from "../auth";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

export function useHealthProfile() {
  const { subjectId } = useSubject();
  const queryClient = useQueryClient();
  const userId = subjectId ?? "";

  const query = useQuery({
    queryKey: queryKeys.healthProfile(userId),
    queryFn: () => healthProfileService.getHealthProfile(userId),
    enabled: !!subjectId,
  });

  const updateProfile = useCallback(
    async (input: Omit<HealthProfile, "userId">) => {
      if (!subjectId) return;
      const updated = await healthProfileService.updateHealthProfile(subjectId, input);
      queryClient.setQueryData(queryKeys.healthProfile(subjectId), updated);
    },
    [subjectId, queryClient]
  );

  return {
    profile: query.data ?? null,
    isLoading: !!subjectId && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    updateProfile,
    reload: query.refetch,
  };
}
