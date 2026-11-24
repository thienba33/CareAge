import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { supabase } from "../config/supabase";
import { toAppError } from "./supabaseError";

// Đăng ký Expo push token của máy với Backend để nhận push khi app đã tắt (Phần 8).
// Backend (trigger + Edge Function send-push) quyết định gửi gì cho ai; app chỉ báo "máy này của tôi".

let registeredToken: string | null = null;

// Expo Go trên Android không nhận được push từ SDK 53; máy ảo không có push token.
function canReceivePush(): boolean {
  if (Platform.OS === "web" || !Device.isDevice) return false;
  return !(Platform.OS === "android" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

// Máy đã đăng ký push thành công chưa — nếu có, thông báo trên máy do push hiển thị.
export function hasPushToken(): boolean {
  return registeredToken !== null;
}

// Gọi sau khi đã có quyền thông báo. Trả về false nếu máy / môi trường không hỗ trợ push.
export async function registerPushToken(): Promise<boolean> {
  const projectId = getProjectId();
  if (!canReceivePush() || !projectId) return false;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase.rpc("register_push_token", { p_token: token, p_platform: Platform.OS });
  if (error) throw toAppError(error);

  registeredToken = token;
  return true;
}

// Gọi trước khi đăng xuất (còn phiên) để máy không nhận thông báo của tài khoản cũ.
export async function unregisterPushToken(): Promise<void> {
  const token = registeredToken;
  if (!token) return;
  registeredToken = null;
  const { error } = await supabase.rpc("unregister_push_token", { p_token: token });
  if (error) throw toAppError(error);
}

// Token có thể bị dịch vụ push đổi khi app đang chạy → đăng ký lại.
export function onPushTokenChanged(callback: () => void): () => void {
  if (!canReceivePush()) return () => {};
  const subscription = Notifications.addPushTokenListener(() => callback());
  return () => subscription.remove();
}
