import { useEffect } from "react";
import { AppState } from "react-native";
import {
  appointmentService,
  medicationService,
  notificationService,
} from "../../services";
import { buildAppointmentReminders, buildMedicationReminders, type ReminderData } from "../../utils/reminders";
import { navigateToTabWhenReady } from "../../navigation/navigationRef";
import { useAuth } from "../auth";

function handleReminderTap(data: ReminderData | null) {
  if (data?.type === "MEDICATION_REMINDER") navigateToTabWhenReady("Medications");
  else if (data?.type === "APPOINTMENT_REMINDER") navigateToTabWhenReady("Appointments");
}

export function useReminderSync() {
  const { currentUser } = useAuth();
  const userId = currentUser?.role === "ELDERLY" ? currentUser.id : null;

  useEffect(() => {
    if (!userId || !notificationService.isNotificationSupported) return;

    let isActive = true;

    const sync = async () => {
      try {
        await notificationService.initNotifications();
        const permission = await notificationService.ensurePermission();
        if (permission !== "GRANTED" || !isActive) return;

        const [medications, appointments] = await Promise.all([
          medicationService.getMedications(userId),
          appointmentService.getAppointments(userId),
        ]);
        if (!isActive) return;

        await notificationService.replaceScheduledReminders([
          ...buildMedicationReminders(medications),
          ...buildAppointmentReminders(appointments),
        ]);
      } catch {}
    };

    sync();
    handleReminderTap(notificationService.getLaunchReminder());

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    const unsubscribeTap = notificationService.onReminderTapped(handleReminderTap);

    return () => {
      isActive = false;
      appStateSub.remove();
      unsubscribeTap();
      notificationService.cancelAllReminders();
    };
  }, [userId]);
}
