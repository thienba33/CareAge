export type Gender = "MALE" | "FEMALE" | "OTHER";

export type BloodType = "A" | "B" | "AB" | "O" | "UNKNOWN";

export type HealthProfile = {
  userId: string;
  dateOfBirth?: string; // ISO date
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  bloodType?: BloodType;
  address?: string;
};
