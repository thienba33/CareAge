export type ChartRangeKey = "7D" | "30D" | "3M" | "6M" | "1Y";

export type ChartRange = { key: ChartRangeKey; label: string; days: number };

export const CHART_RANGES: ChartRange[] = [
  { key: "7D", label: "7 ngày", days: 7 },
  { key: "30D", label: "30 ngày", days: 30 },
  { key: "3M", label: "3 tháng", days: 90 },
  { key: "6M", label: "6 tháng", days: 180 },
  { key: "1Y", label: "1 năm", days: 365 },
];

export const DEFAULT_CHART_RANGE: ChartRangeKey = "30D";
