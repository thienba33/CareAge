import { useAuth } from "./useAuth";

export function useStaffAuth() {
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role === "MEDICAL_STAFF";
  const staffId = currentUser?.id ?? "";

  return { currentUser, isStaff, staffId };
}
