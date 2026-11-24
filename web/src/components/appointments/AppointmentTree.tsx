import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { STATUS_COLOR } from "@/lib/chartColors";
import { APPOINTMENT_STATUS_CLASS, APPOINTMENT_STATUS_LABEL, formatDate } from "@/lib/labels";
import { APPOINTMENT_STATUS_ICON } from "@/lib/statusIcons";
import type { AppointmentRow } from "@/lib/data";
import ReviewButton from "./ReviewButton";

// Lịch khám dạng cây dọc: một trục chạy từ trên xuống; mỗi ngày là một nút lớn trên trục,
// mỗi lịch là một nhánh rẽ ra (chấm màu trạng thái trên trục → gạch ngang → thẻ lịch).
// Dùng chung cho quản trị và bác sĩ. patientHref (khu bác sĩ): tên bệnh nhân bấm được, mở hồ sơ; showDoctor=false khi là lịch của chính bác sĩ.
export default function AppointmentTree({
  groups,
  patientHref,
  showDoctor = true,
}: {
  groups: { key: string; label: string | null; date: string; items: AppointmentRow[] }[];
  patientHref?: string;
  showDoctor?: boolean;
}) {
  return (
    <ol className="relative space-y-6 pt-2">
      {/* Trục dọc */}
      <span aria-hidden className="absolute top-6 bottom-4 left-[15px] w-0.5 rounded-full bg-primary/25" />

      {groups.map((g) => (
        <li key={g.key} className="relative">
          {/* Nút ngày */}
          <div className="relative flex items-center gap-3">
            <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-white ring-4 ring-canvas">
              <CalendarDays aria-hidden className="size-4" />
            </span>
            <h2 className="flex items-baseline gap-2 text-sm">
              {g.label ? <span className="font-semibold text-primary-dark">{g.label}</span> : null}
              <span className={g.label ? "text-muted" : "font-semibold text-ink"}>{g.date}</span>
            </h2>
            {/* Số lịch trong ngày: cuối dòng, nối bằng đường kẻ mảnh */}
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="text-xs text-muted tabular-nums">{g.items.length} lịch khám</span>
          </div>

          {/* Các nhánh lịch khám của ngày */}
          <ol className="mt-3 space-y-3">
            {g.items.map((a) => (
              <li key={a.id} className="relative pl-12">
                {/* Chấm trạng thái trên trục + gạch ngang nối sang thẻ */}
                <span
                  aria-hidden
                  className="absolute top-6 left-[10px] z-10 size-3 rounded-full ring-4 ring-canvas"
                  style={{ backgroundColor: STATUS_COLOR[a.status] }}
                />
                <span aria-hidden className="absolute top-[29px] left-[22px] h-0.5 w-[26px] bg-primary/25" />
                <AppointmentNode a={a} patientHref={patientHref} showDoctor={showDoctor} />
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function AppointmentNode({ a, patientHref, showDoctor }: { a: AppointmentRow; patientHref?: string; showDoctor: boolean }) {
  return (
    <article className="card flex flex-wrap items-start gap-x-4 gap-y-2 p-4 text-sm">
      <div className="w-14 shrink-0">
        <div className="text-base font-semibold text-ink tabular-nums">{a.time}</div>
      </div>

      <div className="flex min-w-60 flex-1 items-start gap-3">
        <Avatar name={a.patientName} size="sm" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {patientHref ? (
              <Link href={`${patientHref}/${a.patientId}`} className="font-medium text-ink hover:text-primary-dark hover:underline">
                {a.patientName}
              </Link>
            ) : (
              <span className="font-medium text-ink">{a.patientName}</span>
            )}
            <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-muted">{a.patientCode}</span>
          </div>
          <div className="text-ink">{a.reason ?? "Tái khám"}</div>
          {showDoctor && a.doctor ? <div className="text-xs text-muted">{a.doctor}</div> : null}
          {a.note ? <p className="text-muted">Ghi chú: {a.note}</p> : null}
          {a.staffNote ? (
            <p className="rounded-lg bg-primary-light/60 px-2.5 py-1.5 text-ink">
              <span className="font-medium text-primary-dark">Lời dặn:</span> {a.staffNote}
            </p>
          ) : null}
          {a.status === "REJECTED" && a.rejectReason ? <p className="text-danger">Lý do: {a.rejectReason}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-3 self-center">
        {/* Yêu cầu chờ duyệt: chỉ cần nút Duyệt (không lặp nhãn "Chờ xác nhận"); trạng thái khác: hiện nhãn. */}
        {a.status === "REQUESTED" ? (
          <ReviewButton appointment={{ id: a.id, patientName: a.patientName, time: a.time, date: formatDate(a.date) }} />
        ) : (
          <Badge className={APPOINTMENT_STATUS_CLASS[a.status]} Icon={APPOINTMENT_STATUS_ICON[a.status]}>
            {APPOINTMENT_STATUS_LABEL[a.status]}
          </Badge>
        )}
      </div>
    </article>
  );
}
