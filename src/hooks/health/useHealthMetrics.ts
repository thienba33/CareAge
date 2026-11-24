import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  alertService,
  generateDeviceValue,
  healthService,
  syncSmartwatchMetrics,
} from "../../services";
import type { HealthMetric, MetricType } from "../../types/health";
import { useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

export function useHealthMetrics() {
  const { subjectId } = useSubject();
  const queryClient = useQueryClient();
  const userId = subjectId ?? "";
  const [isSyncing, setIsSyncing] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.metrics(userId),
    queryFn: () => healthService.getMetrics(userId),
    enabled: !!subjectId,
  });

  const connectDevice = useCallback(
    async (deviceName: string, type: MetricType) => {
      if (!subjectId) return null;
      setIsSyncing(true);
      try {
        const metric = await healthService.syncFromDevice(
          subjectId,
          deviceName,
          type,
          generateDeviceValue(type)
        );
        queryClient.setQueryData<HealthMetric[]>(queryKeys.metrics(subjectId), (prev) => [
          ...(prev ?? []),
          metric,
        ]);
        // Backend đánh giá lần đo ngay khi lưu; trả về cảnh báo (nếu có) để màn hình báo cho người dùng.
        const alert = await alertService.getAlertForMetric(metric.id).catch(() => null);
        if (alert) queryClient.invalidateQueries({ queryKey: queryKeys.alerts(subjectId) });
        return alert;
      } finally {
        setIsSyncing(false);
      }
    },
    [subjectId, queryClient]
  );

  const syncSmartwatch = useCallback(async () => {
    if (!subjectId) return null;
    setIsSyncing(true);
    try {
      const result = await syncSmartwatchMetrics(subjectId);
      queryClient.setQueryData<HealthMetric[]>(queryKeys.metrics(subjectId), (prev) => [
        ...(prev ?? []),
        ...result.syncedMetrics,
      ]);
      if (result.alert) {
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts(subjectId) });
      }
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [subjectId, queryClient]);

  return {
    metrics: query.data ?? EMPTY_ARRAY,
    isLoading: !!subjectId && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    isSyncing,
    connectDevice,
    syncSmartwatch,
    reload: query.refetch,
  };
}
