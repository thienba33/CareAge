import type { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { AlertSeverity } from "../types/alert";

// Theo skill color-theme: LOW → info, MEDIUM → warning, HIGH/CRITICAL → danger.
// Luôn kèm icon + chữ, không chỉ dùng màu.
export const ALERT_SEVERITY_LABEL: Record<AlertSeverity, string> = {
  LOW: "Lưu ý",
  MEDIUM: "Cần theo dõi",
  HIGH: "Cần chú ý",
  CRITICAL: "Nghiêm trọng",
};

export const ALERT_SEVERITY_COLOR: Record<AlertSeverity, string> = {
  LOW: colors.info,
  MEDIUM: colors.warning,
  HIGH: colors.danger,
  CRITICAL: colors.danger,
};

export const ALERT_SEVERITY_BACKGROUND: Record<AlertSeverity, string> = {
  LOW: colors.infoLight,
  MEDIUM: colors.warningLight,
  HIGH: colors.dangerLight,
  CRITICAL: colors.dangerLight,
};

export const ALERT_SEVERITY_ICON: Record<AlertSeverity, keyof typeof Ionicons.glyphMap> = {
  LOW: "information-circle",
  MEDIUM: "alert-circle",
  HIGH: "warning",
  CRITICAL: "warning",
};

// Mức cần báo ngay bằng thông báo trên máy.
export const URGENT_SEVERITIES: AlertSeverity[] = ["HIGH", "CRITICAL"];
