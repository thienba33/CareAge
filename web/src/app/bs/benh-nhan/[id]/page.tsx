import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, BellRing, CalendarDays, Phone, Pill } from "lucide-react";
import { Badge, Content, EmptyState, Hero, SectionTitle } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { getPatientDetail, type PatientDetail } from "@/lib/staffData";
import { APPOINTMENT_STATUS_ICON } from "@/lib/statusIcons";
import {
  ALERT_SEVERITY_CLASS,
  ALERT_SEVERITY_LABEL,
  APPOINTMENT_STATUS_CLASS,
  APPOINTMENT_STATUS_LABEL,
  CONDITION_CATEGORY_LABEL,
  CONDITION_STATUS_LABEL,
  GENDER_LABEL,
  METRIC_LABEL,
  METRIC_TYPES,
  METRIC_UNIT,
  RELATIONSHIP_LABEL,
  ageFrom,
  formatDate,
  formatDateTime,
  formatMetricValue,
  type ConditionCategory,
} from "@/lib/labels";
import MetricChart from "./MetricChart";
import EndTreatmentButton from "./EndTreatmentButton";

type Params = Promise<{ id: string }>;

// Hồ sơ một bệnh nhân (gộp Thông tin + Sức khỏe như app bác sĩ): chỉ số + biểu đồ, lịch khám, cảnh báo;
// cột phải: thông tin cá nhân, bệnh nền, thuốc, người nhà. Không còn phụ trách → 404.
export default function PatientPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PatientContent params={params} />
    </Suspense>
  );
}

async function PatientContent({ params }: { params: Params }) {
  await requireStaff();
  const { id } = await params;
  const p = await getPatientDetail(id);
  if (!p) notFound();

  const age = ageFrom(p.profile?.dateOfBirth ?? null);
  const subtitle = [
    `Mã ${p.code}`,
    age !== null ? `${age} tuổi` : null,
    p.profile?.gender ? GENDER_LABEL[p.profile.gender] : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="px-6 pt-4 md:px-8">
        <Link href="/bs/benh-nhan" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Danh sách bệnh nhân
        </Link>
      </div>
      <Hero title={p.name} subtitle={subtitle}>
        <EndTreatmentButton elderlyId={p.id} elderlyName={p.name} />
      </Hero>
      <Content>
        <div className="grid items-start gap-5 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            <LatestMetrics p={p} />
            {p.metrics.length > 0 ? <MetricChart metrics={p.metrics} /> : null}
            <Appointments p={p} />
            <Alerts p={p} />
          </div>
          <aside className="space-y-5">
            <PersonalInfo p={p} />
            <Conditions p={p} />
            <Medications p={p} />
            <Family p={p} />
          </aside>
        </div>
      </Content>
    </>
  );
}

