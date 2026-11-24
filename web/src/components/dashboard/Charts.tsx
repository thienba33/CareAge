"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard, { ChartTooltip } from "./ChartCard";
import { CHART, STATUS_COLOR } from "@/lib/chartColors";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/labels";
import type { DashboardStats } from "@/lib/data";

// Quy ước chung (skill dataviz): cột ≤ 24px, đầu cột bo 4px; đường 2px; lưới mảnh, liền, nhạt; một trục y;
// chữ dùng màu văn bản, không dùng màu dữ liệu; mọi biểu đồ có tooltip và bảng số liệu.

const AXIS = { stroke: CHART.axis, fontSize: 12, tickLine: false, axisLine: false } as const;
const GRID = <CartesianGrid stroke={CHART.grid} strokeDasharray="0" vertical={false} />;
const CURSOR = { fill: "rgba(11,140,121,0.06)" };

// Trục: "T11" cho gọn; tooltip / bảng: "Tháng 11/2025".
const monthTick = (ym: string) => `T${Number(ym.split("-")[1])}`;
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `Tháng ${Number(m)}/${y}`;
};
const monthName = (iso: string) => `tháng ${Number(iso.slice(5, 7))}`;

// 1. Bệnh nhân mới theo tháng — một chuỗi; cột tháng hiện tại đậm, các tháng trước nhạt hơn (cùng hue), giá trị trên đầu cột.
export function NewElderlyChart({ data, month }: { data: DashboardStats["newElderlyByMonth"]; month: string }) {
  const current = month.slice(0, 7);
  return (
    <ChartCard
      title="Bệnh nhân mới theo tháng"
      subtitle="Người cao tuổi đăng ký trong 12 tháng gần nhất — cột đậm là tháng này"
      table={{ columns: ["Tháng", "Bệnh nhân mới"], rows: data.map((d) => [monthLabel(d.month), d.count]) }}
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
          {GRID}
          <XAxis dataKey="month" tickFormatter={monthTick} {...AXIS} interval={0} fontSize={11} />
          <YAxis allowDecimals={false} {...AXIS} />
          <Tooltip cursor={CURSOR} content={<ChartTooltip formatLabel={(l) => monthLabel(String(l))} />} />
          <Bar isAnimationActive={false} dataKey="count" name="Bệnh nhân mới" maxBarSize={24} radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.month} fill={CHART.primary} fillOpacity={d.month === current ? 1 : 0.45} />
            ))}
            <LabelList dataKey="count" position="top" fill={CHART.text} fontSize={11} formatter={(v) => (Number(v) > 0 ? v : "")} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 2. Lượt đặt lịch theo ngày: tháng này (xanh ngọc, liền) vs tháng trước (xanh dương, đứt nét) — cùng một trục.
