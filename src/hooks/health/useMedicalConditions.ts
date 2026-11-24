import { createListCacheUpdater } from "../common";
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { conditionService, type ConditionInput } from "../../services";
import type { MedicalCondition } from "../../types/medicalCondition";
import { useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

export function useMedicalConditions() {
  const { subjectId } = useSubject();
  const queryClient = useQueryClient();
  const userId = subjectId ?? "";

  const query = useQuery({
    queryKey: queryKeys.medicalConditions(userId),
    queryFn: () => conditionService.getConditions(userId),
    enabled: !!subjectId,
  });

  const cache = useMemo(
    () => createListCacheUpdater<MedicalCondition>(queryClient, queryKeys.medicalConditions(userId)),
    [queryClient, userId]
  );

  const addCondition = useCallback(
    async (input: ConditionInput) => {
      if (!subjectId) return;
      const condition = await conditionService.addCondition(subjectId, input);
      cache.add(condition);
    },
    [subjectId, cache]
  );

  const updateCondition = useCallback(
    async (id: string, input: ConditionInput) => {
      const updated = await conditionService.updateCondition(id, input);
      cache.update(id, updated);
    },
    [cache]
  );

  const deleteCondition = useCallback(
    async (id: string) => {
      await conditionService.deleteCondition(id);
      cache.remove(id);
    },
    [cache]
  );

  return {
    conditions: query.data ?? EMPTY_ARRAY,
    isLoading: !!subjectId && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    addCondition,
    updateCondition,
    deleteCondition,
    reload: query.refetch,
  };
}
