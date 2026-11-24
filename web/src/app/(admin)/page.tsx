import { Suspense } from "react";
import { Content, Hero, ListSkeleton } from "@/components/ui";
import KpiTile from "@/components/dashboard/KpiTile";
import {
  AdherenceChart,
  AlertsSeverityChart,
  AppointmentStatusChart,
  BookingsByDayChart,
  NewElderlyChart,
  StaffWorkloadChart,
} from "@/components/dashboard/Charts";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data";

// Trang chủ quản trị dạng dashboard: ô chỉ số so với tháng trước (nổi trên phần đầu) và các biểu đồ.
export default function OverviewPage() {
  return (
    <>
      <Hero title="Tổng quan" subtitle="Số liệu tháng này so với tháng trước" />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

const monthName = (iso: string) => `tháng ${Number(iso.slice(5, 7))}`;

async function DashboardContent() {
  await requireAdmin();
  const s = await getDashboardStats();
  const k = s.kpis;
  const prev = monthName(s.prevMonth);

  return (
    <Content overlap>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line/70 bg-line shadow-card sm:grid-cols-2 xl:grid-cols-5">
        <KpiTile
          label="Bệnh nhân mới tháng này"
          value={k.newElderly.current}
          previous={k.newElderly.previous}
          previousLabel={prev}
          note={`Tổng ${k.newElderly.total.toLocaleString("vi-VN")} người cao tuổi`}
        />
        <KpiTile
          label="Lượt đặt lịch"
          value={k.bookings.current}
          previous={k.bookings.previous}
          previousLabel={prev}
        />
        <KpiTile
          label="Lượt khám hoàn thành"
          value={k.completed.current}
          previous={k.completed.previous}
          previousLabel={prev}
        />
        <KpiTile
          label="Cảnh báo sức khỏe"
          value={k.alerts.current}
          previous={k.alerts.previous}
          previousLabel={prev}
          upIsGood={false}
          note={k.alerts.urgentCurrent > 0 ? `${k.alerts.urgentCurrent} cảnh báo mức cao / nguy hiểm` : "Không có cảnh báo mức cao"}
        />
        <KpiTile
          label="Uống thuốc đúng giờ (7 ngày)"
          value={k.adherence.current}
          unit="%"
          previous={k.adherence.previous}
          previousLabel="7 ngày trước đó"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <NewElderlyChart data={s.newElderlyByMonth} month={s.month} />
        <BookingsByDayChart data={s.bookingsByDay} month={s.month} prevMonth={s.prevMonth} />
        <AppointmentStatusChart data={s.appointmentStatus} />
        <AlertsSeverityChart data={s.alertsBySeverity} month={s.month} prevMonth={s.prevMonth} />
        <StaffWorkloadChart data={s.staffWorkload} />
        <AdherenceChart data={s.adherenceByDay} />
      </div>
    </Content>
  );
}
