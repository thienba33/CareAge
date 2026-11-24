import type { BloodType, Gender } from "../types/healthProfile";

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];

export const BLOOD_TYPE_LABEL: Record<BloodType, string> = {
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
  UNKNOWN: "Chưa rõ",
};

export const BLOOD_TYPES: BloodType[] = ["A", "B", "AB", "O", "UNKNOWN"];
