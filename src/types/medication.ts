export type MedicationStatus = "ACTIVE" | "INACTIVE" | "COMPLETED";

export type Medication = {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: number;
  times: string[]; // ví dụ: ["08:00", "20:00"]
  startDate: string; // ISO date
  endDate?: string; // ISO date
  instructions?: string;
  status: MedicationStatus;
  // Thông tin giới thiệu thuốc (khác với lịch uống) — hiển thị khi bấm vào thuốc trong Danh sách thuốc.
  activeIngredient?: string; // thành phần chính
  indication?: string; // công dụng / điều trị bệnh gì
  description?: string; // giới thiệu chung
};

export type DoseStatus = "PENDING" | "TAKEN" | "SKIPPED" | "MISSED";

export type MedicationDose = {
  id: string;
  medicationId: string;
  scheduledTime: string; // "HH:mm"
  status: DoseStatus;
  takenAt?: string; // ISO datetime
};
