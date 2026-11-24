import type { AlertSeverity, HealthAlert } from "./alert";
import type { Appointment } from "./appointment";

// Một người cao tuổi được phân công cho nhân viên y tế (staff_assignments ACTIVE).
export type AssignedPatient = {
  id: string;
  code: string;
  name: string;
  phone?: string;
};

// Một dòng tổng quan cho bác sĩ (Backend tổng hợp bằng RPC staff_dashboard).
export type StaffDashboardItem = {
  elderlyId: string;
  name: string;
  code: string;
  phone?: string;
  dateOfBirth?: string;
  unreadAlerts: number;
  latestAlert?: { severity: AlertSeverity; title: string };
  // Yêu cầu chờ duyệt gửi tới bác sĩ này (hoặc chưa gắn bác sĩ).
  pendingRequests: number;
  todayAppointments: number;
  nextAppointment?: { date: string; time: string; reason?: string };
};

// Cựu bệnh nhân: bác sĩ đã kết thúc theo dõi (không còn xem dữ liệu sức khỏe).
export type FormerPatient = {
  elderlyId: string;
  name: string;
  code: string;
  endedAt?: string;
  endReason?: string;
};

// Cảnh báo sức khỏe của một bệnh nhân được phân công, kèm tên — hộp thông báo của bác sĩ.
export type StaffAlert = HealthAlert & {
  patientName: string;
};

// Lịch khám kèm tên bệnh nhân — danh sách duyệt yêu cầu / lịch sắp tới của bác sĩ.
export type StaffAppointment = Appointment & {
  patientName: string;
  patientCode: string;
};

export type AcademicTitle = "GS" | "PGS";
export type StaffDegree = "BS" | "BSCKI" | "BSCKII" | "THS" | "TS" | "DD" | "KTV";

// Hồ sơ chuyên môn của nhân viên y tế (bảng staff_profiles) + nơi làm việc (profiles.workplace*).
export type StaffProfile = {
  academicTitle?: AcademicTitle;
  degree?: StaffDegree;
  specialty?: string;
  department?: string;
  room?: string;
  licenseNumber?: string;
  yearsExperience?: number;
  workingHours?: string;
  bio?: string;
  workplace?: string;
  workplacePhone?: string;
};
