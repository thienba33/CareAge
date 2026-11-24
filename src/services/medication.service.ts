import { supabase } from "../config/supabase";
import type { DoseStatus, Medication, MedicationDose, MedicationStatus } from "../types/medication";
import { toDateKey, toHourMinute } from "../utils/date";
import { toAppError } from "./supabaseError";

// Thuốc do nhân viên y tế kê ở Backend — ELDERLY chỉ đọc và đánh dấu trạng thái liều.

const MEDICATION_COLUMNS =
  "id, user_id, name, dosage, unit, frequency, times, start_date, end_date, instructions, status, active_ingredient, indication, description";

const DOSE_COLUMNS = "id, medication_id, scheduled_time, status, taken_at";

type MedicationRow = {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: number;
  times: string[];
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  status: MedicationStatus;
  active_ingredient: string | null;
  indication: string | null;
  description: string | null;
};

type DoseRow = {
  id: string;
  medication_id: string;
  scheduled_time: string;
  status: DoseStatus;
  taken_at: string | null;
};

const toMedication = (row: MedicationRow): Medication => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  dosage: row.dosage,
  unit: row.unit,
  frequency: row.frequency,
  times: row.times.map(toHourMinute),
  startDate: row.start_date,
  endDate: row.end_date ?? undefined,
  instructions: row.instructions ?? undefined,
  status: row.status,
  activeIngredient: row.active_ingredient ?? undefined,
  indication: row.indication ?? undefined,
  description: row.description ?? undefined,
});

const toDose = (row: DoseRow): MedicationDose => ({
  id: row.id,
  medicationId: row.medication_id,
  scheduledTime: toHourMinute(row.scheduled_time),
  status: row.status,
  takenAt: row.taken_at ?? undefined,
});

export async function getMedications(userId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from("medications")
    .select(MEDICATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at")
    .returns<MedicationRow[]>();

  if (error) throw toAppError(error);
  return data.map(toMedication);
}

// Backend sinh liều của ngày từ lịch thuốc (nếu chưa có) rồi trả về.
// Truyền ngày theo giờ máy người dùng vì giờ server là UTC.
export async function getTodayDoses(userId: string): Promise<MedicationDose[]> {
  const { data, error } = await supabase
    .rpc("ensure_doses_for_date", { p_user_id: userId, p_date: toDateKey(new Date()) })
    .select(DOSE_COLUMNS);

  if (error) throw toAppError(error);
  return (data as unknown as DoseRow[]).map(toDose);
}

// taken_at do trigger ở Backend ghi, client chỉ đổi status.
async function updateDoseStatus(doseId: string, status: DoseStatus): Promise<MedicationDose> {
  const { data, error } = await supabase
    .from("medication_doses")
    .update({ status })
    .eq("id", doseId)
    .select(DOSE_COLUMNS)
    .single<DoseRow>();

  if (error) throw toAppError(error);
  return toDose(data);
}

export function markDoseTaken(doseId: string): Promise<MedicationDose> {
  return updateDoseStatus(doseId, "TAKEN");
}

export function markDoseSkipped(doseId: string): Promise<MedicationDose> {
  return updateDoseStatus(doseId, "SKIPPED");
}

export function markDosePending(doseId: string): Promise<MedicationDose> {
  return updateDoseStatus(doseId, "PENDING");
}
