import { useQuery } from "@tanstack/react-query";
import { staffService } from "../../services";
import type { StaffDashboardItem } from "../../types/staff";
import { useStaffAuth } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";
import { toDateKey } from "../../utils/date";

// Tổng quan bệnh nhân được phân công — dùng chung cho Trang chủ và tab Bệnh nhân của bác sĩ.
export function useStaffDashboard() {
  const { isStaff, staffId } = useStaffAuth();
  const dateKey = toDateKey(new Date());

  const query = useQuery({
    queryKey: queryKeys.staffDashboard(staffId, dateKey),
    queryFn: () => staffService.getDashboard(dateKey),
    enabled: isStaff,
  });

  return {
    items: query.data ?? EMPTY_ARRAY,
    isLoading: isStaff && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    reload: query.refetch,
  };
}
