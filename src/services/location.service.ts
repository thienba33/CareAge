import * as Location from "expo-location";
import { LAST_KNOWN_LOCATION_MAX_AGE_MS, LOCATION_TIMEOUT_MS } from "../constants/emergency";

// Vị trí chỉ dùng để gửi cho người thân khi SOS — không lưu, không ghi log.

export type Coordinates = { latitude: number; longitude: number };

export async function ensureLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.granted;
}

const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

// Không bao giờ ném lỗi: không lấy được vị trí thì trả null để SOS vẫn tiếp tục.
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const current = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeout(LOCATION_TIMEOUT_MS),
    ]);
    const position =
      current ?? (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_LOCATION_MAX_AGE_MS }));
    return position ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null;
  } catch {
    return null;
  }
}
