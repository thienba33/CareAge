// Tên service 
export * as alertService from "./alert.service";
export * as appleHealthService from "./appleHealth.service";
export * as appointmentService from "./appointment.service";
export * as authService from "./auth.service";
export * as caregiverService from "./caregiver.service";
export * as chatbotService from "./chatbot.service";
export * as emergencyContactService from "./emergencyContact.service";
export * as contactService from "./emergencyContact.service";
export * as healthService from "./health.service";
export * as healthProfileService from "./healthProfile.service";
export * as healthSyncService from "./healthSync.service";
export * as inboxService from "./inbox.service";
export * as locationService from "./location.service";
export * as medicalConditionService from "./medicalCondition.service";
export * as conditionService from "./medicalCondition.service";
export * as medicationService from "./medication.service";
export * as notificationService from "./notification.service";
export * as pushTokenService from "./pushToken.service";
export * as realtimeService from "./realtime.service";
export * as sosService from "./sos.service";
export * as staffService from "./staff.service";
export * as staffAlertsService from "./staffAlerts.service";
export * as staffAppointmentService from "./staffAppointment.service";
export * as staffProfileService from "./staffProfile.service";
export * as supabaseError from "./supabaseError";
export * as ttsService from "./tts.service";

// Tên function tiện ích hay dùng 
export { generateDeviceValue, syncSmartwatchMetrics } from "./healthSync.service";
export { toInboxNotification } from "./inbox.service";
export { speakText, stopSpeech, cleanTextForSpeech } from "./tts.service";
export { sendMessage, ChatbotError } from "./chatbot.service";

// Định nghĩa type
export type * from "./auth.service";
export type * from "./emergencyContact.service";
export type * from "./medicalCondition.service";
export type * from "./location.service";
export type * from "./notification.service";
export type * from "./caregiver.service";
export type * from "./chatbot.service";
export type * from "./healthSync.service";
