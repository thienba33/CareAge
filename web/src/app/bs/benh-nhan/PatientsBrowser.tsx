"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, BellRing, CalendarClock, ChevronRight, ClipboardList, Search, UserRound, X } from "lucide-react";
import { Avatar, Badge, Content } from "@/components/ui";
import {
  ALERT_SEVERITY_CLASS,
  ALERT_SEVERITY_LABEL,
  GENDER_LABEL,
  METRIC_LABEL,
  METRIC_UNIT,
  ageFrom,
  formatDate,
  formatDateTime,
  formatMetricValue,
  type AlertSeverity,
} from "@/lib/labels";
import type { FormerPatient, PatientRow } from "@/lib/staffData";

type Filter = "all" | "attention" | "upcoming" | "pending" | "former";
type Sort = "attention" | "next" | "name" | "age";
const SORT_LABEL: Record<Sort, string> = {
  attention: "Cần chú ý trước",
  next: "Lịch khám gần nhất",
  name: "Tên A–Z",
  age: "Tuổi cao nhất",
};
const SEVERITY_RANK: Record<AlertSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

// Bỏ dấu tiếng Việt để tìm "tam" ra "Tám".
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
const givenName = (name: string) => normalize(name.trim().split(/\s+/).pop() ?? name);
const nextKey = (p: PatientRow) => (p.nextAppointment ? `${p.nextAppointment.date} ${p.nextAppointment.time}` : "9999");
const urgency = (p: PatientRow) => (p.latestAlert ? SEVERITY_RANK[p.latestAlert.severity] * 10 : 0) + (p.pendingRequests > 0 ? 5 : 0);

// Giữ bộ lọc trên URL (tải lại vẫn đúng) mà không gọi lại server.
function syncUrl(filter: Filter, q: string) {
  const sp = new URLSearchParams();
  if (filter === "former") sp.set("tab", "cu");
  else if (filter !== "all") sp.set("loc", filter);
  if (q.trim()) sp.set("q", q.trim());
  const s = sp.toString();
  window.history.replaceState(null, "", `/bs/benh-nhan${s ? `?${s}` : ""}`);
}

