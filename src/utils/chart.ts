import type { AlertThreshold, ThresholdField } from "../types/alertThreshold";
import type { HealthMetric, MetricType } from "../types/health";
import { isBloodPressure } from "./metric";

// Chuẩn bị dữ liệu cho biểu đồ chỉ số. Hàm thuần — không vẽ, không gọi API.

export type ChartPoint = { time: number; value: number; metricId: string };

export type ChartSeries = { key: ThresholdField; label: string; points: ChartPoint[] };

export type ReferenceLine = { value: number; direction: "ABOVE" | "BELOW" };

export function filterByRange(metrics: HealthMetric[], type: MetricType, days: number, now: Date = new Date()) {
  const from = now.getTime() - days * 86_400_000;
  return metrics
    .filter((m) => m.type === type)
    .filter((m) => {
      const t = new Date(m.recordedAt).getTime();
      return t >= from && t <= now.getTime();
    })
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

// Huyết áp → 2 đường (tâm thu, tâm trương); chỉ số khác → 1 đường.
export function buildSeries(metrics: HealthMetric[], type: MetricType): ChartSeries[] {
  if (type === "BLOOD_PRESSURE") {
    const bp = metrics.filter((m) => isBloodPressure(m.value));
    const point = (m: HealthMetric, field: "systolic" | "diastolic"): ChartPoint => ({
      time: new Date(m.recordedAt).getTime(),
      value: isBloodPressure(m.value) ? m.value[field] : 0,
      metricId: m.id,
    });
    return [
      { key: "systolic", label: "Tâm thu", points: bp.map((m) => point(m, "systolic")) },
      { key: "diastolic", label: "Tâm trương", points: bp.map((m) => point(m, "diastolic")) },
    ];
  }

  return [
    {
      key: "value",
      label: "Giá trị",
      points: metrics
        .filter((m) => typeof m.value === "number")
        .map((m) => ({ time: new Date(m.recordedAt).getTime(), value: m.value as number, metricId: m.id })),
    },
  ];
}

// Khoảng tham chiếu của đường chính: mức ngưỡng "nhẹ" nhất ở mỗi phía (giới hạn trên thấp nhất,
// giới hạn dưới cao nhất). Ngưỡng do Backend cung cấp — biểu đồ chỉ vẽ lại, không tự đặt.
export function getReferenceLines(thresholds: AlertThreshold[], field: ThresholdField): ReferenceLine[] {
  const ofField = thresholds.filter((t) => t.field === field);
  const above = ofField.filter((t) => t.direction === "ABOVE").map((t) => t.limitValue);
  const below = ofField.filter((t) => t.direction === "BELOW").map((t) => t.limitValue);

  const lines: ReferenceLine[] = [];
  if (above.length > 0) lines.push({ value: Math.min(...above), direction: "ABOVE" });
  if (below.length > 0) lines.push({ value: Math.max(...below), direction: "BELOW" });
  return lines;
}

export type Summary = { min: number; max: number; average: number; count: number };

export function summarize(points: ChartPoint[]): Summary | null {
  if (points.length === 0) return null;
  const values = points.map((p) => p.value);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { min: Math.min(...values), max: Math.max(...values), average, count: values.length };
}

// Miền trục Y bao cả dữ liệu và đường tham chiếu, làm tròn ra các mốc "đẹp".
export function computeYAxis(values: number[], tickCount = 4): { min: number; max: number; ticks: number[] } {
  if (values.length === 0) return { min: 0, max: 1, ticks: [0, 1] };

  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }

  const rawStep = (hi - lo) / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep;

  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Number(v.toFixed(2)));
  return { min, max, ticks };
}

// Điểm gần nhất theo trục thời gian (dùng khi chạm vào biểu đồ).
export function nearestIndex(points: ChartPoint[], time: number): number {
  let best = -1;
  let bestDistance = Infinity;
  points.forEach((p, i) => {
    const d = Math.abs(p.time - time);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}
