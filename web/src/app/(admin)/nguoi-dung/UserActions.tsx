"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CalendarClock,
  Eye,
  HeartHandshake,
  Lock,
  LockOpen,
  MoreVertical,
  Pencil,
  Stethoscope,
  StopCircle,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Modal from "@/components/Modal";
import { Avatar } from "@/components/ui";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "@/components/form";
import { useFormAction } from "@/components/useModalAction";
import { loadUserDetail, setUserLocked, stopTreatment, updateUser } from "@/lib/actions";
import type { UserDetail, UserRow } from "@/lib/data";
import { ACADEMIC_TITLE_LABEL, DEGREE_LABEL, END_ASSIGNMENT_REASONS, formatDate, ROLE_LABEL } from "@/lib/labels";

type Dialog = "view" | "edit" | "stop" | "lock" | null;

const RELATIONSHIP: Record<string, string> = { CHILD: "Con", SPOUSE: "Vợ / Chồng", GRANDCHILD: "Cháu", RELATIVE: "Họ hàng", OTHER: "Khác" };
const GENDER: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

// Nút ⋮ của một hàng: menu thao tác theo vai trò + các popup tương ứng.
export default function UserActions({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Gần mép dưới màn hình → mở menu lên trên để không bị tràn.
  const [openUp, setOpenUp] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const open = (d: Dialog) => {
    setMenuOpen(false);
    setDialog(d);
  };
  const close = () => setDialog(null);
  const locked = !!user.locked_at;

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setOpenUp(window.innerHeight - rect.bottom < 240);
          setMenuOpen((v) => !v);
        }}
        aria-label={`Thao tác cho ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={`grid size-9 place-items-center rounded-xl text-muted transition hover:bg-canvas hover:text-ink ${menuOpen ? "bg-canvas text-ink" : ""}`}
      >
        <MoreVertical className="size-5" />
      </button>

      {menuOpen ? (
        <div role="menu" className={`absolute right-0 z-30 ${openUp ? "bottom-11" : "top-11"} w-56 overflow-hidden rounded-lg bg-white py-1.5 shadow-xl ring-1 ring-line`}>
          <MenuItem Icon={Eye} label="Xem chi tiết" onClick={() => open("view")} />
          <MenuItem Icon={Pencil} label="Sửa thông tin" onClick={() => open("edit")} />
          {user.role === "ELDERLY" && user.activeDoctors > 0 ? (
            <MenuItem Icon={StopCircle} label="Ngừng điều trị" onClick={() => open("stop")} />
          ) : null}
          {!isSelf ? (
            <>
              <div className="my-1.5 border-t border-line" />
              {locked ? (
                <MenuItem Icon={LockOpen} label="Mở khoá tài khoản" onClick={() => open("lock")} />
              ) : (
                <MenuItem Icon={Lock} label="Khoá tài khoản" danger onClick={() => open("lock")} />
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {dialog === "view" ? <ViewDialog user={user} onClose={close} /> : null}
      {dialog === "edit" ? <EditDialog user={user} onClose={close} /> : null}
      {dialog === "stop" ? <StopTreatmentDialog user={user} onClose={close} /> : null}
      {dialog === "lock" ? <LockDialog user={user} onClose={close} /> : null}
    </div>
  );
}

function MenuItem({ Icon, label, onClick, danger }: { Icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition ${
        danger ? "text-danger hover:bg-danger-light" : "text-ink hover:bg-canvas"
      }`}
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </button>
  );
}

// ---------- Xem chi tiết ----------

function ViewDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState(false);
  const [loading, startLoading] = useTransition();

  // Tải chi tiết một lần khi popup mở (gọi Server Action trong transition, không setState đồng bộ trong effect).
  useEffect(() => {
    startLoading(async () => {
      try {
        setDetail(await loadUserDetail(user.id, user.role));
      } catch {
        setError(true);
      }
    });
  }, [user.id, user.role]);

  return (
    <Modal open title="Chi tiết tài khoản" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <div className="text-base font-semibold">{user.name}</div>
            <div className="text-sm text-muted">
              {ROLE_LABEL[user.role]} · <span className="font-mono">{user.code}</span>
            </div>
          </div>
        </div>

        {user.locked_at ? (
          <p className="flex items-start gap-2 rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <b>Đã khoá</b> từ {formatDate(user.locked_at)}
              {user.locked_reason ? ` — ${user.locked_reason}` : ""}
            </span>
          </p>
        ) : null}

        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Email</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-muted">Điện thoại</dt>
          <dd>{user.phone ?? <i className="text-muted">Chưa có</i>}</dd>
          <dt className="text-muted">Tham gia</dt>
          <dd>{formatDate(user.created_at)}</dd>
        </dl>

        {loading || (!detail && !error) ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-line/50" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">Không tải được chi tiết. Vui lòng thử lại.</p>
        ) : detail ? (
          <RoleDetail detail={detail} />
        ) : null}
      </div>
    </Modal>
  );
}

