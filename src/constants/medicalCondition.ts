import { colors } from "../theme/colors";
import type { ConditionCategory, ConditionStatus } from "../types/medicalCondition";

export const CONDITION_CATEGORY_LABEL: Record<ConditionCategory, string> = {
  CHRONIC: "Bệnh nền",
  HISTORY: "Tiền sử bệnh",
  ALLERGY: "Dị ứng",
};

export const CONDITION_CATEGORIES: ConditionCategory[] = ["CHRONIC", "HISTORY", "ALLERGY"];

export const CONDITION_STATUS_LABEL: Record<ConditionStatus, string> = {
  ACTIVE: "Đang theo dõi",
  INACTIVE: "Ngừng theo dõi",
  RESOLVED: "Đã khỏi",
};

export const CONDITION_STATUS_COLOR: Record<ConditionStatus, string> = {
  ACTIVE: colors.warning,
  INACTIVE: colors.textMuted,
  RESOLVED: colors.success,
};

export const CONDITION_STATUSES: ConditionStatus[] = ["ACTIVE", "INACTIVE", "RESOLVED"];
