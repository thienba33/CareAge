import { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import { notificationService, type PermissionResult } from "../../services";

// Trạng thái quyền thông báo, cập nhật lại khi người dùng quay về từ Cài đặt của máy.
export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionResult | null>(null);

  const refresh = useCallback(() => {
    notificationService
      .getPermission()
      .then(setPermission)
      .catch(() => setPermission(null));
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Hỏi lại nếu hệ thống còn cho hỏi, nếu không thì mở Cài đặt của app để người dùng tự bật.
  const enable = useCallback(async () => {
    const result = await notificationService.ensurePermission();
    if (result === "DENIED") await Linking.openSettings();
    setPermission(result);
  }, []);

  return { permission, enable };
}
