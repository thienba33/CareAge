import { NativeModules, Platform } from "react-native";

let AppleHealthKit: any = null;
try {
  AppleHealthKit = require("react-native-health").default || require("react-native-health");
} catch {
  AppleHealthKit = null;
}

export function isHealthKitAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS !== "ios") {
      resolve(false);
      return;
    }
    const nativeModule = NativeModules?.AppleHealthKit;
    if (!nativeModule || !AppleHealthKit || typeof AppleHealthKit.isAvailable !== "function") {
      resolve(false);
      return;
    }
    AppleHealthKit.isAvailable((err: any, available: boolean) => {
      resolve(!err && !!available);
    });
  });
}

// Khởi tạo và yêu cầu cấp quyền đọc dữ liệu từ Apple Health (HealthKit).
export function initHealthKitPermissions(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!AppleHealthKit?.initHealthKit || !AppleHealthKit?.Constants?.Permissions) {
      resolve(false);
      return;
    }

    const P = AppleHealthKit.Constants.Permissions;
    const permissions = {
      permissions: {
        read: [
          P.StepCount,
          P.HeartRate,
          P.BloodPressureSystolic,
          P.BloodPressureDiastolic,
          P.OxygenSaturation,
          P.BodyTemperature,
          P.SleepAnalysis,
        ],
        write: [],
      },
    };

    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.warn("[AppleHealth] Init permissions error:", error);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function wrapHKSamples<T, R>(
  getter: ((options: Record<string, unknown>, cb: (err: unknown, results: T) => void) => void) | undefined,
  options: Record<string, unknown>,
  transform: (results: T) => R | null
): Promise<R | null> {
  return new Promise((resolve) => {
    if (!getter) return resolve(null);
    getter.call(AppleHealthKit, options, (err: unknown, results: T) => {
      if (err || !results) return resolve(null);
      try {
        resolve(transform(results));
      } catch {
        resolve(null);
      }
    });
  });
}

// Đọc số bước chân trong ngày hôm nay từ Apple Health.
export function fetchStepsToday(): Promise<number | null> {
  return wrapHKSamples<{ value?: unknown }, number>(
    AppleHealthKit?.getStepCount,
    { date: new Date().toISOString() },
    (results) => (typeof results?.value === "number" ? Math.round(results.value) : null)
  );
}

// Đọc nhịp tim gần nhất trong ngày hôm nay từ Apple Health.
export function fetchLatestHeartRate(since: Date): Promise<number | null> {
  return wrapHKSamples<Array<{ value?: unknown }>, number>(
    AppleHealthKit?.getHeartRateSamples,
    { startDate: since.toISOString(), limit: 1 },
    (results) => {
      const val = results[0]?.value;
      return typeof val === "number" ? Math.round(val) : null;
    }
  );
}

// Đọc huyết áp gần nhất trong ngày hôm nay từ Apple Health.
export function fetchLatestBloodPressure(
  since: Date
): Promise<{ systolic: number; diastolic: number } | null> {
  return wrapHKSamples<
    Array<{ bloodPressureSystolicValue?: unknown; bloodPressureDiastolicValue?: unknown }>,
    { systolic: number; diastolic: number }
  >(
    AppleHealthKit?.getBloodPressureSamples,
    { startDate: since.toISOString(), limit: 1 },
    (results) => {
      const item = results[0];
      if (
        typeof item?.bloodPressureSystolicValue === "number" &&
        typeof item?.bloodPressureDiastolicValue === "number"
      ) {
        return {
          systolic: Math.round(item.bloodPressureSystolicValue),
          diastolic: Math.round(item.bloodPressureDiastolicValue),
        };
      }
      return null;
    }
  );
}

// Đọc nồng độ SpO2 gần nhất trong ngày hôm nay từ Apple Health.
export function fetchLatestSpO2(since: Date): Promise<number | null> {
  return wrapHKSamples<Array<{ value?: unknown }>, number>(
    AppleHealthKit?.getOxygenSaturationSamples,
    { startDate: since.toISOString(), limit: 1 },
    (results) => {
      const raw = results[0]?.value;
      if (typeof raw === "number") {
        return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
      }
      return null;
    }
  );
}

// Đọc thân nhiệt gần nhất trong ngày hôm nay từ Apple Health.
export function fetchLatestTemperature(since: Date): Promise<number | null> {
  return wrapHKSamples<Array<{ value?: unknown }>, number>(
    AppleHealthKit?.getBodyTemperatureSamples,
    { startDate: since.toISOString(), unit: "celsius", limit: 1 },
    (results) => {
      const val = results[0]?.value;
      return typeof val === "number" ? Number(val.toFixed(1)) : null;
    }
  );
}

// Đọc thời lượng giấc ngủ đêm qua / hôm nay từ Apple Health.
export function fetchSleepToday(since: Date): Promise<number | null> {
  return new Promise((resolve) => {
    if (!AppleHealthKit?.getSleepSamples) return resolve(null);
    AppleHealthKit.getSleepSamples(
      { startDate: since.toISOString(), endDate: new Date().toISOString() },
      (err: string, results: any[]) => {
        if (err || !results || results.length === 0) return resolve(null);
        let totalMinutes = 0;
        for (const item of results) {
          const v = item?.value;
          if (v === "ASLEEP" || v === "CORE" || v === "DEEP" || v === "REM") {
            const start = new Date(item.startDate).getTime();
            const end = new Date(item.endDate).getTime();
            if (end > start) {
              totalMinutes += (end - start) / 60000;
            }
          }
        }
        if (totalMinutes > 0) {
          resolve(Number((totalMinutes / 60).toFixed(1)));
        } else {
          resolve(null);
        }
      }
    );
  });
}
