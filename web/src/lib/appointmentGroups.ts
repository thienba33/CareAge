import type { AppointmentRow } from "./data";
import { formatDate, vnDateKey } from "./labels";

const WEEKDAY = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export type DayGroup = { key: string; label: string | null; date: string; items: AppointmentRow[] };

// Nhóm lịch khám theo ngày cho cây lịch khám: nhãn gần ("Hôm nay" / "Ngày mai") + "Thứ Tư, 08/10/2026".
// Ngày tính theo giờ Việt Nam (server chạy UTC).
export function groupByDay(appointments: AppointmentRow[]): DayGroup[] {
  const today = vnDateKey();
  const tomorrow = vnDateKey(1);
  const byDay = new Map<string, AppointmentRow[]>();
  for (const a of appointments) {
    const g = byDay.get(a.date);
    if (g) g.push(a);
    else byDay.set(a.date, [a]);
  }
  return Array.from(byDay, ([key, items]) => ({
    key,
    label: key === today ? "Hôm nay" : key === tomorrow ? "Ngày mai" : null,
    date: `${WEEKDAY[new Date(`${key}T00:00:00Z`).getUTCDay()]}, ${formatDate(key)}`,
    items,
  }));
}