export function BookingsByDayChart({ data, month, prevMonth }: { data: DashboardStats["bookingsByDay"]; month: string; prevMonth: string }) {
  const cur = `Tháng này (${monthName(month)})`;
  const prev = `Tháng trước (${monthName(prevMonth)})`;
  return (
    <ChartCard
      title="Lượt đặt lịch theo ngày"
      subtitle="Số yêu cầu đặt lịch người cao tuổi / người thân gửi mỗi ngày"
      legend={[
        { label: cur, color: CHART.primary },
        { label: prev, color: CHART.compare, dashed: true },
      ]}
      table={{
        columns: ["Ngày", cur, prev],
        rows: data.map((d) => [d.day, d.current ?? "—", d.previous ?? "—"]),
      }}
    >
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          {GRID}
          <XAxis dataKey="day" {...AXIS} ticks={[1, 5, 10, 15, 20, 25, 31]} />
          <YAxis allowDecimals={false} {...AXIS} />
          <Tooltip content={<ChartTooltip formatLabel={(l) => `Ngày ${l}`} />} cursor={{ stroke: CHART.axis, strokeWidth: 1 }} />
          <Line isAnimationActive={false}
            type="linear"
            dataKey="previous"
            name={prev}
            stroke={CHART.compare}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            connectNulls={false}
          />
          <Line isAnimationActive={false}
            type="linear"
            dataKey="current"
            name={cur}
            stroke={CHART.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 3. Trạng thái lịch khám tháng này — cột ngang, màu trạng thái giống app, tên trạng thái trên trục (không chỉ dùng màu).
export function AppointmentStatusChart({ data }: { data: DashboardStats["appointmentStatus"] }) {
  const rows = data.map((d) => ({ ...d, label: APPOINTMENT_STATUS_LABEL[d.status] }));
  return (
    <ChartCard
      title="Trạng thái lịch khám tháng này"
      subtitle="Theo ngày khám trong tháng"
      table={{ columns: ["Trạng thái", "Số lịch"], rows: rows.map((r) => [r.label, r.count]) }}
    >
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...AXIS} />
          <YAxis type="category" dataKey="label" width={140} {...AXIS} stroke={CHART.text} fontSize={13} />
          <Tooltip cursor={CURSOR} content={<ChartTooltip />} />
          <Bar isAnimationActive={false} dataKey="count" name="Số lịch" maxBarSize={22} radius={[0, 4, 4, 0]}>
            {rows.map((r) => (
              <Cell key={r.status} fill={STATUS_COLOR[r.status]} />
            ))}
            <LabelList dataKey="count" position="right" fill={CHART.text} fontSize={12} fontWeight={700} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const SEVERITY_LABEL = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", CRITICAL: "Nguy hiểm" } as const;

// 4. Cảnh báo theo mức độ: tháng này vs tháng trước — cột đôi, mức độ là nhãn trục.
export function AlertsSeverityChart({
  data,
  month,
  prevMonth,
}: {
  data: DashboardStats["alertsBySeverity"];
  month: string;
  prevMonth: string;
}) {
  const rows = data.map((d) => ({ ...d, label: SEVERITY_LABEL[d.severity] }));
  const cur = `Tháng này (${monthName(month)})`;
  const prev = `Tháng trước (${monthName(prevMonth)})`;
  return (
    <ChartCard
      title="Cảnh báo sức khỏe theo mức độ"
      subtitle="Số cảnh báo hệ thống tạo khi chỉ số vượt ngưỡng theo dõi"
      legend={[
        { label: cur, color: CHART.primary },
        { label: prev, color: CHART.compare },
      ]}
      table={{ columns: ["Mức độ", cur, prev], rows: rows.map((r) => [r.label, r.current, r.previous]) }}
    >
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 20, right: 8, left: -16, bottom: 0 }} barGap={2}>
          {GRID}
          <XAxis dataKey="label" {...AXIS} stroke={CHART.text} fontSize={13} />
          <YAxis allowDecimals={false} {...AXIS} />
          <Tooltip cursor={CURSOR} content={<ChartTooltip />} />
          <Bar isAnimationActive={false} dataKey="current" name={cur} fill={CHART.primary} maxBarSize={24} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="current" position="top" fill={CHART.text} fontSize={11} formatter={(v) => (Number(v) > 0 ? v : "")} />
          </Bar>
          <Bar isAnimationActive={false} dataKey="previous" name={prev} fill={CHART.compare} maxBarSize={24} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 5. Khối lượng việc của bác sĩ — cột ngang đôi: bệnh nhân đang phụ trách / yêu cầu chờ duyệt.
export function StaffWorkloadChart({ data }: { data: DashboardStats["staffWorkload"] }) {
  return (
    <ChartCard
      title="Khối lượng việc của bác sĩ"
      subtitle="Bệnh nhân đang phụ trách và yêu cầu đặt lịch chờ duyệt"
      legend={[
        { label: "Bệnh nhân đang phụ trách", color: CHART.primary },
        { label: "Yêu cầu chờ duyệt", color: CHART.accent },
      ]}
      table={{ columns: ["Bác sĩ", "Bệnh nhân", "Chờ duyệt"], rows: data.map((d) => [d.name, d.patients, d.pending]) }}
    >
      {data.length === 0 ? (
        <p className="grid h-full place-items-center text-sm text-muted">Chưa có bác sĩ nào.</p>
      ) : (
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={CHART.grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...AXIS} />
            <YAxis type="category" dataKey="name" width={150} {...AXIS} stroke={CHART.text} fontSize={13} />
            <Tooltip cursor={CURSOR} content={<ChartTooltip />} />
            <Bar isAnimationActive={false} dataKey="patients" name="Bệnh nhân đang phụ trách" fill={CHART.primary} maxBarSize={18} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="patients" position="right" fill={CHART.text} fontSize={12} fontWeight={700} />
            </Bar>
            <Bar isAnimationActive={false} dataKey="pending" name="Yêu cầu chờ duyệt" fill={CHART.accent} maxBarSize={18} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="pending" position="right" fill={CHART.text} fontSize={12} fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// 6. Tỉ lệ uống thuốc đúng giờ theo ngày (14 ngày) — một đường %, vùng nhạt ~10% bên dưới.
export function AdherenceChart({ data }: { data: DashboardStats["adherenceByDay"] }) {
  const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;
  return (
    <ChartCard
      title="Tỉ lệ uống thuốc 14 ngày qua"
      subtitle="Liều đã uống / liều đến hạn (đã uống + bỏ qua + quên) mỗi ngày"
      table={{
        columns: ["Ngày", "Đã uống", "Đến hạn", "Tỉ lệ"],
        rows: data.map((d) => [dayLabel(d.date), d.taken, d.due, d.rate === null ? "—" : `${d.rate}%`]),
      }}
    >
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          {GRID}
          <XAxis dataKey="date" tickFormatter={dayLabel} {...AXIS} interval={1} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} {...AXIS} />
          <Tooltip
            content={<ChartTooltip formatLabel={(l) => dayLabel(String(l))} formatValue={(v) => `${v}%`} />}
            cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
          />
          <Area isAnimationActive={false} type="linear" dataKey="rate" stroke="none" fill={CHART.primaryWash} fillOpacity={0.1} tooltipType="none" connectNulls />
          <Line isAnimationActive={false}
            type="linear"
            dataKey="rate"
            name="Tỉ lệ uống thuốc"
            stroke={CHART.primary}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART.primary, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
