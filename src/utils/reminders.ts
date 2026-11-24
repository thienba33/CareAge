import type { Appointment } from "../types/appointment";
import type { Medication } from "../types/medication";
import type { NotificationType } from "../constants/notification";
import type { InboxType } from "../types/inbox";
import { APPOINTMENT_EVE_REMINDER_HOUR, APPOINTMENT_REMINDER_HOURS_BEFORE } from "../constants/notification";
import { fromDateKey, toDateKey } from "./date";

// Tính danh sách lịch nhắc từ dữ liệu thuốc / lịch khám. Hàm thuần — không gọi thư viện thông báo.

export type ReminderData = {
  type: NotificationType;
  appointmentId?: string;
  elderlyId?: string;
  // Thông báo đến từ hộp thông báo của người thân.
  inboxType?: InboxType;
};

export type DailyReminder = {
  kind: "DAILY";
  hour: number;
  minute: number;
  title: string;
  body: string;
  data: ReminderData;
};

export type OneTimeReminder = {
  kind: "DATE";
  date: Date;
  title: string;
  body: string;
  data: ReminderData;
};

export type Reminder = DailyReminder | OneTimeReminder;

function isActiveOn(medication: Medication, dateKey: string): boolean {
  return (
    medication.status === "ACTIVE" &&
    medication.startDate <= dateKey &&
    (!medication.endDate || medication.endDate >= dateKey)
  );
}

// Mỗi giờ uống là một nhắc lặp hằng ngày, gộp các thuốc cùng giờ vào một thông báo.
// Lịch lặp không tự dừng theo endDate nên được đồng bộ lại mỗi lần mở app.
export function buildMedicationReminders(medications: Medication[], now: Date = new Date()): DailyReminder[] {
  const todayKey = toDateKey(now);
  const byTime = new Map<string, Medication[]>();

  for (const medication of medications) {
    if (!isActiveOn(medication, todayKey)) continue;
    for (const time of medication.times) {
      byTime.set(time, [...(byTime.get(time) ?? []), medication]);
    }
  }

  return [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, meds]) => {
      const [hour, minute] = time.split(":").map(Number);
      return {
        kind: "DAILY" as const,
        hour,
        minute,
        title: `Đến giờ uống thuốc (${time})`,
        body: meds.map((m) => `${m.name} ${m.dosage} ${m.unit}`).join(", "),
        data: { type: "MEDICATION_REMINDER" as const },
      };
    });
}

export function buildAppointmentReminders(appointments: Appointment[], now: Date = new Date()): OneTimeReminder[] {
  const reminders: OneTimeReminder[] = [];

  for (const appointment of appointments) {
    if (appointment.status !== "UPCOMING") continue;

    const at = fromDateKey(appointment.date);
    const [hour, minute] = appointment.time.split(":").map(Number);
    at.setHours(hour, minute, 0, 0);

    const eve = fromDateKey(appointment.date);
    eve.setDate(eve.getDate() - 1);
    eve.setHours(APPOINTMENT_EVE_REMINDER_HOUR, 0, 0, 0);

    const soon = new Date(at.getTime() - APPOINTMENT_REMINDER_HOURS_BEFORE * 60 * 60 * 1000);
    const data = { type: "APPOINTMENT_REMINDER" as const, appointmentId: appointment.id };

    if (eve > now) {
      reminders.push({
        kind: "DATE",
        date: eve,
        title: "Ngày mai bạn có lịch khám",
        body: `${appointment.time} tại ${appointment.facility}${appointment.reason ? ` — ${appointment.reason}` : ""}`,
        data,
      });
    }
    if (soon > now) {
      reminders.push({
        kind: "DATE",
        date: soon,
        title: `Lịch khám lúc ${appointment.time} hôm nay`,
        body: `${APPOINTMENT_REMINDER_HOURS_BEFORE} giờ nữa là đến giờ khám tại ${appointment.facility}.`,
        data,
      });
    }
  }

  return reminders;
}
