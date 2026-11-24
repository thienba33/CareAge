import { ACADEMIC_TITLE_SHORT, DEGREE_SHORT } from "../constants/staff";
import type { AcademicTitle, StaffDegree } from "../types/staff";

// Bỏ danh xưng đã gõ sẵn trong tên ("BS. Phạm Thị Hoa" → "Phạm Thị Hoa").
const TITLE_PREFIX = /^((gs|pgs|ts|ths|bs|bscki{1,2}|đd|dd|ktv|bác sĩ)\.?\s+)+/i;

export function stripTitle(name: string): string {
  return name.trim().replace(TITLE_PREFIX, "");
}

// Tên kèm học hàm, học vị: "PGS. TS. Nguyễn Văn A". Chưa khai học vị → giữ nguyên tên.
export function formatDoctorName(name: string, academicTitle?: AcademicTitle, degree?: StaffDegree): string {
  if (!academicTitle && !degree) return name.trim();
  const prefix = [academicTitle ? ACADEMIC_TITLE_SHORT[academicTitle] : null, degree ? DEGREE_SHORT[degree] : null]
    .filter(Boolean)
    .join(" ");
  return `${prefix} ${stripTitle(name)}`;
}
