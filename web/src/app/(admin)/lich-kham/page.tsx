import { Suspense } from "react";
import { CalendarX2 } from "lucide-react";
import { Content, EmptyState, Hero, ListSkeleton, SegmentedTabs } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAppointments } from "@/lib/data";
import { groupByDay } from "@/lib/appointmentGroups";
import { vnDateKey, type AppointmentStatus } from "@/lib/labels";
import AppointmentTree from "@/components/appointments/AppointmentTree";


const TABS: { key: AppointmentStatus | "ALL"; label: string }[] = [
  { key: "REQUESTED", label: "Chờ duyệt" },
  { key: "UPCOMING", label: "Sắp tới" },
  { key: "ALL", label: "Tất cả từ hôm nay" },
  { key: "COMPLETED", label: "Đã khám" },
  { key: "REJECTED", label: "Không được nhận" },
];

type Search = Promise<{ "trang-thai"?: string }>;

// Lịch khám toàn viện, nhóm theo ngày (giống màn Lịch khám của bác sĩ trên app); yêu cầu chờ duyệt có nút Duyệt.
export default function AppointmentsPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <Hero title="Lịch khám" subtitle="Lịch khám và yêu cầu đặt lịch của bệnh nhân" />
      <Suspense fallback={<ListSkeleton />}>
        <AppointmentsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AppointmentsContent({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const params = await searchParams;
  const tab = TABS.find((t) => t.key === params["trang-thai"])?.key ?? "REQUESTED";
  const status = tab === "ALL" ? undefined : tab;
  // Chờ duyệt / sắp tới / tất cả: chỉ từ hôm nay; trạng thái đã kết thúc: xem cả quá khứ.
  const from = !status || status === "REQUESTED" || status === "UPCOMING" ? vnDateKey() : undefined;
  const appointments = await getAppointments({ status, from });

  return (
    <Content overlap>
      <SegmentedTabs items={TABS.map((t) => ({ href: `/lich-kham?trang-thai=${t.key}`, label: t.label, active: t.key === tab }))} />

      {appointments.length === 0 ? (
        <EmptyState Icon={CalendarX2}>{tab === "REQUESTED" ? "Không có yêu cầu nào chờ duyệt." : "Không có lịch khám nào."}</EmptyState>
      ) : (
        <AppointmentTree groups={groupByDay(appointments)} />
      )}
    </Content>
  );
}