function Section({ Icon, title, children }: { Icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon aria-hidden className="size-4 text-primary" />
        {title}
      </h3>
      <div className="rounded-xl bg-canvas px-4 py-3 text-sm">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-muted italic">{children}</p>;

function RoleDetail({ detail }: { detail: UserDetail }) {
  if (detail.elderly) {
    const e = detail.elderly;
    const age = e.dateOfBirth ? new Date().getFullYear() - Number(e.dateOfBirth.slice(0, 4)) : null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Tuổi" value={age !== null ? `${age}` : "—"} sub={e.gender ? GENDER[e.gender] : undefined} />
          <Stat label="Chờ duyệt" value={String(e.pendingRequests)} sub="yêu cầu đặt lịch" />
          <Stat label="Cảnh báo" value={String(e.alerts30Days)} sub="30 ngày qua" />
        </div>
        <Section Icon={Stethoscope} title="Bác sĩ phụ trách">
          {e.doctors.length ? (
            e.doctors.map((d) => (
              <p key={d.name}>
                <b>{d.name}</b> <span className="text-muted">· từ {formatDate(d.since)}</span>
              </p>
            ))
          ) : (
            <Empty>Chưa có bác sĩ phụ trách.</Empty>
          )}
        </Section>
        <Section Icon={HeartHandshake} title="Người thân theo dõi">
          {e.caregivers.length ? (
            e.caregivers.map((c) => (
              <p key={c.name}>
                <b>{c.name}</b> <span className="text-muted">· {RELATIONSHIP[c.relationship] ?? c.relationship}{c.phone ? ` · ${c.phone}` : ""}</span>
              </p>
            ))
          ) : (
            <Empty>Chưa có người thân liên kết.</Empty>
          )}
        </Section>
        <Section Icon={CalendarClock} title="Lịch khám sắp tới">
          {e.nextAppointment ? (
            <p>
              <b>
                {e.nextAppointment.time} · {formatDate(e.nextAppointment.date)}
              </b>{" "}
              <span className="text-muted">
                — {e.nextAppointment.reason ?? "Tái khám"}
                {e.nextAppointment.doctor ? ` · ${e.nextAppointment.doctor}` : ""}
              </span>
            </p>
          ) : (
            <Empty>Chưa có lịch khám sắp tới.</Empty>
          )}
        </Section>
      </div>
    );
  }
  if (detail.caregiver) {
    return (
      <Section Icon={UserRound} title="Người cao tuổi đang theo dõi">
        {detail.caregiver.elderly.length ? (
          detail.caregiver.elderly.map((e) => (
            <p key={e.code}>
              <b>{e.name}</b> <span className="text-muted">· {e.code} · {RELATIONSHIP[e.relationship] ?? e.relationship}</span>
            </p>
          ))
        ) : (
          <Empty>Chưa theo dõi ai.</Empty>
        )}
      </Section>
    );
  }
  if (detail.staff) {
    const s = detail.staff;
    const degree = [s.academicTitle ? ACADEMIC_TITLE_LABEL[s.academicTitle] : null, s.degree ? DEGREE_LABEL[s.degree] : null].filter(Boolean).join(", ");
    return (
      <div className="space-y-4">
        <Section Icon={Stethoscope} title="Chuyên môn">
          <p>
            <b>{degree || "Chưa khai học vị"}</b>
            {s.specialty ? <span className="text-muted"> · {s.specialty}</span> : null}
          </p>
          <p className="text-muted">{[s.workplace, s.department, s.room].filter(Boolean).join(" · ") || "Chưa có nơi làm việc"}</p>
        </Section>
        <Section Icon={UserRound} title={`Bệnh nhân đang phụ trách (${s.patients.length})`}>
          {s.patients.length ? (
            <div className="flex flex-wrap gap-2">
              {s.patients.map((p) => (
                <span key={p.code} className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark">
                  {p.name} · {p.code}
                </span>
              ))}
            </div>
          ) : (
            <Empty>Chưa phụ trách bệnh nhân nào.</Empty>
          )}
        </Section>
      </div>
    );
  }
  return <p className="text-sm text-muted">Tài khoản quản trị — không có dữ liệu sức khỏe liên quan.</p>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-canvas px-2 py-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      {sub ? <div className="text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

// ---------- Sửa ----------

function EditDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { state, action, pending } = useFormAction(updateUser, onClose);
  return (
    <Modal open title={`Sửa tài khoản ${user.code}`} onClose={onClose}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={user.id} />
        <Field label="Họ tên">
          <Input name="name" defaultValue={user.name} required maxLength={100} />
        </Field>
        <Field label="Số điện thoại">
          <Input name="phone" defaultValue={user.phone ?? ""} inputMode="tel" maxLength={20} />
        </Field>
        <p className="text-xs text-muted">Email và vai trò không đổi được từ trang quản trị.</p>
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Lưu</SubmitButton>
      </form>
    </Modal>
  );
}

// ---------- Ngừng điều trị ----------

const CUSTOM = "__custom__";

function StopTreatmentDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { state, action, pending } = useFormAction(stopTreatment, onClose);
  const [choice, setChoice] = useState(END_ASSIGNMENT_REASONS[0]);
  return (
    <Modal open title="Ngừng điều trị" onClose={onClose}>
      <form action={action} className="space-y-4">
        <p className="text-sm">
          Kết thúc theo dõi của <b>{user.activeDoctors} bác sĩ</b> đang phụ trách <b>{user.name}</b>. Bác sĩ sẽ không còn xem được dữ liệu sức
          khỏe; yêu cầu đặt lịch đang chờ bị từ chối và người thân được thông báo. Có thể phân công lại ở trang Bác sĩ.
        </p>
        <input type="hidden" name="elderlyId" value={user.id} />
        <Field label="Lý do">
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            name={choice === CUSTOM ? undefined : "reason"}
            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-base outline-none focus:border-primary"
          >
            {END_ASSIGNMENT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value={CUSTOM}>Khác (tự nhập)</option>
          </select>
        </Field>
        {choice === CUSTOM ? (
          <Field label="Lý do khác">
            <Input name="reason" required maxLength={500} autoFocus />
          </Field>
        ) : null}
        <FormMessage state={state} />
        <SubmitButton pending={pending} tone="danger">
          Ngừng điều trị
        </SubmitButton>
      </form>
    </Modal>
  );
}

// ---------- Khoá / mở khoá ----------

function LockDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { state, action, pending } = useFormAction(setUserLocked, onClose);
  const locking = !user.locked_at;
  return (
    <Modal open title={locking ? "Khoá tài khoản" : "Mở khoá tài khoản"} onClose={onClose}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={user.id} />
        <input type="hidden" name="locked" value={String(locking)} />
        {locking ? (
          <>
            <p className="text-sm">
              <b>{user.name}</b> ({user.code}) sẽ không đăng nhập được nữa. Dữ liệu sức khỏe, lịch khám, liên kết được giữ nguyên và mở khoá lại
              được bất cứ lúc nào.
              {user.role === "MEDICAL_STAFF"
                ? " Bác sĩ bị khoá sẽ được kết thúc mọi phân công; yêu cầu đặt lịch đang chờ gửi tới bác sĩ bị từ chối."
                : ""}
            </p>
            <Field label="Lý do khoá">
              <Textarea name="reason" required maxLength={500} placeholder="Ví dụ: Nghỉ việc, tài khoản trùng, yêu cầu của người dùng…" />
            </Field>
          </>
        ) : (
          <p className="text-sm">
            Cho phép <b>{user.name}</b> ({user.code}) đăng nhập lại.
            {user.role === "MEDICAL_STAFF" ? " Phân công bệnh nhân không tự khôi phục — phân công lại ở trang Bác sĩ." : ""}
          </p>
        )}
        <FormMessage state={state} />
        <SubmitButton pending={pending} tone={locking ? "danger" : "primary"}>
          {locking ? "Khoá tài khoản" : "Mở khoá"}
        </SubmitButton>
      </form>
    </Modal>
  );
}

