import type { AcademicTitle, StaffDegree } from "../types/staff";

// Lý do kết thúc theo dõi bệnh nhân thường gặp (bác sĩ chọn nhanh, có thể tự nhập).
export const END_ASSIGNMENT_REASONS = [
  "Đã điều trị xong",
  "Chuyển sang bác sĩ khác",
  "Chuyển cơ sở y tế khác",
  "Bệnh nhân yêu cầu dừng theo dõi",
];

export const ACADEMIC_TITLES: AcademicTitle[] = ["GS", "PGS"];
export const ACADEMIC_TITLE_LABEL: Record<AcademicTitle, string> = { GS: "Giáo sư", PGS: "Phó giáo sư" };
// Viết tắt đặt trước tên, vd. "PGS. TS. Nguyễn Văn A".
export const ACADEMIC_TITLE_SHORT: Record<AcademicTitle, string> = { GS: "GS.", PGS: "PGS." };

export const STAFF_DEGREES: StaffDegree[] = ["BS", "BSCKI", "BSCKII", "THS", "TS", "DD", "KTV"];
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

export const SPECIALTY_SUGGESTIONS = ["Nội tổng quát", "Tim mạch", "Nội tiết", "Lão khoa", "Thần kinh", "Cơ xương khớp", "Hô hấp"];
