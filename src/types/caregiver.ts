export type CaregiverRelationship = "CHILD" | "SPOUSE" | "GRANDCHILD" | "RELATIVE" | "OTHER";

// Một người cao tuổi mà người thân đang theo dõi (liên kết ACTIVE).
export type LinkedElderly = {
  linkId: string;
  id: string;
  code: string;
  name: string;
  phone?: string;
  relationship: CaregiverRelationship;
};

// Người cao tuổi mà người đăng nhập đang theo dõi: người thân (liên kết, có quan hệ) hoặc bác sĩ (phân công).
export type FollowedElderly = {
  id: string;
  code: string;
  name: string;
  phone?: string;
  // Chỉ có với người thân.
  linkId?: string;
  relationship?: CaregiverRelationship;
};

// Một người thân đang theo dõi người cao tuổi (phía người cao tuổi xem).
export type LinkedCaregiver = {
  linkId: string;
  id: string;
  name: string;
  phone?: string;
  relationship: CaregiverRelationship;
};

// Một dòng tổng quan trên Trang chủ người thân (Backend tổng hợp bằng RPC caregiver_dashboard).
export type DashboardDose = { time: string; status: "PENDING" | "TAKEN" | "SKIPPED" | "MISSED"; medication: string };

export type CaregiverDashboardItem = {
  elderlyId: string;
  name: string;
  phone?: string;
  relationship: CaregiverRelationship;
  dateOfBirth?: string;
  doses: DashboardDose[];
  latestBp?: { systolic: number; diastolic: number; recordedAt: string };
  latestHr?: { value: number; recordedAt: string };
  latestSpo2?: { value: number; recordedAt: string };
  unreadAlerts: number;
  latestAlert?: { severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; title: string };
  nextAppointment?: { date: string; time: string; facility: string; doctor?: string };
};
