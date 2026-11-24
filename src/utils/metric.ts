import type { BloodPressureValue, MetricValue } from "../types/health";

export function isBloodPressure(value: MetricValue): value is BloodPressureValue {
  return typeof value === "object";
}

// Huyết áp hiển thị "130/80", các chỉ số khác hiển thị một số.
export function formatMetricValue(value: MetricValue): string {
  return isBloodPressure(value) ? `${value.systolic}/${value.diastolic}` : `${value}`;
}

export function cleanDeviceName(name?: string | null): string {
  if (!name) return "Thiết bị";
  return name.replace(/\s*\(.*?\)/g, "").trim();
}
