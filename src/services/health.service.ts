import { supabase } from "../config/supabase";
import type { HealthMetric, MetricSource, MetricType, MetricValue } from "../types/health";
import { METRIC_UNIT } from "../constants/healthMetric";
import { toAppError } from "./supabaseError";

const COLUMNS = "id, user_id, type, value, unit, recorded_at, source, appointment_id, device_name";

type MetricRow = {
  id: string;
  user_id: string;
  type: MetricType;
  value: MetricValue;
  unit: string;
  recorded_at: string;
  source: MetricSource;
  appointment_id: string | null;
  device_name: string | null;
};

const toMetric = (row: MetricRow): HealthMetric => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  value: row.value,
  unit: row.unit,
  recordedAt: row.recorded_at,
  source: row.source,
  appointmentId: row.appointment_id ?? undefined,
  deviceName: row.device_name ?? undefined,
});

export async function getMetrics(userId: string): Promise<HealthMetric[]> {
  const { data, error } = await supabase
    .from("health_metrics")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("recorded_at")
    .returns<MetricRow[]>();

  if (error) throw toAppError(error);
  return data.map(toMetric);
}

export async function recordMetric(
  userId: string,
  deviceName: string,
  type: MetricType,
  value: MetricValue,
  recordedAt?: string
): Promise<HealthMetric> {
  const { data, error } = await supabase
    .from("health_metrics")
    .insert({
      user_id: userId,
      type,
      value,
      unit: METRIC_UNIT[type],
      recorded_at: recordedAt ?? new Date().toISOString(),
      source: "DEVICE",
      device_name: deviceName,
    })
    .select(COLUMNS)
    .single<MetricRow>();

  if (error) throw toAppError(error);
  return toMetric(data);
}

export async function syncFromDevice(
  userId: string,
  deviceName: string,
  type: MetricType,
  value: MetricValue
): Promise<HealthMetric> {
  return recordMetric(userId, deviceName, type, value);
}
