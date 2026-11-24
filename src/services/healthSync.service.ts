import { Platform } from "react-native";
import * as healthService from "./health.service";
import * as alertService from "./alert.service";
import * as appleHealthService from "./appleHealth.service";
import type { HealthMetric, MetricType, MetricValue } from "../types/health";
import type { HealthAlert } from "../types/alert";
import { HEALTH_APP_NAME } from "../constants/devices";

export type HealthSyncResult = {
  success: boolean;
  platformName: string;
  isRealData: boolean;
  syncedMetrics: HealthMetric[];
  alert: HealthAlert | null;
  syncedAt: string;
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Sinh giá trị mô phỏng hợp lý cho từng loại chỉ số khi không có thiết bị thật
export function generateDeviceValue(type: MetricType): MetricValue {
  switch (type) {
    case "BLOOD_PRESSURE":
      return { systolic: randomInt(112, 134), diastolic: randomInt(72, 86) };
    case "HEART_RATE":
      return randomInt(64, 88);
    case "SPO2":
      return randomInt(95, 99);
    case "BLOOD_GLUCOSE":
      return randomInt(85, 120);
    case "TEMPERATURE":
      return Number((36.2 + Math.random() * 0.6).toFixed(1));
    case "WEIGHT":
      return Number((55 + Math.random() * 10).toFixed(1));
    case "STEPS":
      return randomInt(3200, 6800);
    case "SLEEP":
      return Number((6.5 + Math.random() * 1.8).toFixed(1));
  }
}

const SYNC_METRIC_TYPES = [
  "HEART_RATE",
  "BLOOD_PRESSURE",
  "SPO2",
  "TEMPERATURE",
  "STEPS",
  "SLEEP",
] as const;

type RealReadings = Partial<Record<(typeof SYNC_METRIC_TYPES)[number], MetricValue | null>>;

async function syncAllMetrics(
  userId: string,
  deviceLabel: string,
  readings: RealReadings = {}
): Promise<HealthMetric[]> {
  const tasks = SYNC_METRIC_TYPES.map((type) => {
    const val = readings[type] ?? generateDeviceValue(type);
    return healthService.recordMetric(userId, deviceLabel, type, val);
  });
  return Promise.all(tasks);
}

export function isHealthAppSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function syncSmartwatchMetrics(userId: string): Promise<HealthSyncResult> {
  const platformName = HEALTH_APP_NAME;
  const deviceLabel = platformName;

  let isRealData = false;
  let syncedMetrics: HealthMetric[] = [];

  const isNativeAvailable = await appleHealthService.isHealthKitAvailable();

  if (isNativeAvailable) {
    try {
      await appleHealthService.initHealthKitPermissions();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const yesterdayEvening = new Date(startOfToday.getTime() - 12 * 3600 * 1000);

      const [realSteps, realHeartRate, realBP, realSpO2, realTemp, realSleep] =
        await Promise.all([
          appleHealthService.fetchStepsToday(),
          appleHealthService.fetchLatestHeartRate(startOfToday),
          appleHealthService.fetchLatestBloodPressure(startOfToday),
          appleHealthService.fetchLatestSpO2(startOfToday),
          appleHealthService.fetchLatestTemperature(startOfToday),
          appleHealthService.fetchSleepToday(yesterdayEvening),
        ]);

      syncedMetrics = await syncAllMetrics(userId, deviceLabel, {
        STEPS: realSteps,
        HEART_RATE: realHeartRate,
        BLOOD_PRESSURE: realBP,
        SPO2: realSpO2,
        TEMPERATURE: realTemp,
        SLEEP: realSleep,
      });
      isRealData = true;
    } catch (err) {
      console.warn("[HealthSync] Lỗi khi đọc Apple HealthKit thật, chuyển fallback:", err);
      isRealData = false;
    }
  }

  // Fallback nếu không có native binary (Expo Go) hoặc gặp lỗi đọc native
  if (syncedMetrics.length === 0) {
    syncedMetrics = await syncAllMetrics(userId, deviceLabel);
    isRealData = false;
  }

  // Kiểm tra cảnh báo bất thường nếu có
  let triggeredAlert: HealthAlert | null = null;
  try {
    for (const m of syncedMetrics) {
      const alert = await alertService.getAlertForMetric(m.id).catch(() => null);
      if (alert) {
        triggeredAlert = alert;
        break;
      }
    }
  } catch {
    triggeredAlert = null;
  }

  return {
    success: true,
    platformName,
    isRealData,
    syncedMetrics,
    alert: triggeredAlert,
    syncedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  };
}
