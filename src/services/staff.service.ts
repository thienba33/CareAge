import { supabase } from "../config/supabase";
import type { AlertSeverity } from "../types/alert";
import type {
  AssignedPatient,
  FormerPatient,
  StaffDashboardItem,
} from "../types/staff";
import { toAppError } from "./supabaseError";

// Re-export các service chuyên biệt để đảm bảo tính tương thích
export * from "./staffAppointment.service";
export * from "./staffProfile.service";
export * from "./staffAlerts.service";

// Phần cho nhân viên y tế. Quyền do Backend quyết định: RLS (staff_assignments ACTIVE) và các RPC staff_*.

type PatientRow = {
  elderly: { id: string; code: string; name: string; phone: string | null } | null;
};

export async function getAssignedPatients(staffId: string): Promise<AssignedPatient[]> {
  const { data, error } = await supabase
    .from("staff_assignments")
    .select("elderly:profiles!staff_assignments_elderly_id_fkey(id, code, name, phone)")
    .eq("staff_id", staffId)
    .eq("status", "ACTIVE")
    .order("assigned_at")
    .returns<PatientRow[]>();

  if (error) throw toAppError(error);
  return data
    .filter((row) => row.elderly)
    .map((row) => ({
      id: row.elderly!.id,
      code: row.elderly!.code,
      name: row.elderly!.name,
      phone: row.elderly!.phone ?? undefined,
    }));
}

type DashboardRow = {
  elderly_id: string;
  name: string;
  code: string;
  phone: string | null;
  date_of_birth: string | null;
  unread_alerts: number;
  latest_alert_severity: AlertSeverity | null;
  latest_alert_title: string | null;
  pending_requests: number;
  today_appointments: number;
  next_appointment: { date: string; time: string; reason: string | null } | null;
};

export async function getDashboard(dateKey: string): Promise<StaffDashboardItem[]> {
  const { data, error } = await supabase.rpc("staff_dashboard", { p_date: dateKey });
  if (error) throw toAppError(error);

  return ((data ?? []) as DashboardRow[]).map((row) => ({
    elderlyId: row.elderly_id,
    name: row.name,
    code: row.code,
    phone: row.phone ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    unreadAlerts: row.unread_alerts,
    latestAlert:
      row.latest_alert_severity && row.latest_alert_title
        ? { severity: row.latest_alert_severity, title: row.latest_alert_title }
        : undefined,
    pendingRequests: row.pending_requests,
    todayAppointments: row.today_appointments,
    nextAppointment: row.next_appointment
      ? { ...row.next_appointment, reason: row.next_appointment.reason ?? undefined }
      : undefined,
  }));
}

const END_ASSIGNMENT_ERRORS: Record<string, string> = {
  CA006: "Vui lòng chọn hoặc nhập lý do kết thúc theo dõi.",
  P0002: "Bạn không còn phụ trách bệnh nhân này.",
};

// Kết thúc theo dõi bệnh nhân (→ cựu bệnh nhân). Backend từ chối các yêu cầu đặt lịch đang chờ gửi tới bác sĩ này.
export async function endAssignment(elderlyId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("end_staff_assignment", { p_elderly_id: elderlyId, p_reason: reason });
  if (error) {
    const message = error.code ? END_ASSIGNMENT_ERRORS[error.code] : undefined;
    throw message ? new Error(message) : toAppError(error);
  }
}

type FormerPatientRow = {
  elderly_id: string;
  name: string;
  code: string;
  ended_at: string | null;
  end_reason: string | null;
};

export async function getFormerPatients(): Promise<FormerPatient[]> {
  const { data, error } = await supabase.rpc("get_former_patients");
  if (error) throw toAppError(error);
  return ((data ?? []) as FormerPatientRow[]).map((row) => ({
    elderlyId: row.elderly_id,
    name: row.name,
    code: row.code,
    endedAt: row.ended_at ?? undefined,
    endReason: row.end_reason ?? undefined,
  }));
}
