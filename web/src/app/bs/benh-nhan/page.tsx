import { Suspense } from "react";
import { Content, Hero } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { getFormerPatients, getPatientRows } from "@/lib/staffData";
import { vnDateKey } from "@/lib/labels";
import PatientsBrowser from "./PatientsBrowser";

type Search = Promise<{ tab?: string; loc?: string; q?: string }>;
const FILTERS = ["attention", "upcoming", "pending"] as const;

// Bệnh nhân của bác sĩ: bảng đang theo dõi (tìm / lọc / sắp xếp, bấm để mở hồ sơ) + cựu bệnh nhân.
export default function StaffPatientsPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <Hero title="Thông tin bệnh nhân" subtitle="Người cao tuổi bạn đang theo dõi" />
      <Suspense fallback={<PatientsSkeleton />}>
        <PatientsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PatientsContent({ searchParams }: { searchParams: Search }) {
  await requireStaff();
  const [params, patients, former] = await Promise.all([searchParams, getPatientRows(vnDateKey()), getFormerPatients()]);
  const filter =
    params.tab === "cu" ? "former" : FILTERS.includes(params.loc as (typeof FILTERS)[number]) ? (params.loc as (typeof FILTERS)[number]) : "all";
  // key: chuyển URL (vd. sau khi kết thúc điều trị → ?tab=cu) thì dựng lại với bộ lọc mới.
  return <PatientsBrowser key={filter} patients={patients} former={former} initialFilter={filter} initialQuery={params.q ?? ""} />;
}

// Khung chờ giống bố cục thật (thanh tìm kiếm, bộ lọc, các hàng) — trang không nhảy khi dữ liệu về.
function PatientsSkeleton() {
  return (
    <Content>
      <section className="card">
        <div className="flex gap-2 border-b border-line p-3">
          <div className="h-9 flex-1 animate-pulse rounded-lg bg-line/50" />
          <div className="h-9 w-48 animate-pulse rounded-lg bg-line/50" />
        </div>
        <div className="flex gap-5 border-b border-line px-4 py-3">
          {[96, 72, 104, 72, 96].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-4 animate-pulse rounded bg-line/60" />
          ))}
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-line/60" />
              <div className="h-3.5 w-44 animate-pulse rounded bg-line/60" />
              <div className="hidden h-3.5 w-40 animate-pulse rounded bg-line/50 lg:block" />
              <div className="hidden h-3.5 w-36 animate-pulse rounded bg-line/50 lg:block" />
              <div className="ml-auto h-5 w-24 animate-pulse rounded bg-line/50" />
            </div>
          ))}
        </div>
      </section>
    </Content>
  );
}
