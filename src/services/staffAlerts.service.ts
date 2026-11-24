import { supabase } from "../config/supabase";
import type { StaffAlert } from "../types/staff";
import { ALERT_COLUMNS, toAlert, type AlertRow } from "./alert.service";
import { toAppError } from "./supabaseError";

const ALERT_WINDOW_DAYS = 30;
const MAX_STAFF_ALERTS = 100;

type StaffAlertRow = AlertRow & { patient: { name: string } | null };

// Cảnh báo 30 ngày gần nhất của mọi bệnh nhân được phân công (RLS lọc), kèm trạng thái đã đọc riêng của bác sĩ.
export async function getRecentAlerts(viewerId: string): Promise<StaffAlert[]> {
  const since = new Date(Date.now() - ALERT_WINDOW_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("alerts")
    .select(`${ALERT_COLUMNS}, patient:profiles!alerts_user_id_fkey(name)`)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_STAFF_ALERTS)
    .returns<StaffAlertRow[]>();
  if (error) throw toAppError(error);
  if (data.length === 0) return [];

  const { data: reads, error: readsError } = await supabase
    .from("alert_reads")
    .select("alert_id, read_at")
    .eq("user_id", viewerId)
    .in(
      "alert_id",
      data.map((a) => a.id)
    )
    .returns<{ alert_id: string; read_at: string }[]>();
  if (readsError) throw toAppError(readsError);

  const readAt = new Map(reads.map((r) => [r.alert_id, r.read_at]));
  return data.map((row) => ({
    ...toAlert(row),
    readAt: readAt.get(row.id),
    patientName: row.patient?.name ?? "",
  }));
}
