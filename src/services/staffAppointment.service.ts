import { supabase } from "../config/supabase";
import type { StaffAppointment } from "../types/staff";
import { APPOINTMENT_COLUMNS, toAppointment, type AppointmentRow } from "./appointment.service";
import { toAppError } from "./supabaseError";

type StaffAppointmentRow = AppointmentRow & {
  patient: { name: string; code: string } | null;
};

// Yêu cầu chờ duyệt + lịch đã xác nhận từ hôm nay, của các bệnh nhân được phân công (RLS lọc),
// chỉ những lịch gửi tới bác sĩ này hoặc chưa gắn bác sĩ.
export async function getStaffAppointments(staffId: string, fromDateKey: string): Promise<StaffAppointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(`${APPOINTMENT_COLUMNS}, patient:profiles!appointments_user_id_fkey(name, code)`)
    .in("status", ["REQUESTED", "UPCOMING"])
    .gte("appointment_date", fromDateKey)
    .or(`staff_id.is.null,staff_id.eq.${staffId}`)
    .order("appointment_date")
    .order("appointment_time")
    .returns<StaffAppointmentRow[]>();

  if (error) throw toAppError(error);
  return data.map((row) => ({
    ...toAppointment(row),
    patientName: row.patient?.name ?? "",
    patientCode: row.patient?.code ?? "",
  }));
}

// Xác nhận (→ UPCOMING, kèm lời dặn) hoặc từ chối (→ REJECTED, kèm lý do). Backend kiểm tra bác sĩ được gửi yêu cầu.
export async function reviewAppointmentRequest(
  id: string,
  approve: boolean,
  options: { reason?: string; note?: string } = {}
): Promise<void> {
  const { error } = await supabase.rpc("review_appointment_request", {
    p_id: id,
    p_approve: approve,
    p_reason: options.reason ?? null,
    p_note: options.note ?? null,
  });
  if (error) throw toAppError(error);
}
