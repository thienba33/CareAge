import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { medicationService } from "../../services";
import type { Medication, MedicationDose } from "../../types/medication";
import { useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";
import { toDateKey } from "../../utils/date";

export function useMedications() {
  const { subjectId } = useSubject();
  const queryClient = useQueryClient();
  const userId = subjectId ?? "";
  // Ngày đổi (qua 0h) thì khóa đổi → tự tải liều của ngày mới.
  const dateKey = toDateKey(new Date());

  const medicationsQuery = useQuery({
    queryKey: queryKeys.medications(userId),
    queryFn: () => medicationService.getMedications(userId),
    enabled: !!subjectId,
  });

  const dosesQuery = useQuery({
    queryKey: queryKeys.doses(userId, dateKey),
    queryFn: () => medicationService.getTodayDoses(userId),
    enabled: !!subjectId,
  });

  const replaceDose = useCallback(
    (updated: MedicationDose) => {
      queryClient.setQueryData<MedicationDose[]>(queryKeys.doses(userId, dateKey), (prev) =>
        prev?.map((d) => (d.id === updated.id ? updated : d))
      );
    },
    [queryClient, userId, dateKey]
  );

  const markTaken = useCallback(
    async (doseId: string) => replaceDose(await medicationService.markDoseTaken(doseId)),
    [replaceDose]
  );

  const markSkipped = useCallback(
    async (doseId: string) => replaceDose(await medicationService.markDoseSkipped(doseId)),
    [replaceDose]
  );

  // Hoàn tác khi bấm nhầm: trả liều về chưa uống.
  const markPending = useCallback(
    async (doseId: string) => replaceDose(await medicationService.markDosePending(doseId)),
    [replaceDose]
  );

  const reload = useCallback(
    () => Promise.all([medicationsQuery.refetch(), dosesQuery.refetch()]),
    [medicationsQuery.refetch, dosesQuery.refetch]
  );

  return {
    medications: medicationsQuery.data ?? EMPTY_ARRAY,
    todayDoses: dosesQuery.data ?? EMPTY_ARRAY,
    isLoading: !!subjectId && (medicationsQuery.isPending || dosesQuery.isPending),
    error: toErrorMessage(medicationsQuery.error ?? dosesQuery.error, LOAD_ERROR_MESSAGE),
    markTaken,
    markSkipped,
    markPending,
    reload,
  };
}
