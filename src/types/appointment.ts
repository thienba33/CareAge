import type { AcademicTitle, StaffDegree } from "./staff";

// REQUESTED: người cao tuổi / người thân gửi yêu cầu, chờ nhân viên y tế xác nhận (→ UPCOMING) hoặc từ chối (→ REJECTED).
export type AppointmentStatus = "REQUESTED" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "MISSED" | "REJECTED";

export type Appointment = {
  id: string;
  userId: string;
  date: string; // ISO date, ví dụ "2026-10-05"
  time: string; // "HH:mm"
  facility: string; // cơ sở y tế / bệnh viện
  facilityPhone?: string; // số hotline của cơ sở y tế, dùng cho nút gọi khẩn cấp
  doctor?: string;
  reason?: string; // nội dung khám
  status: AppointmentStatus;
  note?: string; // ghi chú của người gửi yêu cầu
  rejectReason?: string; // lý do nhân viên y tế từ chối
  staffNote?: string; // lời dặn của bác sĩ khi xác nhận lịch
};

// Cơ sở y tế và tên bác sĩ do Backend lấy từ hồ sơ bác sĩ phụ trách được chọn.
export type AppointmentRequestInput = {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  staffId: string;
  reason?: string;
  note?: string;
};

// Bác sĩ đang phụ trách người cao tuổi (staff_assignments ACTIVE).
export type AssignedDoctor = {
  id: string;
  name: string;
  phone?: string;
  workplace?: string; // chưa cập nhật → không chọn được để đặt lịch
  workplacePhone?: string;
  academicTitle?: AcademicTitle;
  degree?: StaffDegree;
  specialty?: string;
  room?: string;
};
