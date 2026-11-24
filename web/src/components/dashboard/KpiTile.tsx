import type { LucideIcon } from "lucide-react";

// Ô chỉ số: nhãn · giá trị · so sánh với kỳ trước (dấu + %, tên kỳ).
// Màu phần so sánh = chiều thay đổi × tăng là tốt hay xấu (vd. cảnh báo tăng là xấu → đỏ).
// Không truyền previousLabel: ô không so sánh, chỉ hiện ghi chú (note).
export default function KpiTile({
  label,
  value,
  unit,
  previous,
  previousLabel,
  upIsGood = true,
  note,
}: {
  label: string;
  value: number | null;
  unit?: string;
  previous?: number | null;
  previousLabel?: string;
  upIsGood?: boolean;
  note?: string;
  Icon?: LucideIcon;
  iconTone?: string;
}) {
  const compare = previousLabel !== undefined;
  const hasCompare = compare && value !== null && previous !== null && previous !== undefined;
  const diff = hasCompare ? value - previous : 0;
  const pct = hasCompare && previous !== 0 ? Math.round((diff / previous) * 100) : null;
  const good = diff === 0 ? null : diff > 0 === upIsGood;
  const tone = good === null ? "text-muted" : good ? "text-success" : "text-danger";
  const change = diff === 0 ? "Không đổi" : pct === null ? `${diff > 0 ? "+" : ""}${diff}` : `${diff > 0 ? "+" : ""}${pct}%`;

  return (
    <div className="flex flex-col gap-1 bg-white px-5 py-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-semibold text-ink tabular-nums">
        {value === null ? "—" : value.toLocaleString("vi-VN")}
        {unit && value !== null ? <span className="text-base font-normal text-muted">{unit}</span> : null}
      </span>
      {compare ? (
        <span className="text-xs text-muted">
          {hasCompare ? (
            <>
              <span className={`font-medium ${tone}`}>{change}</span> so với {previousLabel} ({previous?.toLocaleString("vi-VN")}
              {unit ?? ""})
            </>
          ) : (
            "Chưa có dữ liệu kỳ trước"
          )}
        </span>
      ) : null}
      {note ? <span className="text-xs text-muted">{note}</span> : null}
    </div>
  );
}
