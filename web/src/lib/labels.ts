// Nhãn hiển thị — khớp constants của app mobile (src/constants/*). Web deploy riêng (Vercel, root = web/)
// nên giữ bản sao nhỏ ở đây thay vì import chéo sang thư mục app.

export type Role = "ADMIN" | "ELDERLY" | "CAREGIVER" | "MEDICAL_STAFF";
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  ELDERLY: "Người cao tuổi",
  CAREGIVER: "Người thân",
  MEDICAL_STAFF: "Nhân viên y tế",
};

export type AppointmentStatus = "REQUESTED" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "MISSED" | "REJECTED";
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  REQUESTED: "Chờ xác nhận",
  UPCOMING: "Sắp tới",
  COMPLETED: "Đã khám",
  CANCELLED: "Đã huỷ",
  MISSED: "Lỡ hẹn",
  REJECTED: "Không được nhận",
};
// Màu nhãn trạng thái — khớp APPOINTMENT_STATUS_COLOR của app (chờ: vàng, sắp tới: xanh dương, đã khám: xanh lá,
// huỷ: xám, lỡ hẹn / không được nhận: đỏ). Luôn kèm icon + chữ, không chỉ dùng màu.
export const APPOINTMENT_STATUS_CLASS: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-warning-light text-warning-dark",
  UPCOMING: "bg-info-light text-info",
  COMPLETED: "bg-success-light text-success",
  CANCELLED: "bg-canvas text-muted",
  MISSED: "bg-danger-light text-danger",
  REJECTED: "bg-danger-light text-danger",
};

export type StaffDegree = "BS" | "BSCKI" | "BSCKII" | "THS" | "TS" | "DD" | "KTV";
export type AcademicTitle = "GS" | "PGS";
export const DEGREE_LABEL: Record<StaffDegree, string> = {
  BS: "Bác sĩ",
  BSCKI: "Bác sĩ chuyên khoa I",
  BSCKII: "Bác sĩ chuyên khoa II",
  THS: "Thạc sĩ",
  TS: "Tiến sĩ",
  DD: "Điều dưỡng",
  KTV: "Kỹ thuật viên",
};
export const DEGREE_SHORT: Record<StaffDegree, string> = {
  BS: "BS.",
  BSCKI: "BSCKI.",
  BSCKII: "BSCKII.",
  THS: "ThS.",
  TS: "TS.",
  DD: "ĐD.",
  KTV: "KTV.",
};
export const ACADEMIC_TITLE_LABEL: Record<AcademicTitle, string> = { GS: "Giáo sư", PGS: "Phó giáo sư" };
export const ACADEMIC_TITLE_SHORT: Record<AcademicTitle, string> = { GS: "GS.", PGS: "PGS." };

export const END_ASSIGNMENT_REASONS = [
  "Đã điều trị xong",
  "Chuyển sang bác sĩ khác",
  "Chuyển cơ sở y tế khác",
  "Bệnh nhân yêu cầu dừng theo dõi",
];

const TITLE_PREFIX = /^((gs|pgs|ts|ths|bs|bscki{1,2}|đd|dd|ktv|bác sĩ)\.?\s+)+/i;

// "PGS. TS. Nguyễn Văn A" — giống utils/staff.ts của app.
export function formatDoctorName(name: string, title?: AcademicTitle | null, degree?: StaffDegree | null): string {
  if (!title && !degree) return name.trim();
  const prefix = [title ? ACADEMIC_TITLE_SHORT[title] : null, degree ? DEGREE_SHORT[degree] : null]
    .filter(Boolean)
    .join(" ");
  return `${prefix} ${name.trim().replace(TITLE_PREFIX, "")}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ---------- Dữ liệu sức khỏe (khu bác sĩ) — khớp src/constants của app ----------

export type MetricType = "BLOOD_PRESSURE" | "HEART_RATE" | "BLOOD_GLUCOSE" | "SPO2" | "TEMPERATURE" | "WEIGHT";
export const METRIC_TYPES: MetricType[] = ["BLOOD_PRESSURE", "HEART_RATE", "BLOOD_GLUCOSE", "SPO2", "TEMPERATURE", "WEIGHT"];
export const METRIC_LABEL: Record<MetricType, string> = {
  BLOOD_PRESSURE: "Huyết áp",
  HEART_RATE: "Nhịp tim",
  BLOOD_GLUCOSE: "Đường huyết",
  SPO2: "SpO2",
  TEMPERATURE: "Nhiệt độ",
  WEIGHT: "Cân nặng",
};
export const METRIC_UNIT: Record<MetricType, string> = {
  BLOOD_PRESSURE: "mmHg",
  HEART_RATE: "bpm",
  BLOOD_GLUCOSE: "mg/dL",
  SPO2: "%",
  TEMPERATURE: "°C",
  WEIGHT: "kg",
};
export type MetricValue = number | { systolic: number; diastolic: number };
export function formatMetricValue(v: MetricValue): string {
  return typeof v === "number" ? String(v) : `${v.systolic}/${v.diastolic}`;
}

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export const ALERT_SEVERITY_LABEL: Record<AlertSeverity, string> = {
  LOW: "Lưu ý",
  MEDIUM: "Cần theo dõi",
  HIGH: "Cần chú ý",
  CRITICAL: "Nghiêm trọng",
};
// LOW → info, MEDIUM → warning, HIGH/CRITICAL → danger (skill color-theme). Luôn kèm chữ.
export const ALERT_SEVERITY_CLASS: Record<AlertSeverity, string> = {
  LOW: "bg-info-light text-info",
  MEDIUM: "bg-warning-light text-warning-dark",
  HIGH: "bg-danger-light text-danger",
  CRITICAL: "bg-danger-light text-danger",
};

export type ConditionCategory = "CHRONIC" | "HISTORY" | "ALLERGY";
export const CONDITION_CATEGORY_LABEL: Record<ConditionCategory, string> = {
  CHRONIC: "Bệnh nền",
  HISTORY: "Tiền sử bệnh",
  ALLERGY: "Dị ứng",
};
export type ConditionStatus = "ACTIVE" | "INACTIVE" | "RESOLVED";
export const CONDITION_STATUS_LABEL: Record<ConditionStatus, string> = {
  ACTIVE: "Đang theo dõi",
  INACTIVE: "Ngừng theo dõi",
  RESOLVED: "Đã khỏi",
};

export type Gender = "MALE" | "FEMALE" | "OTHER";
export const GENDER_LABEL: Record<Gender, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

export const RELATIONSHIP_LABEL: Record<string, string> = {
  CHILD: "Con",
  SPOUSE: "Vợ / Chồng",
  GRANDCHILD: "Cháu",
  RELATIVE: "Họ hàng",
  OTHER: "Khác",
};

export function ageFrom(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
  return age;
}

// Mốc thời gian (timestamptz) hiện theo giờ Việt Nam — server Vercel chạy giờ UTC.
const VN_TIME = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour12: false,
});
export function formatDateTime(iso: string): string {
  const parts = Object.fromEntries(VN_TIME.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.hour}:${parts.minute} ${parts.day}/${parts.month}/${parts.year}`;
}

// "2026-10-19" theo giờ Việt Nam (+ lệch n ngày).
export function vnDateKey(offsetDays = 0): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(Date.now() + offsetDays * 86_400_000));
}
