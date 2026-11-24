import { supabase } from "../config/supabase";
import type { AlertSeverity, AlertType, HealthAlert } from "../types/alert";
import type { MetricType } from "../types/health";
import type { AlertThreshold, ThresholdField } from "../types/alertThreshold";
import { toAppError } from "./supabaseError";

// Cảnh báo do Backend (trigger evaluate_metric) sinh ra — Mobile chỉ đọc và đánh dấu đã đọc.

export const ALERT_COLUMNS = "id, user_id, type, severity, title, message, metric_type, metric_id, created_at, read_at";
const MAX_ALERTS = 50;

export type AlertRow = {
  id: string;
  user_id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metric_type: MetricType | null;
  metric_id: string | null;
  created_at: string;
  read_at: string | null;
};

export const toAlert = (row: AlertRow): HealthAlert => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  severity: row.severity,
  title: row.title,
  message: row.message,
  metricType: row.metric_type ?? undefined,
  metricId: row.metric_id ?? undefined,
  createdAt: row.created_at,
  readAt: row.read_at ?? undefined,
});

export async function getAlerts(userId: string): Promise<HealthAlert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_ALERTS)
    .returns<AlertRow[]>();

  if (error) throw toAppError(error);
  return data.map(toAlert);
}

// Cảnh báo (nếu có) Backend vừa sinh cho một lần đo.
export async function getAlertForMetric(metricId: string): Promise<HealthAlert | null> {
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_COLUMNS)
    .eq("metric_id", metricId)
    .maybeSingle<AlertRow>();

  if (error) throw toAppError(error);
  return data ? toAlert(data) : null;
}

export async function markAsRead(id: string): Promise<HealthAlert> {
  const { data, error } = await supabase
    .from("alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .select(ALERT_COLUMNS)
    .single<AlertRow>();

  if (error) throw toAppError(error);
  return toAlert(data);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw toAppError(error);
}

type ThresholdRow = {
  metric_type: MetricType;
  field: ThresholdField;
  direction: "ABOVE" | "BELOW";
  limit_value: number;
  severity: AlertSeverity;
};

// Ngưỡng đang áp dụng cho người dùng — Backend quyết định dùng ngưỡng riêng hay mặc định.
export async function getApplicableThresholds(userId: string, metricType: MetricType): Promise<AlertThreshold[]> {
  const { data, error } = await supabase.rpc("applicable_alert_thresholds", {
    p_user_id: userId,
    p_metric_type: metricType,
  });

  if (error) throw toAppError(error);
  return (data as ThresholdRow[]).map((row) => ({
    metricType: row.metric_type,
    field: row.field,
    direction: row.direction,
    limitValue: Number(row.limit_value),
    severity: row.severity,
  }));
}

// ---- Người thân: trạng thái đã đọc riêng (bảng alert_reads), không đổi read_at của người cao tuổi ----

// Cảnh báo của người cao tuổi, với readAt là thời điểm CHÍNH người xem (viewerId) đã đọc.
export async function getAlertsForViewer(subjectId: string, viewerId: string): Promise<HealthAlert[]> {
  const alerts = await getAlerts(subjectId);
  if (alerts.length === 0) return alerts;

  const { data, error } = await supabase
    .from("alert_reads")
    .select("alert_id, read_at")
    .eq("user_id", viewerId)
    .in(
      "alert_id",
      alerts.map((a) => a.id)
    )
    .returns<{ alert_id: string; read_at: string }[]>();

  if (error) throw toAppError(error);
  const readAt = new Map(data.map((r) => [r.alert_id, r.read_at]));
  return alerts.map((a) => ({ ...a, readAt: readAt.get(a.id) }));
}

export async function markReadForViewer(alertIds: string[], viewerId: string): Promise<void> {
  if (alertIds.length === 0) return;
  const { error } = await supabase
    .from("alert_reads")
    .upsert(
      alertIds.map((alertId) => ({ alert_id: alertId, user_id: viewerId })),
      { onConflict: "alert_id,user_id", ignoreDuplicates: true }
    );
  if (error) throw toAppError(error);
}
