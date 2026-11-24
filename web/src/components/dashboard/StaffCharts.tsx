"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartTooltip } from "./ChartCard";
import { CHART } from "@/lib/chartColors";
import type { StaffOverview } from "@/lib/staffData";

// Biểu đồ trang Tổng quan của bác sĩ — cùng quy ước với Charts.tsx (skill dataviz): cột ≤ 24px bo 4px, lưới mảnh,
// một trục y, chữ màu văn bản, có tooltip và bảng số liệu. Màu lấy từ bộ CHART đã kiểm tra.

const AXIS = { stroke: CHART.axis, fontSize: 12, tickLine: false, axisLine: false } as const;
const CURSOR = { fill: "rgba(11,140,121,0.06)" };
const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Trục: chỉ số ngày (thêm tháng ở ngày đầu tiên và ngày 1) cho gọn; tooltip / bảng: "T2, 19/10".
const dayMonth = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;
const dayLabel = (iso: string) => `${WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()]}, ${dayMonth(iso)}`;

// 1. Lịch khám 14 ngày tới: cột chồng — đã xác nhận (xanh ngọc) + chờ duyệt (cam).
export function UpcomingByDayChart({ data }: { data: StaffOverview["upcomingByDay"] }) {
  const total = data.reduce((n, d) => n + d.confirmed + d.requested, 0);
  return (
    <ChartCard
      title="Lịch khám 14 ngày tới"
      subtitle={`${total} lịch, gồm cả yêu cầu chưa duyệt`}
      legend={
        total > 0
          ? [
              { label: "Đã xác nhận", color: CHART.primary },
              { label: "Chờ duyệt", color: CHART.accent },
            ]
          : undefined
      }
      table={{ columns: ["Ngày", "Đã xác nhận", "Chờ duyệt"], rows: data.map((d) => [dayLabel(d.date), d.confirmed, d.requested]) }}
    >
      {total === 0 ? (
        <p className="grid h-full place-items-center text-sm text-muted">Chưa có lịch khám hay yêu cầu nào trong 14 ngày tới.</p>
      ) : (
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(iso: string, i: number) => (i === 0 || iso.endsWith("-01") ? dayMonth(iso) : String(Number(iso.slice(8, 10))))}
              {...AXIS}
              interval={0}
              fontSize={11}
            />
            <YAxis allowDecimals={false} {...AXIS} />
            <Tooltip cursor={CURSOR} content={<ChartTooltip formatLabel={(l) => dayLabel(String(l))} />} />
            <Bar isAnimationActive={false} dataKey="confirmed" name="Đã xác nhận" stackId="a" fill={CHART.primary} maxBarSize={24} />
            <Bar isAnimationActive={false} dataKey="requested" name="Chờ duyệt" stackId="a" fill={CHART.accent} maxBarSize={24} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// 2. Cảnh báo sức khỏe 30 ngày theo bệnh nhân — cột ngang, nhiều nhất ở trên.
export function AlertsByPatientChart({ data }: { data: StaffOverview["alertsByPatient"] }) {
  const rows = data.slice(0, 8);
  return (
    <ChartCard
      title="Cảnh báo sức khỏe theo bệnh nhân"
      subtitle="Số cảnh báo hệ thống tạo trong 30 ngày qua"
      table={{ columns: ["Bệnh nhân", "Số cảnh báo"], rows: data.map((d) => [d.name, d.count]) }}
    >
      {rows.length === 0 ? (
        <p className="grid h-full place-items-center text-sm text-muted">Không có cảnh báo nào trong 30 ngày qua.</p>
      ) : (
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...AXIS} />
            <YAxis type="category" dataKey="name" width={140} {...AXIS} stroke={CHART.text} fontSize={13} />
            <Tooltip cursor={CURSOR} content={<ChartTooltip />} />
            <Bar isAnimationActive={false} dataKey="count" name="Cảnh báo" fill={CHART.accent} maxBarSize={22} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="count" position="right" fill={CHART.text} fontSize={12} fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
