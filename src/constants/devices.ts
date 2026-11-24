import { Platform } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import type { MetricType } from "../types/health";

export type MockDevice = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  metricType: MetricType;
  brand?: string;
  isHealthApp?: boolean;
};

export const HEALTH_APP_NAME = Platform.OS === "ios" ? "Apple Health" : "Google Health Connect";

export const MOCK_DEVICES: MockDevice[] = [
  {
    id: "device-watch",
    name: HEALTH_APP_NAME,
    icon: "heart-circle",
    metricType: "HEART_RATE",
    brand: "Apple Watch · Samsung · Garmin · Xiaomi",
    isHealthApp: true,
  },
  {
    id: "device-bp",
    name: "Máy đo huyết áp tại nhà",
    icon: "water",
    metricType: "BLOOD_PRESSURE",
    brand: "Omron · Beurer",
  },
  {
    id: "device-oximeter",
    name: "Máy đo SpO2 kẹp ngón tay",
    icon: "fitness",
    metricType: "SPO2",
    brand: "Yuwell · Microlife",
  },
];
