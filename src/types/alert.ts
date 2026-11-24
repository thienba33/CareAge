import type { MetricType } from "./health";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertType = "ABNORMAL_METRIC";

// Cảnh báo do Backend sinh khi chỉ số vượt ngưỡng theo dõi — Mobile chỉ hiển thị.
export type HealthAlert = {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metricType?: MetricType;
  metricId?: string;
  createdAt: string; // ISO datetime (thời điểm đo)
  readAt?: string;
};
