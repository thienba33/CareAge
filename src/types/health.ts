export type MetricType =
  | "BLOOD_PRESSURE"
  | "HEART_RATE"
  | "BLOOD_GLUCOSE"
  | "SPO2"
  | "TEMPERATURE"
  | "WEIGHT"
  | "STEPS"
  | "SLEEP";

export type BloodPressureValue = { systolic: number; diastolic: number };

// Huyết áp có 2 số (tâm thu/tâm trương), các chỉ số còn lại là 1 số đơn.
export type MetricValue = number | BloodPressureValue;

export type MetricSource = "HOSPITAL" | "DEVICE";

export type HealthMetric = {
  id: string;
  userId: string;
  type: MetricType;
  value: MetricValue;
  unit: string;
  recordedAt: string; // ISO datetime
  source: MetricSource;
  appointmentId?: string; // lịch tái khám đã sinh ra kết quả này (khi source = HOSPITAL)
  deviceName?: string; // tên thiết bị đo (khi source = DEVICE)
};
