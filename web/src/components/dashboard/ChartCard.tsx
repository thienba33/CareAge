"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";

export type LegendItem = { label: string; color: string; dashed?: boolean };
export type TableData = { columns: string[]; rows: (string | number)[][] };

// Khung một biểu đồ: tiêu đề + mô tả, chú thích (≥ 2 chuỗi), nút chuyển "Xem dạng bảng" để đọc số liệu
// không phụ thuộc màu (yêu cầu trợ năng của skill dataviz).
export default function ChartCard({
  title,
  subtitle,
  legend,
  table,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  table: TableData;
  children: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className="flex flex-col gap-4 card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:bg-canvas hover:text-ink"
          aria-pressed={showTable}
        >
          {showTable ? <BarChart3 className="size-4" /> : <Table2 className="size-4" />}
          {showTable ? "Xem biểu đồ" : "Xem dạng bảng"}
        </button>
      </header>

      {legend && legend.length > 1 && !showTable ? (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-0 w-5 rounded"
                style={{ borderTop: `3px ${l.dashed ? "dashed" : "solid"} ${l.color}` }}
              />
              {l.label}
            </li>
          ))}
        </ul>
      ) : null}

      {showTable ? (
        <div className="max-h-72 overflow-auto rounded-xl ring-1 ring-line">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-canvas text-xs text-muted">
              <tr>
                {table.columns.map((c) => (
                  <th key={c} className="px-3 py-2 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j} className={`px-3 py-2 ${j > 0 ? "tabular-nums" : ""}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 w-full">{children}</div>
      )}
    </section>
  );
}

// Tooltip dùng chung: nền trắng, chữ màu văn bản; ô màu nhỏ cạnh tên chuỗi mang nhận diện.
export function ChartTooltip({
  active,
  label,
  payload,
  formatLabel,
  formatValue = (v) => String(v),
}: {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | null; color?: string; dataKey?: string | number; type?: string }[];
  formatLabel?: (label: string | number) => string;
  formatValue?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  // Bỏ mục ẩn (tooltipType="none", vd. vùng tô dưới đường) và mục trùng chuỗi — Recharts 3 vẫn đưa chúng vào payload.
  const seen = new Set<string>();
  const items = payload.filter((p) => {
    if (p.value === null || p.value === undefined || p.type === "none") return false;
    const key = `${String(p.dataKey)}|${p.name ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!items.length) return null;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-md ring-1 ring-line">
      <div className="mb-1 font-medium text-ink">{label !== undefined && formatLabel ? formatLabel(label) : label}</div>
      {items.map((p) => (
        <div key={`${String(p.dataKey)}|${p.name ?? ""}`} className="flex items-center gap-2 text-ink">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}:</span>
          <span className="font-medium tabular-nums">{formatValue(p.value as number)}</span>
        </div>
      ))}
    </div>
  );
}
