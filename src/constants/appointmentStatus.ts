import type { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { AppointmentStatus } from "../types/appointment";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  REQUESTED: "Chờ xác nhận",
  UPCOMING: "Sắp tới",
  COMPLETED: "Đã khám",
  CANCELLED: "Đã huỷ",
  MISSED: "Đã lỡ hẹn",
  REJECTED: "Không được nhận",
};

export const APPOINTMENT_STATUS_COLOR: Record<AppointmentStatus, string> = {
  REQUESTED: colors.warning,
  UPCOMING: colors.info,
  COMPLETED: colors.success,
  CANCELLED: colors.textMuted,
  MISSED: colors.danger,
  REJECTED: colors.danger,
};

export const APPOINTMENT_STATUS_ICON: Record<AppointmentStatus, keyof typeof Ionicons.glyphMap> = {
  REQUESTED: "hourglass-outline",
  UPCOMING: "time-outline",
  COMPLETED: "checkmark-circle",
  CANCELLED: "close-circle",
  MISSED: "alert-circle",
  REJECTED: "close-circle-outline",
};