// Bảng bệnh nhân của bác sĩ: tìm (tên, mã, SĐT, bệnh nền), lọc theo tình trạng, sắp xếp; bấm một dòng để mở hồ sơ.
// Dữ liệu tải một lần trên server; lọc / sắp xếp làm ngay trên trình duyệt.
export default function PatientsBrowser({
  patients,
  former,
  initialFilter,
  initialQuery,
}: {
  patients: PatientRow[];
  former: FormerPatient[];
  initialFilter: Filter;
  initialQuery: string;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("attention");
  const deferredQuery = useDeferredValue(query);

  const counts = {
    all: patients.length,
    attention: patients.filter((p) => p.latestAlert).length,
    upcoming: patients.filter((p) => p.nextAppointment).length,
    pending: patients.filter((p) => p.pendingRequests > 0).length,
    former: former.length,
  };

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery);
    const list = patients.filter(
      (p) =>
        (filter === "all" ||
          (filter === "attention" && p.latestAlert) ||
          (filter === "upcoming" && p.nextAppointment) ||
          (filter === "pending" && p.pendingRequests > 0)) &&
        (!q ||
          normalize(p.name).includes(q) ||
          normalize(p.code).includes(q) ||
          (p.phone ?? "").includes(q) ||
          p.conditions.some((c) => normalize(c).includes(q)))
    );
    return list.sort((a, b) => {
      if (sort === "name") return givenName(a.name).localeCompare(givenName(b.name), "vi");
      if (sort === "next") return nextKey(a).localeCompare(nextKey(b));
      if (sort === "age") return (a.dateOfBirth ?? "9999").localeCompare(b.dateOfBirth ?? "9999");
      return urgency(b) - urgency(a) || nextKey(a).localeCompare(nextKey(b));
    });
  }, [patients, filter, deferredQuery, sort]);

  const formerFiltered = useMemo(() => {
    const q = normalize(deferredQuery);
    return former.filter((p) => !q || normalize(p.name).includes(q) || normalize(p.code).includes(q));
  }, [former, deferredQuery]);

  const pick = (f: Filter) => {
    setFilter(f);
    syncUrl(f, query);
  };
  const changeQuery = (q: string) => {
    setQuery(q);
    syncUrl(filter, q);
  };

  const tabs: { key: Filter; label: string; Icon?: typeof BellRing }[] = [
    { key: "all", label: "Đang theo dõi" },
    { key: "attention", label: "Cần chú ý", Icon: BellRing },
    { key: "upcoming", label: "Có lịch sắp tới", Icon: CalendarClock },
    { key: "pending", label: "Chờ duyệt", Icon: ClipboardList },
    { key: "former", label: "Cựu bệnh nhân" },
  ];
  const isFormer = filter === "former";
  const shown = isFormer ? formerFiltered.length : filtered.length;
  const total = isFormer ? former.length : patients.length;

  return (
    <Content>
      <section className="overflow-hidden card">
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-line px-3.5 transition focus-within:border-primary">
            <Search aria-hidden className="size-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Tìm theo tên, mã (ELD001), số điện thoại hoặc bệnh nền"
              aria-label="Tìm bệnh nhân"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
            />
            {query ? (
              <button onClick={() => changeQuery("")} aria-label="Xoá tìm kiếm" className="rounded-full p-1 text-muted hover:bg-line/60 hover:text-ink">
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          {!isFormer ? (
            <label className="flex items-center gap-2 rounded-xl border border-line px-3">
              <ArrowDownUp aria-hidden className="size-4 text-muted" />
              <span className="text-sm text-muted">Sắp xếp</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent py-2 text-sm text-ink outline-none">
                {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4">
          <div role="tablist" aria-label="Lọc bệnh nhân" className="-mb-px flex gap-5 overflow-x-auto">
            {tabs.map((t) => {
              const active = filter === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => pick(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 py-2.5 text-sm transition ${
                    active ? "border-primary font-medium text-primary-dark" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.Icon ? <t.Icon aria-hidden className="size-3.5" /> : null}
                  {t.label}
                  <span className="text-xs text-muted tabular-nums">{counts[t.key]}</span>
                </button>
              );
            })}
          </div>
          <p className="py-2.5 text-xs text-muted" aria-live="polite">
            {shown === total ? `${total} bệnh nhân` : `${shown} / ${total} bệnh nhân`}
          </p>
        </div>

        {shown === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <UserRound aria-hidden className="size-6 text-muted/60" />
            <p className="text-sm text-muted">
              {query
                ? `Không có bệnh nhân nào khớp “${query}”.`
                : isFormer
                  ? "Chưa có cựu bệnh nhân."
                  : total === 0
                    ? "Bạn chưa được phân công bệnh nhân nào. Quản trị viên sẽ phân công bệnh nhân cho bạn."
                    : "Không có bệnh nhân nào trong nhóm này."}
            </p>
          </div>
        ) : isFormer ? (
          <FormerTable rows={formerFiltered} />
        ) : (
          <div role="table" aria-label="Danh sách bệnh nhân" className={`transition-opacity ${deferredQuery !== query ? "opacity-60" : ""}`}>
            <div role="row" className={`${GRID} hidden border-b border-line bg-canvas/60 px-4 py-2 text-xs font-medium text-muted lg:grid`}>
              <span role="columnheader">Bệnh nhân</span>
              <span role="columnheader">Bệnh nền</span>
              <span role="columnheader">Lần đo gần nhất</span>
              <span role="columnheader">Lịch khám tới</span>
              <span role="columnheader">Tình trạng</span>
              <span />
            </div>
            <div className="divide-y divide-line">
              {filtered.map((p) => (
                <PatientItem key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </Content>
  );
}

// Cột (màn hình rộng): bệnh nhân · bệnh nền · lần đo gần nhất · lịch khám tới · tình trạng · mũi tên.
const GRID = "lg:grid lg:grid-cols-[minmax(200px,1.3fr)_minmax(160px,1.2fr)_minmax(150px,1fr)_130px_minmax(140px,1fr)_20px] lg:items-center lg:gap-4";

function PatientItem({ p }: { p: PatientRow }) {
  const age = ageFrom(p.dateOfBirth);
  const m = p.lastMetric;
  return (
    <Link
      role="row"
      href={`/bs/benh-nhan/${p.id}`}
      className={`${GRID} flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-sm transition hover:bg-canvas/60`}
    >
      <div role="cell" className="flex min-w-0 basis-full items-center gap-3 lg:basis-auto">
        <Avatar name={p.name} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{p.name}</div>
          <div className="truncate text-xs text-muted">
            {[age !== null ? `${age} tuổi` : null, p.gender ? GENDER_LABEL[p.gender] : null, p.phone].filter(Boolean).join(", ")}
          </div>
        </div>
      </div>

      <div role="cell" className="min-w-0 text-ink lg:truncate" title={p.conditions.join(", ")}>
        {p.conditions.length > 0 ? p.conditions.join(", ") : <span className="text-muted">Chưa khai báo</span>}
      </div>

      <div role="cell" className="min-w-0">
        {m ? (
          <>
            <div className="truncate text-ink">
              {METRIC_LABEL[m.type]} <span className="font-medium tabular-nums">{formatMetricValue(m.value)}</span>{" "}
              <span className="text-xs text-muted">{METRIC_UNIT[m.type]}</span>
            </div>
            <div className="text-xs text-muted tabular-nums">{formatDateTime(m.recordedAt)}</div>
          </>
        ) : (
          <span className="text-muted">Chưa có (90 ngày)</span>
        )}
      </div>

      <div role="cell" className="tabular-nums">
        {p.nextAppointment ? (
          <>
            <div className="font-medium text-ink">{p.nextAppointment.time}</div>
            <div className="text-xs text-muted">{formatDate(p.nextAppointment.date)}</div>
          </>
        ) : (
          <span className="text-muted">Chưa có</span>
        )}
      </div>

      <div role="cell" className="flex flex-wrap items-center gap-1.5">
        {p.latestAlert ? (
          <span title={p.latestAlert.title}>
            <Badge className={ALERT_SEVERITY_CLASS[p.latestAlert.severity]} Icon={BellRing}>
              {ALERT_SEVERITY_LABEL[p.latestAlert.severity]}
            </Badge>
          </span>
        ) : null}
        {p.pendingRequests > 0 ? (
          <Badge className="bg-warning-light text-warning-dark" Icon={ClipboardList}>
            {p.pendingRequests} chờ duyệt
          </Badge>
        ) : null}
        {!p.latestAlert && p.pendingRequests === 0 ? <span className="text-xs text-muted">Không có cảnh báo</span> : null}
      </div>

      <ChevronRight aria-hidden className="ml-auto hidden size-4 text-muted lg:block" />
    </Link>
  );
}

function FormerTable({ rows }: { rows: FormerPatient[] }) {
  return (
    <div className="divide-y divide-line">
      {rows.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
          <div className="flex min-w-56 flex-1 items-center gap-3">
            <Avatar name={p.name} size="sm" />
            <div className="min-w-0">
              <div className="truncate font-medium text-ink">{p.name}</div>
              <div className="font-mono text-xs text-muted">{p.code}</div>
            </div>
          </div>
          <div className="min-w-48 flex-1 text-ink">{p.endReason ?? "Đã kết thúc theo dõi"}</div>
          <div className="w-40 text-muted tabular-nums">{p.endedAt ? `Kết thúc ${formatDate(p.endedAt)}` : ""}</div>
        </div>
      ))}
    </div>
  );
}