// Lần đo gần nhất của từng chỉ số.
function LatestMetrics({ p }: { p: PatientDetail }) {
  const latest = METRIC_TYPES.map((t) => ({ type: t, m: p.metrics.findLast((m) => m.type === t) })).filter((x) => x.m);
  return (
    <section className="space-y-3">
      <SectionTitle>Chỉ số sức khỏe</SectionTitle>
      {latest.length === 0 ? (
        <EmptyState Icon={Activity}>Chưa có lần đo nào trong 90 ngày qua.</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {latest.map(({ type, m }) => (
            <div key={type} className="card p-4">
              <div className="text-xs text-muted">{METRIC_LABEL[type]}</div>
              <div className="mt-1 text-xl font-semibold text-ink tabular-nums">
                {formatMetricValue(m!.value)} <span className="text-xs font-normal text-muted">{METRIC_UNIT[type]}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">{formatDateTime(m!.recordedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Appointments({ p }: { p: PatientDetail }) {
  return (
    <section className="space-y-3">
      <SectionTitle>Lịch khám</SectionTitle>
      {p.appointments.length === 0 ? (
        <EmptyState Icon={CalendarDays}>Chưa có lịch khám nào.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden card">
          {p.appointments.slice(0, 8).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <div className="w-36 shrink-0 whitespace-nowrap tabular-nums">
                <span className="font-semibold text-ink">{a.time}</span> <span className="text-muted">{formatDate(a.date)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink">{a.reason ?? "Tái khám"}</div>
                {a.doctor ? <div className="truncate text-xs text-muted">{a.doctor}</div> : null}
              </div>
              <Badge className={APPOINTMENT_STATUS_CLASS[a.status]} Icon={APPOINTMENT_STATUS_ICON[a.status]}>
                {APPOINTMENT_STATUS_LABEL[a.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Alerts({ p }: { p: PatientDetail }) {
  return (
    <section className="space-y-3">
      <SectionTitle>Cảnh báo 30 ngày qua</SectionTitle>
      {p.alerts.length === 0 ? (
        <EmptyState Icon={BellRing}>Không có cảnh báo nào.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden card">
          {p.alerts.map((a) => (
            <li key={a.id} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={ALERT_SEVERITY_CLASS[a.severity]}>{ALERT_SEVERITY_LABEL[a.severity]}</Badge>
                <span className="font-medium text-ink">{a.title}</span>
              </div>
              <p className="text-muted">{a.message}</p>
              <p className="text-xs text-muted">{formatDateTime(a.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">{title}</h2>
      <div className="px-4 py-3 text-sm">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 py-1">
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-ink">{value || <span className="text-muted">—</span>}</dd>
    </div>
  );
}

function PersonalInfo({ p }: { p: PatientDetail }) {
  const hp = p.profile;
  return (
    <SideCard title="Thông tin cá nhân">
      <dl>
        <Row label="Ngày sinh" value={hp?.dateOfBirth ? formatDate(hp.dateOfBirth) : null} />
        <Row label="Điện thoại" value={p.phone} />
        <Row label="Chiều cao" value={hp?.heightCm ? `${hp.heightCm} cm` : null} />
        <Row label="Cân nặng" value={hp?.weightKg ? `${hp.weightKg} kg` : null} />
        <Row label="Nhóm máu" value={hp?.bloodType && hp.bloodType !== "UNKNOWN" ? hp.bloodType : null} />
        <Row label="Địa chỉ" value={hp?.address} />
      </dl>
    </SideCard>
  );
}

const CATEGORIES: ConditionCategory[] = ["CHRONIC", "HISTORY", "ALLERGY"];

function Conditions({ p }: { p: PatientDetail }) {
  return (
    <SideCard title="Bệnh nền, tiền sử, dị ứng">
      {p.conditions.length === 0 ? (
        <p className="text-muted">Chưa khai báo.</p>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((c) => {
            const items = p.conditions.filter((x) => x.category === c);
            if (items.length === 0) return null;
            return (
              <div key={c}>
                <div className="mb-1 text-xs font-medium text-muted">{CONDITION_CATEGORY_LABEL[c]}</div>
                <ul className="space-y-1">
                  {items.map((x) => (
                    <li key={x.id} className="flex items-start justify-between gap-2">
                      <span className="text-ink">{x.name}</span>
                      <span className="shrink-0 text-xs text-muted">{CONDITION_STATUS_LABEL[x.status]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </SideCard>
  );
}

function Medications({ p }: { p: PatientDetail }) {
  return (
    <SideCard title="Thuốc đang dùng">
      {p.medications.length === 0 ? (
        <p className="text-muted">Không có thuốc đang dùng.</p>
      ) : (
        <ul className="space-y-3">
          {p.medications.map((m) => (
            <li key={m.id} className="flex gap-3">
              <Pill aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="font-medium text-ink">
                  {m.name} <span className="font-normal text-muted">{`${m.dosage} ${m.unit}`}</span>
                </div>
                <div className="text-xs text-muted">Uống lúc {m.times.map((t) => t.slice(0, 5)).join(", ")}</div>
                {m.instructions ? <div className="text-xs text-muted">{m.instructions}</div> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SideCard>
  );
}

function Family({ p }: { p: PatientDetail }) {
  const people = [
    ...p.caregivers.map((c) => ({ key: `cg-${c.name}`, name: c.name, phone: c.phone, sub: RELATIONSHIP_LABEL[c.relationship] ?? c.relationship })),
    ...p.contacts.map((c) => ({ key: c.id, name: c.name, phone: c.phone, sub: `Liên hệ khẩn cấp, ${c.relationship}` })),
  ];
  return (
    <SideCard title="Người nhà và liên hệ khẩn cấp">
      {people.length === 0 ? (
        <p className="text-muted">Chưa có.</p>
      ) : (
        <ul className="space-y-3">
          {people.map((x) => (
            <li key={x.key} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-ink">{x.name}</div>
                <div className="truncate text-xs text-muted">{x.sub}</div>
              </div>
              {x.phone ? (
                <a href={`tel:${x.phone}`} className="flex shrink-0 items-center gap-1 text-xs text-primary-dark hover:underline">
                  <Phone aria-hidden className="size-3.5" />
                  {x.phone}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SideCard>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="px-6 pt-10 md:px-8">
        <div className="h-[84px] animate-pulse rounded-2xl bg-primary/30" />
      </div>
      <Content>
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-24 animate-pulse card" />
              ))}
            </div>
            <div className="h-80 animate-pulse card" />
          </div>
          <div className="space-y-5">
            <div className="h-56 animate-pulse card" />
            <div className="h-40 animate-pulse card" />
          </div>
        </div>
      </Content>
    </>
  );
}
