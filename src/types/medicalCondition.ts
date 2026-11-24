export type ConditionStatus = "ACTIVE" | "INACTIVE" | "RESOLVED";

// Nhóm hiển thị: CHRONIC = bệnh nền, HISTORY = tiền sử bệnh, ALLERGY = dị ứng.
export type ConditionCategory = "CHRONIC" | "HISTORY" | "ALLERGY";

export type MedicalCondition = {
  id: string;
  userId: string;
  category: ConditionCategory;
  name: string;
  diagnosedAt?: string; // ISO date
  status: ConditionStatus;
  note?: string;
};
