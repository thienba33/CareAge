export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Tuần bắt đầu từ Thứ Hai (chuẩn VN), trả về 00:00 của Thứ Hai chứa `date`.
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Chủ nhật
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// "YYYY-MM-DD" theo giờ local, dùng để so sánh với startDate/endDate (ISO date) của thuốc.
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Postgres trả kiểu time dạng "08:00:00" — Mobile dùng "HH:mm".
export function toHourMinute(time: string): string {
  return time.slice(0, 5);
}

export const WEEKDAY_LONG = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

// "YYYY-MM-DD" → Date lúc 00:00 giờ local (new Date("YYYY-MM-DD") sẽ hiểu là UTC).
export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "Thứ Hai, 5/10/2026"
export function formatLongDate(date: Date): string {
  return `${WEEKDAY_LONG[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// "08:30 · 5/10/2026"
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// Số ngày từ hôm nay đến `date` (0 = hôm nay), tính theo ngày lịch local.
export function daysFromToday(date: Date, now: Date = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86_400_000);
}

const WEEKDAY_SHORT_FROM_SUNDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// "T2, 5/10"
export function formatShortDate(date: Date): string {
  return `${WEEKDAY_SHORT_FROM_SUNDAY[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`;
}

// "Hôm nay" / "Hôm qua" / "3 ngày trước" — tính theo ngày lịch local.
export function relativeDayText(date: Date, now: Date = new Date()): string {
  const days = -daysFromToday(date, now);
  if (days <= 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

export type DaySection<T> = { title: string; data: T[] };

// Chia danh sách (mới nhất trước) thành nhóm "Hôm nay" / "Hôm qua" / "Trước đó" cho màn Thông báo, Cảnh báo.
export function groupByDay<T>(items: T[], getIso: (item: T) => string, now: Date = new Date()): DaySection<T>[] {
  const groups: Record<string, T[]> = { "Hôm nay": [], "Hôm qua": [], "Trước đó": [] };
  for (const item of items) {
    const days = -daysFromToday(new Date(getIso(item)), now);
    groups[days <= 0 ? "Hôm nay" : days === 1 ? "Hôm qua" : "Trước đó"].push(item);
  }
  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

// Giờ hiển thị trong danh sách: hôm nay / hôm qua chỉ cần "08:15", cũ hơn thì kèm ngày "08:15 · 3/10/2026".
export function formatFeedTime(iso: string, now: Date = new Date()): string {
  if (-daysFromToday(new Date(iso), now) > 1) return formatDateTime(iso);
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
