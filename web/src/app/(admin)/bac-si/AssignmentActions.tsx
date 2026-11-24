"use client";

import { useMemo, useState } from "react";
import { Plus, UserMinus } from "lucide-react";
import Modal from "@/components/Modal";
import { Field, FormMessage, Input, SubmitButton } from "@/components/form";
import { useModalAction } from "@/components/useModalAction";
import { assignDoctor, endAssignment } from "@/lib/actions";
import { END_ASSIGNMENT_REASONS } from "@/lib/labels";

export type ElderlyOption = { id: string; code: string; name: string; doctorCount: number };

const SELECT = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary";

// Phân công thêm một bệnh nhân cho bác sĩ đang chọn. Người chưa có bác sĩ xếp lên đầu.
export function AssignPatientButton({
  staffId,
  staffName,
  options,
}: {
  staffId: string;
  staffName: string;
  options: ElderlyOption[];
}) {
  const { open, setOpen, state, action, pending } = useModalAction(assignDoctor);
  const unassigned = useMemo(() => options.filter((o) => o.doctorCount === 0), [options]);
  const others = useMemo(() => options.filter((o) => o.doctorCount > 0), [options]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={options.length === 0}
        className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40"
      >
        <Plus aria-hidden className="size-4" /> Phân công bệnh nhân
      </button>
      <Modal open={open} title={`Phân công bệnh nhân cho ${staffName}`} onClose={() => setOpen(false)}>
        <form action={action} className="space-y-4">
          <input type="hidden" name="staffId" value={staffId} />
          <Field label="Người cao tuổi">
            <select name="elderlyId" required defaultValue="" className={SELECT}>
              <option value="" disabled>
                Chọn người cao tuổi…
              </option>
              {unassigned.length > 0 ? (
                <optgroup label={`Chưa có bác sĩ (${unassigned.length})`}>
                  {unassigned.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {others.length > 0 ? (
                <optgroup label="Đã có bác sĩ khác">
                  {others.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code}) — {o.doctorCount} bác sĩ
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </Field>
          <p className="text-xs text-muted">
            Bác sĩ sẽ thấy người này trong danh sách bệnh nhân, xem được hồ sơ sức khỏe và nhận yêu cầu đặt lịch.
          </p>
          <FormMessage state={state} />
          <SubmitButton pending={pending}>Phân công</SubmitButton>
        </form>
      </Modal>
    </>
  );
}

const CUSTOM = "__custom__";

// Kết thúc phân công một bệnh nhân (kèm lý do — giống bác sĩ tự kết thúc trên app).
export function EndAssignmentButton({
  elderlyId,
  elderlyName,
  staffId,
  staffName,
}: {
  elderlyId: string;
  elderlyName: string;
  staffId: string;
  staffName: string;
}) {
  const [choice, setChoice] = useState(END_ASSIGNMENT_REASONS[0]);
  const { open, setOpen, state, action, pending } = useModalAction(endAssignment);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Kết thúc phân công ${elderlyName}`}
        title="Kết thúc phân công"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition hover:bg-danger-light hover:text-danger"
      >
        <UserMinus aria-hidden className="size-4" />
        <span className="hidden sm:inline">Kết thúc</span>
      </button>
      <Modal open={open} title="Kết thúc phân công" onClose={() => setOpen(false)}>
        <form action={action} className="space-y-4">
          <p className="text-sm">
            <b>{staffName}</b> sẽ không còn phụ trách <b>{elderlyName}</b> và không xem được dữ liệu sức khỏe của người này. Yêu cầu đặt lịch
            đang chờ gửi tới bác sĩ sẽ bị từ chối.
          </p>
          <input type="hidden" name="elderlyId" value={elderlyId} />
          <input type="hidden" name="staffId" value={staffId} />
          <Field label="Lý do">
            <select value={choice} onChange={(e) => setChoice(e.target.value)} name={choice === CUSTOM ? undefined : "reason"} className={SELECT}>
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
            Kết thúc phân công
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
