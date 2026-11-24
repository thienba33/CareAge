import { useQuery } from "@tanstack/react-query";
import { alertService } from "../../services";
import type { MetricType } from "../../types/health";
import { useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { queryKeys } from "../../constants/queryKeys";

// Ngưỡng theo dõi đang áp dụng — chỉ dùng để vẽ khoảng tham chiếu, lỗi thì biểu đồ vẫn hiện (không có đường tham chiếu).
export function useAlertThresholds(type: MetricType) {
  const { subjectId } = useSubject();
  const userId = subjectId ?? "";

  const query = useQuery({
    queryKey: queryKeys.alertThresholds(userId, type),
    queryFn: () => alertService.getApplicableThresholds(userId, type),
    enabled: !!subjectId,
  });

  return {
    thresholds: query.data ?? EMPTY_ARRAY,
    reload: query.refetch,
  };
}
