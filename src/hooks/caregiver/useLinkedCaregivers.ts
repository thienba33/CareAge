import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { caregiverService } from "../../services";
import type { LinkedCaregiver } from "../../types/caregiver";
import { useAuth } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

// Phía người cao tuổi: những người thân đang theo dõi mình.
export function useLinkedCaregivers() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isElderly = currentUser?.role === "ELDERLY";
  const key = queryKeys.linkedCaregivers(currentUser?.id ?? "");

  const query = useQuery({
    queryKey: key,
    queryFn: () => caregiverService.getLinkedCaregivers(currentUser!.id),
    enabled: isElderly,
  });

  const revoke = useCallback(
    async (linkId: string) => {
      await caregiverService.revokeLink(linkId);
      queryClient.setQueryData<LinkedCaregiver[]>(key, (prev) => prev?.filter((c) => c.linkId !== linkId));
    },
    [queryClient, currentUser?.id]
  );

  return {
    caregivers: query.data ?? EMPTY_ARRAY,
    isLoading: isElderly && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    revoke,
    reload: query.refetch,
  };
}
