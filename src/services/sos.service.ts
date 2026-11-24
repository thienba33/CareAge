import { Linking } from "react-native";
import * as SMS from "expo-sms";
import { EMERGENCY_NUMBER } from "../constants/emergency";

export async function callEmergencyNumber(): Promise<void> {
  await Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
}

export type SmsResult = "SENT" | "CANCELLED" | "UNKNOWN" | "UNAVAILABLE";

// Mở màn soạn tin nhắn có sẵn người nhận và nội dung — người dùng vẫn phải bấm Gửi
// (gửi tự động cần Backend, để giai đoạn sau).
export async function openSosSms(phones: string[], message: string): Promise<SmsResult> {
  if (phones.length === 0 || !(await SMS.isAvailableAsync())) return "UNAVAILABLE";
  const { result } = await SMS.sendSMSAsync(phones, message);
  return result === "sent" ? "SENT" : result === "cancelled" ? "CANCELLED" : "UNKNOWN";
}
