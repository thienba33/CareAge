import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar, Badge, Content, Hero } from "@/components/ui";
import KpiTile from "@/components/dashboard/KpiTile";
import { AlertsByPatientChart, UpcomingByDayChart } from "@/components/dashboard/StaffCharts";
import ReviewButton from "@/components/appointments/ReviewButton";
import { requireStaff } from "@/lib/auth";
import type { AppointmentRow } from "@/lib/data";
import { getFormerPatients, getPatientSummaries, getStaffOverview, type PatientSummary } from "@/lib/staffData";
import { APPOINTMENT_STATUS_ICON } from "@/lib/statusIcons";
import {
  ALERT_SEVERITY_CLASS,
  ALERT_SEVERITY_LABEL,
  APPOINTMENT_STATUS_CLASS,
  APPOINTMENT_STATUS_LABEL,
  formatDate,
  vnDateKey,
  type AlertSeverity,
} from "@/lib/labels";

const WEEKDAY = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const SEVERITY_RANK: Record<AlertSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

// Trang chủ của bác sĩ dạng dashboard: ô số liệu (có so sánh kỳ trước), việc cần làm (lịch gần nhất + bệnh nhân
// cần chú ý), biểu đồ lịch khám 14 ngày tới và cảnh báo theo bệnh nhân.
export default function StaffHomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <StaffHome />
    </Suspense>
  );
}

async function StaffHome() {
  const me = await requireStaff();
  const [overview, patients, former] = await Promise.all([
    getStaffOverview(me.id),
    getPatientSummaries(vnDateKey()),
    getFormerPatients(),
  ]);

  const pending = patients.reduce((n, p) => n + p.pendingRequests, 0);
  const today = overview.upcomingByDay[0];
  const confirmed14 = overview.upcomingByDay.reduce((n, d) => n + d.confirmed, 0);
  const attention = patients
    .filter((p) => p.latestAlert || p.pendingRequests > 0)
    .sort(
      (a, b) =>
        (b.latestAlert ? SEVERITY_RANK[b.latestAlert.severity] : 0) - (a.latestAlert ? SEVERITY_RANK[a.latestAlert.severity] : 0) ||
        b.pendingRequests - a.pendingRequests
    );
  const d = new Date(`${overview.today}T00:00:00Z`);

  return (
    <>
      <Hero title={`Xin chào, ${me.name}`} subtitle={`${WEEKDAY[d.getUTCDay()]}, ${formatDate(overview.today)}`} />
      <Content>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line/70 bg-line shadow-card sm:grid-cols-2 xl:grid-cols-5">
          <KpiTile label="Bệnh nhân đang theo dõi" value={patients.length} note={`${former.length} cựu bệnh nhân`} />
          <KpiTile
            label="Lịch khám hôm nay"
            value={today.confirmed}
            note={confirmed14 > 0 ? `${confirmed14} lịch đã xác nhận trong 14 ngày tới` : "Chưa có lịch trong 14 ngày tới"}
          />
          <KpiTile label="Yêu cầu chờ duyệt" value={pending} note={pending > 0 ? "Cần xác nhận hoặc từ chối" : "Không có yêu cầu mới"} />
          <KpiTile
            label="Lượt khám tháng này"
            value={overview.completed.current}
            previous={overview.completed.previous}
            previousLabel="cùng kỳ tháng trước"
          />
          <KpiTile
            label="Cảnh báo 30 ngày"
            value={overview.alerts.current}
            previous={overview.alerts.previous}
            previousLabel="30 ngày trước đó"
            upIsGood={false}
            note={overview.alerts.urgent > 0 ? `${overview.alerts.urgent} cảnh báo mức cao / nghiêm trọng` : undefined}
          />
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-2">
          <Panel title="Lịch khám gần nhất" href="/bs/lich-kham?trang-thai=ALL" empty="Chưa có lịch khám sắp tới.">
            {overview.next.map((a) => (
              <AppointmentLine key={a.id} a={a} />
            ))}
          </Panel>
          <Panel title="Bệnh nhân cần chú ý" href="/bs/benh-nhan" empty="Không có bệnh nhân nào cần chú ý.">
            {attention.slice(0, 6).map((p) => (
              <AttentionLine key={p.id} p={p} />
            ))}
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <UpcomingByDayChart data={overview.upcomingByDay} />
          <AlertsByPatientChart data={overview.alertsByPatient} />
        </div>
      </Content>
    </>
  );
}

// Khung danh sách: tiêu đề + "Xem tất cả"; trống thì một dòng chữ nhỏ (không khung lớn).
function Panel({ title, href, empty, children }: { title: string; href: string; empty: string; children: ReactNode[] }) {
  return (
    <section className="overflow-hidden card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <Link href={href} className="text-sm text-primary-dark hover:underline">
          Xem tất cả
        </Link>
      </header>
      {children.length === 0 ? <p className="px-5 py-8 text-center text-sm text-muted">{empty}</p> : <div className="divide-y divide-line">{children}</div>}
    </section>
  );
}

function AppointmentLine({ a }: { a: AppointmentRow }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="w-20 shrink-0">
        <div className="text-base font-semibold text-ink tabular-nums">{a.time}</div>
        <div className="text-xs text-muted tabular-nums">{formatDate(a.date).slice(0, 5)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/bs/benh-nhan/${a.patientId}`} className="block truncate text-sm font-medium text-ink hover:text-primary-dark hover:underline">
          {a.patientName}
        </Link>
        <p className="truncate text-sm text-muted">{a.reason ?? "Tái khám"}</p>
      </div>
      {a.status === "REQUESTED" ? (
        <ReviewButton appointment={{ id: a.id, patientName: a.patientName, time: a.time, date: formatDate(a.date) }} />
      ) : (
        <Badge className={APPOINTMENT_STATUS_CLASS[a.status]} Icon={APPOINTMENT_STATUS_ICON[a.status]}>
          {APPOINTMENT_STATUS_LABEL[a.status]}
        </Badge>
      )}
    </div>
  );
}

function AttentionLine({ p }: { p: PatientSummary }) {
  return (
    <Link href={`/bs/benh-nhan/${p.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-canvas/60">
      <Avatar name={p.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{p.name}</div>
        <p className="truncate text-xs text-muted">
          {p.latestAlert ? p.latestAlert.title : `${p.pendingRequests} yêu cầu đặt lịch chờ duyệt`}
        </p>
      </div>
      {p.latestAlert ? (
        <Badge className={ALERT_SEVERITY_CLASS[p.latestAlert.severity]}>{ALERT_SEVERITY_LABEL[p.latestAlert.severity]}</Badge>
      ) : (
        <Badge className="bg-warning-light text-warning-dark">Chờ duyệt</Badge>
      )}
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
    </Link>
  );
}

function HomeSkeleton() {
  return (
    <>
      <div className="px-6 pt-4 md:px-8">
        <div className="h-[84px] animate-pulse rounded-2xl bg-primary/30" />
      </div>
      <Content>
        <div className="h-[104px] animate-pulse card" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-72 animate-pulse card" />
          <div className="h-72 animate-pulse card" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-80 animate-pulse card" />
          <div className="h-80 animate-pulse card" />
        </div>
      </Content>
    </>
  );
}
