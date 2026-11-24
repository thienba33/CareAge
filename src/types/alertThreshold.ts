import type { AlertSeverity } from "./alert";
import type { MetricType } from "./health";

export type ThresholdField = "value" | "systolic" | "diastolic";

// Ngưỡng theo dõi do Backend cấu hình (mặc định hoặc riêng cho từng người).
export type AlertThreshold = {
  metricType: MetricType;
  field: ThresholdField;
  direction: "ABOVE" | "BELOW";
  limitValue: number;
  severity: AlertSeverity;
};
