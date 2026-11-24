import { AlertCircle, CheckCircle2, Clock, Hourglass, XCircle, type LucideIcon } from "lucide-react";
import type { AppointmentStatus } from "./labels";

// Icon trạng thái lịch khám — tương ứng APPOINTMENT_STATUS_ICON của app.
export const APPOINTMENT_STATUS_ICON: Record<AppointmentStatus, LucideIcon> = {
  REQUESTED: Hourglass,
  UPCOMING: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  MISSED: AlertCircle,
  REJECTED: XCircle,
};
