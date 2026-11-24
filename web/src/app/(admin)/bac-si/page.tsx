import { Suspense } from "react";
import { Content, Hero } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAssignments, getStaff } from "@/lib/data";
import StaffBrowser from "./StaffBrowser";


type Search = Promise<{ bs?: string }>;

// Bác sĩ & phân công: chọn một bác sĩ để xem hồ sơ và bệnh nhân đang phụ trách, phân công / kết thúc phân công.
export default function StaffPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <Hero title="Bác sĩ & phân công" subtitle="Hồ sơ chuyên môn và bệnh nhân được phân công" />
      <Suspense fallback={<StaffSkeleton />}>
        <StaffContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function StaffContent({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const [params, staff, { elderly }] = await Promise.all([searchParams, getStaff(), getAssignments()]);
  return (
    <StaffBrowser
      staff={staff}
      elderly={elderly.map((e) => ({ id: e.id, code: e.code, name: e.name, doctorCount: e.active.length }))}
      initialId={params.bs ?? null}
    />
  );
}

// Khung chờ đúng bố cục 2 cột.
function StaffSkeleton() {
  return (
    <Content overlap>
      <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr]">
        <div className="space-y-px overflow-hidden card">
          <div className="p-3">
            <div className="h-10 animate-pulse rounded-lg bg-line/50" />
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="size-9 animate-pulse rounded-full bg-line/60" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 animate-pulse rounded bg-line/60" />
                <div className="h-3 w-24 animate-pulse rounded bg-line/60" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <div className="h-44 animate-pulse card" />
          <div className="h-64 animate-pulse card" />
        </div>
      </div>
    </Content>
  );
}
