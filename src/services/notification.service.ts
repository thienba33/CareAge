import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  CAREGIVER_ALERT_CHANNEL_ID,
  CAREGIVER_ALERT_CHANNEL_NAME,
  REMINDER_CHANNEL_ID,
  REMINDER_CHANNEL_NAME,
} from "../constants/notification";
import type { Reminder, ReminderData } from "../utils/reminders";

// Bọc expo-notifications (local notification) để UI/hook không gọi thư viện trực tiếp.
// Thông báo chỉ để nhắc — trạng thái uống thuốc vẫn lưu ở Backend (skill mục 11).

export const isNotificationSupported = Platform.OS !== "web";

let initPromise: Promise<void> | null = null;

// Nhiều hook cùng gọi: dùng chung một lần khởi tạo, chờ tạo xong kênh Android rồi mới xin token / đặt lịch.
export function initNotifications(): Promise<void> {
  if (!isNotificationSupported) return Promise.resolve();
  initPromise ??= setup().catch((error) => {
    initPromise = null;
    throw error;
  });
  return initPromise;
}

const BASE_CHANNEL_CONFIG: Omit<Notifications.NotificationChannelInput, "name"> = {
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 400, 250, 400],
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
};

const ANDROID_CHANNELS = [
  { id: REMINDER_CHANNEL_ID, name: REMINDER_CHANNEL_NAME },
  { id: CAREGIVER_ALERT_CHANNEL_ID, name: CAREGIVER_ALERT_CHANNEL_NAME },
];

async function setup(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await Promise.all(
      ANDROID_CHANNELS.map((channel) =>
        Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          ...BASE_CHANNEL_CONFIG,
        })
      )
    );
  }
}

export type PermissionResult = "GRANTED" | "DENIED" | "UNSUPPORTED";

export async function getPermission(): Promise<PermissionResult> {
  if (!isNotificationSupported) return "UNSUPPORTED";
  const current = await Notifications.getPermissionsAsync();
  return current.granted ? "GRANTED" : "DENIED";
}

// Hỏi quyền nếu chưa từng từ chối vĩnh viễn.
export async function ensurePermission(): Promise<PermissionResult> {
  if (!isNotificationSupported) return "UNSUPPORTED";

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "GRANTED";
  if (!current.canAskAgain) return "DENIED";

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.granted ? "GRANTED" : "DENIED";
}

// Thay toàn bộ lịch nhắc cũ bằng danh sách mới (app chỉ đặt lịch nhắc của chính nó).
export async function replaceScheduledReminders(reminders: Reminder[]): Promise<void> {
  if (!isNotificationSupported) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: reminder.data,
        sound: true,
      },
      trigger:
        reminder.kind === "DAILY"
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: reminder.hour,
              minute: reminder.minute,
              channelId: REMINDER_CHANNEL_ID,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminder.date,
              channelId: REMINDER_CHANNEL_ID,
            },
    });
  }
}

// Hiện thông báo ngay (vd. cảnh báo sức khỏe của người thân vừa đến qua realtime).
export async function presentNow(title: string, body: string, data: ReminderData): Promise<void> {
  if (!isNotificationSupported) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: Platform.OS === "android" ? { channelId: CAREGIVER_ALERT_CHANNEL_ID } : null,
  });
}

export async function cancelAllReminders(): Promise<void> {
  if (!isNotificationSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Người dùng bấm vào thông báo (khi app đang mở hoặc chạy nền).
export function onReminderTapped(callback: (data: ReminderData) => void): () => void {
  if (!isNotificationSupported) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    callback(response.notification.request.content.data as ReminderData);
  });
  return () => subscription.remove();
}

// Thông báo đã mở app từ trạng thái tắt hẳn (nếu có).
export function getLaunchReminder(): ReminderData | null {
  if (!isNotificationSupported) return null;
  const response = Notifications.getLastNotificationResponse();
  if (!response) return null;
  // Xóa để không xử lý lại khi đăng xuất rồi đăng nhập lại trong cùng phiên app.
  Notifications.clearLastNotificationResponse();
  return response.notification.request.content.data as ReminderData;
}
