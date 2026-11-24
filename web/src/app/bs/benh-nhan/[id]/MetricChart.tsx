"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartTooltip } from "@/components/dashboard/ChartCard";
import { CHART } from "@/lib/chartColors";
import { METRIC_LABEL, METRIC_TYPES, METRIC_UNIT, formatDateTime, formatMetricValue, type MetricType } from "@/lib/labels";
import type { MetricPoint } from "@/lib/staffData";

const AXIS = { stroke: CHART.axis, fontSize: 12, tickLine: false, axisLine: false } as const;

// Diễn biến một chỉ số trong 90 ngày: chọn chỉ số ở thanh trên; huyết áp vẽ 2 đường (tâm thu / tâm trương).
// Không tô màu "bất thường" — hệ thống chưa có khoảng tham chiếu từ Backend (như app).
export default function MetricChart({ metrics }: { metrics: MetricPoint[] }) {
  const available = useMemo(() => METRIC_TYPES.filter((t) => metrics.some((m) => m.type === t)), [metrics]);
  const [type, setType] = useState<MetricType | null>(available[0] ?? null);

  const points = useMemo(
    () =>
      metrics
        .filter((m) => m.type === type)
        .map((m, i) => ({
          i,
          at: formatDateTime(m.recordedAt),
          day: formatDateTime(m.recordedAt).slice(6, 11),
          value: typeof m.value === "number" ? m.value : null,
          systolic: typeof m.value === "number" ? null : m.value.systolic,
          diastolic: typeof m.value === "number" ? null : m.value.diastolic,
          text: formatMetricValue(m.value),
          source: m.source === "HOSPITAL" ? "Tái khám" : "Thiết bị",
        })),
    [metrics, type]
  );

  if (!type) return null;
  const bp = type === "BLOOD_PRESSURE";
  const unit = METRIC_UNIT[type];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {available.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={t === type}
            className={`rounded-full px-3 py-1 text-sm transition ${t === type ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink"}`}
          >
            {METRIC_LABEL[t]}
          </button>
        ))}
      </div>
      <ChartCard
        title={`${METRIC_LABEL[type]} (${unit})`}
        subtitle={`${points.length} lần đo trong 90 ngày gần nhất`}
        legend={
          bp
            ? [
                { label: "Tâm thu", color: CHART.primary },
                { label: "Tâm trương", color: CHART.compare, dashed: true },
              ]
            : undefined
        }
        table={{ columns: ["Thời điểm", `Giá trị (${unit})`, "Nguồn"], rows: [...points].reverse().map((p) => [p.at, p.text, p.source]) }}
      >
        <ResponsiveContainer>
          <LineChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="i" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(i) => points[i]?.day ?? ""} {...AXIS} minTickGap={24} />
            <YAxis {...AXIS} domain={["auto", "auto"]} />
            <Tooltip
              content={<ChartTooltip formatLabel={(l) => points[Number(l)]?.at ?? ""} formatValue={(v) => `${v} ${unit}`} />}
            />
            {bp ? (
              <>
                <Line isAnimationActive={false} type="monotone" dataKey="systolic" name="Tâm thu" stroke={CHART.primary} strokeWidth={2} dot={{ r: 2 }} />
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="diastolic"
                  name="Tâm trương"
                  stroke={CHART.compare}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 2 }}
                />
              </>
            ) : (
              <Line isAnimationActive={false} type="monotone" dataKey="value" name={METRIC_LABEL[type]} stroke={CHART.primary} strokeWidth={2} dot={{ r: 2 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
