import { useQuery } from "@tanstack/react-query";
import { caregiverService } from "../../services";
import { useAuth } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";
import { toDateKey } from "../../utils/date";

export function useCaregiverDashboard() {
  const { currentUser } = useAuth();
  const isCaregiver = currentUser?.role === "CAREGIVER";
  const dateKey = toDateKey(new Date());

  const query = useQuery({
    queryKey: queryKeys.caregiverDashboard(currentUser?.id ?? "", dateKey),
    queryFn: () => caregiverService.getDashboard(dateKey),
    enabled: isCaregiver,
  });

  return {
    items: query.data ?? EMPTY_ARRAY,
    isLoading: isCaregiver && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    reload: query.refetch,
  };
}
