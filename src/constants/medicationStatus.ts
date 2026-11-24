import { colors } from "../theme/colors";
import type { MedicationStatus } from "../types/medication";

export const MEDICATION_STATUS_LABEL: Record<MedicationStatus, string> = {
  ACTIVE: "Đang sử dụng",
  INACTIVE: "Tạm ngừng",
  COMPLETED: "Đã hoàn thành",
};

export const MEDICATION_STATUS_COLOR: Record<MedicationStatus, string> = {
  ACTIVE: colors.success,
  INACTIVE: colors.textMuted,
  COMPLETED: colors.info,
};
