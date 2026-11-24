import { Suspense } from "react";
import { CalendarX2 } from "lucide-react";
import { Content, EmptyState, Hero, ListSkeleton, SegmentedTabs } from "@/components/ui";
import AppointmentTree from "@/components/appointments/AppointmentTree";
import { requireStaff } from "@/lib/auth";
import { getAppointments } from "@/lib/data";
import { groupByDay } from "@/lib/appointmentGroups";
import { vnDateKey, type AppointmentStatus } from "@/lib/labels";

const TABS: { key: AppointmentStatus | "ALL"; label: string }[] = [
  { key: "REQUESTED", label: "Chờ duyệt" },
  { key: "UPCOMING", label: "Sắp tới" },
  { key: "ALL", label: "Tất cả từ hôm nay" },
  { key: "COMPLETED", label: "Đã khám" },
  { key: "REJECTED", label: "Không được nhận" },
];

type Search = Promise<{ "trang-thai"?: string }>;

// Lịch khám của bác sĩ: chỉ lịch gửi tới bác sĩ này (hoặc chưa gắn bác sĩ) của bệnh nhân đang phụ trách.
export default function StaffAppointmentsPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <Hero title="Lịch khám" subtitle="Duyệt yêu cầu đặt lịch và theo dõi lịch khám của bệnh nhân" />
      <Suspense fallback={<ListSkeleton />}>
        <AppointmentsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AppointmentsContent({ searchParams }: { searchParams: Search }) {
  const me = await requireStaff();
  const params = await searchParams;
  const tab = TABS.find((t) => t.key === params["trang-thai"])?.key ?? "REQUESTED";
  const status = tab === "ALL" ? undefined : tab;
  const from = !status || status === "REQUESTED" || status === "UPCOMING" ? vnDateKey() : undefined;
  const appointments = await getAppointments({ status, from, staffId: me.id });

  return (
    <Content>
      <SegmentedTabs items={TABS.map((t) => ({ href: `/bs/lich-kham?trang-thai=${t.key}`, label: t.label, active: t.key === tab }))} />
      {appointments.length === 0 ? (
        <EmptyState Icon={CalendarX2}>{tab === "REQUESTED" ? "Không có yêu cầu nào chờ duyệt." : "Không có lịch khám nào."}</EmptyState>
      ) : (
        <AppointmentTree groups={groupByDay(appointments)} patientHref="/bs/benh-nhan" showDoctor={false} />
      )}
    </Content>
  );
}
