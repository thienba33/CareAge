import type { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { InboxType } from "../types/inbox";

export const INBOX_ICON: Record<InboxType, keyof typeof Ionicons.glyphMap> = {
  MEDICATION_MISSED: "medkit",
  APPOINTMENT_TOMORROW: "calendar",
  HEALTH_ALERT: "warning",
  APPOINTMENT_REVIEWED: "calendar-number",
};

export const INBOX_COLOR: Record<InboxType, string> = {
  MEDICATION_MISSED: colors.warning,
  APPOINTMENT_TOMORROW: colors.info,
  HEALTH_ALERT: colors.danger,
  APPOINTMENT_REVIEWED: colors.info,
};

export const INBOX_BACKGROUND: Record<InboxType, string> = {
  MEDICATION_MISSED: colors.warningLight,
  APPOINTMENT_TOMORROW: colors.infoLight,
  HEALTH_ALERT: colors.dangerLight,
  APPOINTMENT_REVIEWED: colors.infoLight,
};
