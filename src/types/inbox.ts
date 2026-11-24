// Thông báo lưu ở Backend cho người thân (hộp thông báo).
export type InboxType = "MEDICATION_MISSED" | "APPOINTMENT_TOMORROW" | "HEALTH_ALERT" | "APPOINTMENT_REVIEWED";

export type InboxNotification = {
  id: string;
  elderlyId?: string;
  type: InboxType;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  // Cữ thuốc bị quên (chỉ MEDICATION_MISSED) — để gộp lần báo và lần nhắc lại thành một dòng.
  dose?: { date: string; time: string };
};

// Một dòng trong hộp thông báo: một thông báo, hoặc nhiều lần nhắc cho cùng một sự việc.
export type InboxEntry = {
  key: string;
  type: InboxType;
  elderlyId?: string;
  title: string;
  body: string;
  createdAt: string;
  // Số lần đã báo (≥ 2 thì hiện "(n)").
  count: number;
  ids: string[];
  unreadIds: string[];
};
