import { useEffect } from "react";
import { notificationService, pushTokenService } from "../../services";
import { useAuth } from "../auth";

export function usePushRegistration() {
  const { currentUser } = useAuth();
  const userId = currentUser?.role === "CAREGIVER" ? currentUser.id : null;

  useEffect(() => {
    if (!userId || !notificationService.isNotificationSupported) return;

    const register = async () => {
      try {
        await notificationService.initNotifications();
        const permission = await notificationService.ensurePermission();
        if (permission === "GRANTED") await pushTokenService.registerPushToken();
      } catch {}
    };

    register();
    return pushTokenService.onPushTokenChanged(register);
  }, [userId]);
}
