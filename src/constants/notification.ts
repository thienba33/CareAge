export type NotificationType =
  | "MEDICATION_REMINDER"
  | "APPOINTMENT_REMINDER"
  | "HEALTH_ALERT"
  | "SYSTEM";

// Kênh thông báo Android cho nhắc thuốc / lịch khám (khớp "defaultChannel" trong app.json).
export const REMINDER_CHANNEL_ID = "reminders";
export const REMINDER_CHANNEL_NAME = "Nhắc uống thuốc và lịch khám";

// Kênh cho thông báo gửi tới người thân (push từ server và realtime) — khớp CHANNEL_ID trong Edge Function send-push.
export const CAREGIVER_ALERT_CHANNEL_ID = "caregiver-alerts";
export const CAREGIVER_ALERT_CHANNEL_NAME = "Thông báo về người thân";

// Nhắc lịch khám: tối hôm trước lúc 19:00 và 2 giờ trước giờ khám.
export const APPOINTMENT_EVE_REMINDER_HOUR = 19;
export const APPOINTMENT_REMINDER_HOURS_BEFORE = 2;
