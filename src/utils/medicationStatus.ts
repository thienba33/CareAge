import type { DoseStatus, MedicationDose } from "../types/medication";

const MISSED_THRESHOLD_MINUTES = 5;

function scheduledTimeToday(time: string, now: Date): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

// PENDING quá giờ hẹn hơn 5 phút mà chưa uống thì hiển thị là "quá giờ" (đỏ),
// dù trạng thái lưu trong hệ thống vẫn là PENDING (người dùng vẫn có thể đánh dấu đã uống trễ).
export function getEffectiveDoseStatus(
  dose: Pick<MedicationDose, "status" | "scheduledTime">,
  now: Date = new Date()
): DoseStatus {
  if (dose.status !== "PENDING") return dose.status;

  const minutesPastDue = (now.getTime() - scheduledTimeToday(dose.scheduledTime, now).getTime()) / 60000;
  return minutesPastDue > MISSED_THRESHOLD_MINUTES ? "MISSED" : "PENDING";
}
