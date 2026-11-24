import type { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { DoseStatus } from "../types/medication";

// Quy ước màu trạng thái liều thuốc (theo yêu cầu nghiệp vụ):
// - Xanh lá: đã uống.
// - Vàng: trong ngày, chưa uống (còn trong hạn).
// - Đỏ: quá giờ uống hơn 5 phút mà chưa uống.
export const DOSE_STATUS_LABEL: Record<DoseStatus, string> = {
  PENDING: "Chưa uống",
  TAKEN: "Đã uống",
  SKIPPED: "Đã bỏ qua",
  MISSED: "Quá giờ uống",
};

export const DOSE_STATUS_COLOR: Record<DoseStatus, string> = {
  PENDING: colors.warning,
  TAKEN: colors.success,
  SKIPPED: colors.textMuted,
  MISSED: colors.danger,
};

export const DOSE_STATUS_ICON: Record<DoseStatus, keyof typeof Ionicons.glyphMap> = {
  PENDING: "time-outline",
  TAKEN: "checkmark-circle",
  SKIPPED: "remove-circle",
  MISSED: "alert-circle",
};
