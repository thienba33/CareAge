import type { Appointment } from "../types/appointment";
import type { HealthMetric, MetricType } from "../types/health";
import type { Medication, MedicationDose } from "../types/medication";
import { splitAppointments } from "./appointment";

// Các hàm thuần tổng hợp dữ liệu cho Trang chủ người cao tuổi. Không gọi API, không phụ thuộc UI.

export type DoseCompliance = { taken: number; total: number };

// Tỉ lệ uống thuốc hôm nay: số liều đã uống / tổng số liều trong ngày.
export function getDoseCompliance(doses: MedicationDose[]): DoseCompliance {
  return {
    taken: doses.filter((d) => d.status === "TAKEN").length,
    total: doses.length,
  };
}

export type DoseWithMedication = { dose: MedicationDose; medication: Medication };

export type DoseGroup = { time: string; items: DoseWithMedication[] };

// Các liều chưa uống của khung giờ sớm nhất trong ngày (gộp các thuốc cùng giờ) — gồm cả
// khung giờ đã quá (vẫn cho uống trễ), để người cao tuổi không bỏ sót liều trước đó.
export function getNextDoseGroup(doses: MedicationDose[], medications: Medication[]): DoseGroup | null {
  const medicationById = new Map(medications.map((m) => [m.id, m]));
  const pending = doses
    .filter((d) => d.status === "PENDING" && medicationById.has(d.medicationId))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  if (pending.length === 0) return null;
  const time = pending[0].scheduledTime;
  return {
    time,
    items: pending
      .filter((d) => d.scheduledTime === time)
      .map((dose) => ({ dose, medication: medicationById.get(dose.medicationId)! })),
  };
}

const byNewest = (a: HealthMetric, b: HealthMetric) => b.recordedAt.localeCompare(a.recordedAt);

export function getLatestMetricByType(metrics: HealthMetric[], type: MetricType): HealthMetric | null {
  return metrics.filter((m) => m.type === type).sort(byNewest)[0] ?? null;
}

// Lịch khám UPCOMING gần nhất chưa qua giờ khám.
export function getNextAppointment(appointments: Appointment[], now: Date = new Date()): Appointment | null {
  return splitAppointments(appointments, now).upcoming[0] ?? null;
}
