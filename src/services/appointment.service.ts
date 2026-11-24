import { supabase } from "../config/supabase";
import type { Appointment, AppointmentRequestInput, AppointmentStatus, AssignedDoctor } from "../types/appointment";
import { APPOINTMENT_REQUEST_ERRORS } from "../constants/appointmentRequest";
import { toHourMinute } from "../utils/date";
import { toAppError } from "./supabaseError";

// Lịch khám do nhân viên y tế tạo ở Backend. Người cao tuổi / người thân chỉ gửi yêu cầu đặt lịch qua RPC
// (Backend kiểm tra quyền, nhân viên y tế xác nhận) — không ghi trực tiếp vào bảng.

export const APPOINTMENT_COLUMNS =
  "id, user_id, appointment_date, appointment_time, facility, facility_phone, doctor, reason, status, note, reject_reason, staff_note";

export type AppointmentRow = {
  id: string;
  user_id: string;
  appointment_date: string;
  appointment_time: string;
  facility: string;
  facility_phone: string | null;
  doctor: string | null;
  reason: string | null;
  status: AppointmentStatus;
  note: string | null;
  reject_reason: string | null;
  staff_note: string | null;
};

export const toAppointment = (row: AppointmentRow): Appointment => ({
  id: row.id,
  userId: row.user_id,
  date: row.appointment_date,
  time: toHourMinute(row.appointment_time),
  facility: row.facility,
  facilityPhone: row.facility_phone ?? undefined,
  doctor: row.doctor ?? undefined,
  reason: row.reason ?? undefined,
  status: row.status,
  note: row.note ?? undefined,
  rejectReason: row.reject_reason ?? undefined,
  staffNote: row.staff_note ?? undefined,
});

export async function getAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .eq("user_id", userId)
    .order("appointment_date")
    .order("appointment_time")
    .returns<AppointmentRow[]>();

  if (error) throw toAppError(error);
  return data.map(toAppointment);
}

function toRequestError(error: { code?: string }): Error {
  const message = error.code ? APPOINTMENT_REQUEST_ERRORS[error.code] : undefined;
  return message ? new Error(message) : toAppError(error);
}

export async function requestAppointment(elderlyId: string, input: AppointmentRequestInput): Promise<void> {
  const { error } = await supabase.rpc("request_appointment", {
    p_elderly_id: elderlyId,
    p_date: input.date,
    p_time: input.time,
    p_staff_id: input.staffId,
    p_reason: input.reason ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw toRequestError(error);
}

type AssignedDoctorRow = {
  id: string;
  name: string;
  phone: string | null;
  workplace: string | null;
  workplace_phone: string | null;
  academic_title: AssignedDoctor["academicTitle"] | null;
  degree: AssignedDoctor["degree"] | null;
  specialty: string | null;
  room: string | null;
};

// Bác sĩ đang phụ trách người cao tuổi — Backend kiểm tra quyền (chính người đó, người thân, ADMIN).
export async function getAssignedDoctors(elderlyId: string): Promise<AssignedDoctor[]> {
  const { data, error } = await supabase.rpc("get_assigned_doctors", { p_elderly_id: elderlyId });
  if (error) throw toAppError(error);
  return ((data ?? []) as AssignedDoctorRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    workplace: row.workplace?.trim() || undefined,
    workplacePhone: row.workplace_phone ?? undefined,
    academicTitle: row.academic_title ?? undefined,
    degree: row.degree ?? undefined,
    specialty: row.specialty ?? undefined,
    room: row.room ?? undefined,
  }));
}

export async function cancelAppointmentRequest(id: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_appointment_request", { p_id: id });
  if (error) throw toAppError(error);
}
