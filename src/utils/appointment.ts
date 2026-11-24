import type { Appointment } from "../types/appointment";
import { fromDateKey } from "./date";

// Thời điểm khám (giờ local) của một lịch.
export function appointmentDateTime(appointment: Appointment): Date {
  const date = fromDateKey(appointment.date);
  const [h, m] = appointment.time.split(":").map(Number);
  date.setHours(h, m, 0, 0);
  return date;
}

// Tách lịch: chờ xác nhận (REQUESTED, chưa qua giờ), sắp tới (UPCOMING, chưa qua giờ) — gần nhất trước;
// còn lại (đã khám, đã hủy, bị từ chối, yêu cầu đã quá giờ...) vào "đã qua" — mới nhất trước.
export function splitAppointments(
  appointments: Appointment[],
  now: Date = new Date()
): { pending: Appointment[]; upcoming: Appointment[]; past: Appointment[] } {
  const time = (a: Appointment) => appointmentDateTime(a).getTime();
  const isFuture = (a: Appointment) => time(a) >= now.getTime();
  const isPending = (a: Appointment) => a.status === "REQUESTED" && isFuture(a);
  const isUpcoming = (a: Appointment) => a.status === "UPCOMING" && isFuture(a);

  return {
    pending: appointments.filter(isPending).sort((a, b) => time(a) - time(b)),
    upcoming: appointments.filter(isUpcoming).sort((a, b) => time(a) - time(b)),
    past: appointments.filter((a) => !isPending(a) && !isUpcoming(a)).sort((a, b) => time(b) - time(a)),
  };
}

// Các ngày có thể chọn khi đặt lịch: từ hôm nay đến `daysAhead` ngày tới.
export function requestDateOptions(daysAhead: number, now: Date = new Date()): Date[] {
  return Array.from({ length: daysAhead + 1 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
}


export function countdownText(days: number): string {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Ngày mai";
  return `${days} ngày nữa`;
}

export function directionsUrl(facility: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility)}`;
}
