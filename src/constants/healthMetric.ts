import { colors } from "../theme/colors";
import type { Ionicons } from "@expo/vector-icons";
import type { MetricType } from "../types/health";

export const METRIC_LABEL: Record<MetricType, string> = {
  BLOOD_PRESSURE: "Huyết áp",
  HEART_RATE: "Nhịp tim",
  BLOOD_GLUCOSE: "Đường huyết",
  SPO2: "SpO2",
  TEMPERATURE: "Nhiệt độ",
  WEIGHT: "Cân nặng",
  STEPS: "Bước chân",
  SLEEP: "Giấc ngủ",
};

export const METRIC_UNIT: Record<MetricType, string> = {
  BLOOD_PRESSURE: "mmHg",
  HEART_RATE: "bpm",
  BLOOD_GLUCOSE: "mg/dL",
  SPO2: "%",
  TEMPERATURE: "°C",
  WEIGHT: "kg",
  STEPS: "bước",
  SLEEP: "giờ",
};

export const METRIC_ICON: Record<MetricType, keyof typeof Ionicons.glyphMap> = {
  BLOOD_PRESSURE: "water",
  HEART_RATE: "heart",
  BLOOD_GLUCOSE: "flask",
  SPO2: "fitness",
  TEMPERATURE: "thermometer",
  WEIGHT: "scale",
  STEPS: "footsteps",
  SLEEP: "moon",
};

export const METRIC_ICON_COLOR = colors.primary;

export const METRIC_TYPES: MetricType[] = [
  "BLOOD_PRESSURE",
  "HEART_RATE",
  "SPO2",
  "TEMPERATURE",
  "STEPS",
  "SLEEP",
  "BLOOD_GLUCOSE",
  "WEIGHT",
];
