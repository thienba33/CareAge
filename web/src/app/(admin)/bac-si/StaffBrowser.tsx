"use client";

import { useMemo, useState } from "react";
import { Search, Stethoscope, UserRound, UserX, X } from "lucide-react";
import { Avatar, Content, EmptyState } from "@/components/ui";
import { ACADEMIC_TITLE_LABEL, DEGREE_LABEL, formatDate, formatDoctorName } from "@/lib/labels";
import type { StaffRow } from "@/lib/data";
import EditStaffButton from "./EditStaffButton";
import { AssignPatientButton, EndAssignmentButton, type ElderlyOption } from "./AssignmentActions";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

// Trang Bác sĩ (gộp Phân công): trái — danh sách bác sĩ; phải — hồ sơ + bệnh nhân của bác sĩ đang chọn.
// Dữ liệu tải một lần trên server; chọn bác sĩ hiện ngay (giữ ?bs= trên URL, không gọi lại server).
export default function StaffBrowser({
  staff,
  elderly,
  initialId,
}: {
  staff: StaffRow[];
  elderly: ElderlyOption[];
  initialId: string | null;
}) {
  const [selectedId, setSelectedId] = useState(initialId && staff.some((s) => s.id === initialId) ? initialId : (staff[0]?.id ?? null));
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return staff;
    return staff.filter(
      (s) => normalize(s.name).includes(q) || normalize(s.code).includes(q) || normalize(s.profile.specialty ?? "").includes(q)
    );
  }, [staff, query]);

  const selected = staff.find((s) => s.id === selectedId) ?? null;
  const unassigned = elderly.filter((e) => e.doctorCount === 0);

  const select = (id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `/bac-si?bs=${id}`);
  };

  if (staff.length === 0) {
    return (
      <Content overlap>
        <EmptyState Icon={Stethoscope}>Chưa có nhân viên y tế nào. Bác sĩ đăng ký tài khoản trong ứng dụng CareAge.</EmptyState>
      </Content>
    );
  }

  return (
    <Content overlap>
      {unassigned.length > 0 ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning-light/60 px-4 py-3">
          <UserX aria-hidden className="mt-0.5 size-4 shrink-0 text-warning-dark" />
          <p className="text-sm text-ink">
            <b>{unassigned.length} người cao tuổi chưa có bác sĩ phụ trách:</b> {unassigned.map((e) => e.name).join(", ")}. Chọn một bác sĩ rồi bấm{" "}
            <b>Phân công bệnh nhân</b>.
          </p>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
        {/* Danh sách bác sĩ */}
        <section className="overflow-hidden card lg:sticky lg:top-4">
          <div className="border-b border-line p-3">
            <label className="flex items-center gap-2 rounded-xl border border-line px-3 focus-within:border-primary">
              <Search aria-hidden className="size-4 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm bác sĩ, mã, chuyên khoa"
                aria-label="Tìm bác sĩ"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
              />
              {query ? (
                <button onClick={() => setQuery("")} aria-label="Xoá tìm kiếm" className="rounded-full p-0.5 text-muted hover:text-ink">
                  <X className="size-4" />
                </button>
              ) : null}
            </label>
          </div>
          <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto" role="listbox" aria-label="Danh sách bác sĩ">
            {filtered.length === 0 ? <li className="px-4 py-8 text-center text-sm text-muted">Không tìm thấy bác sĩ phù hợp.</li> : null}
            {filtered.map((s) => {
              const active = s.id === selectedId;
              return (
                <li key={s.id} role="option" aria-selected={active}>
                  <button
                    onClick={() => select(s.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                      active ? "bg-primary-light/70 shadow-[inset_3px_0_0_var(--color-primary)]" : "hover:bg-canvas"
                    }`}
                  >
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {formatDoctorName(s.name, s.profile.academicTitle, s.profile.degree)}
                      </div>
                      <div className="truncate text-xs text-muted">{s.profile.specialty ?? "Chưa khai chuyên khoa"}</div>
                    </div>
                    <span className="text-xs text-muted tabular-nums" title="Bệnh nhân đang phụ trách">
                      {s.activePatients} BN
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Chi tiết bác sĩ đang chọn */}
        {selected ? <StaffDetail key={selected.id} staff={selected} elderly={elderly} /> : null}
      </div>
    </Content>
  );
}

function StaffDetail({ staff: s, elderly }: { staff: StaffRow; elderly: ElderlyOption[] }) {
  const p = s.profile;
  const degree = [p.academicTitle ? ACADEMIC_TITLE_LABEL[p.academicTitle] : null, p.degree ? DEGREE_LABEL[p.degree] : null]
    .filter(Boolean)
    .join(", ");
  const assignable = elderly.filter((e) => !s.patients.some((pt) => pt.id === e.id));
  const name = formatDoctorName(s.name, p.academicTitle, p.degree);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden card">
        <div className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4">
          <Avatar name={s.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">{name}</h2>
            <p className="text-sm text-ink">{[p.specialty, degree].filter(Boolean).join(" · ") || "Chưa khai chuyên môn"}</p>
            <p className="font-mono text-xs text-muted">{s.code}</p>
          </div>
          <EditStaffButton staff={s} />
        </div>
        <dl className="grid gap-x-8 gap-y-2 px-5 py-4 text-sm sm:grid-cols-2">
          <Info label="Email" value={s.email} empty="—" />
          <Info label="Điện thoại" value={s.phone} empty="—" />
          <Info label="Cơ sở y tế" value={s.workplace} empty="—" />
          <Info label="Khoa / phòng" value={[p.department, p.room].filter(Boolean).join(" · ")} empty="—" />
          <Info label="Giờ làm việc" value={p.workingHours} empty="—" />
          <Info label="Kinh nghiệm" value={p.yearsExperience !== null ? `${p.yearsExperience} năm` : null} empty="—" />
        </dl>
        {!p.degree && !p.specialty ? (
          <div className="border-t border-line px-5 py-3">
            <span className="text-xs text-warning-dark">Hồ sơ chưa đầy đủ — bấm Sửa để bổ sung học vị, chuyên khoa.</span>
          </div>
        ) : null}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            Bệnh nhân đang phụ trách
            <span className="text-xs font-normal text-muted">{s.patients.length}</span>
          </h3>
          <AssignPatientButton staffId={s.id} staffName={name} options={assignable} />
        </div>
        {s.patients.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <UserRound aria-hidden className="size-6 text-muted/60" />
            <p className="text-sm text-muted">Bác sĩ chưa phụ trách bệnh nhân nào.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {s.patients.map((pt) => (
              <li key={pt.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-canvas/60">
                <Avatar name={pt.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink">{pt.name}</div>
                  <div className="text-xs text-muted">
                    <span className="font-mono">{pt.code}</span>
                    {pt.phone ? ` · ${pt.phone}` : ""} · phụ trách từ {formatDate(pt.assignedAt)}
                  </div>
                </div>
                <EndAssignmentButton elderlyId={pt.id} elderlyName={pt.name} staffId={s.id} staffName={name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Info({ label, value, empty }: { label: string; value: string | null; empty: string }) {
  return (
    <div className="flex min-w-0 gap-3">
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className={`min-w-0 truncate ${value ? "text-ink" : "text-muted"}`}>{value || empty}</dd>
    </div>
  );
}
