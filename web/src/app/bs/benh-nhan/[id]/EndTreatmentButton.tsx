"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";
import Modal from "@/components/Modal";
import { Field, FormMessage, Input, Select, SubmitButton } from "@/components/form";
import { useModalAction } from "@/components/useModalAction";
import { endMyAssignment } from "@/lib/actions";
import { END_ASSIGNMENT_REASONS } from "@/lib/labels";

const CUSTOM = "__custom__";

// Kết thúc theo dõi bệnh nhân → chuyển thành cựu bệnh nhân (giống nút cuối màn Bệnh nhân trên app).
export default function EndTreatmentButton({ elderlyId, elderlyName }: { elderlyId: string; elderlyName: string }) {
  const [choice, setChoice] = useState(END_ASSIGNMENT_REASONS[0]);
  const { open, setOpen, state, action, pending } = useModalAction(endMyAssignment);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/40 hover:bg-white/25"
      >
        <UserMinus aria-hidden className="size-4" /> Kết thúc điều trị
      </button>
      <Modal open={open} title="Kết thúc điều trị" onClose={() => setOpen(false)}>
        <form action={action} className="space-y-4">
          <p className="text-sm">
            <b>{elderlyName}</b> sẽ chuyển sang danh sách cựu bệnh nhân. Bạn sẽ không còn xem được dữ liệu sức khỏe của người này; yêu cầu đặt
            lịch đang chờ gửi tới bạn sẽ bị từ chối và người nhà được thông báo.
          </p>
          <input type="hidden" name="elderlyId" value={elderlyId} />
          <Field label="Lý do">
            <Select value={choice} onChange={(e) => setChoice(e.target.value)} name={choice === CUSTOM ? undefined : "reason"}>
              {END_ASSIGNMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value={CUSTOM}>Khác (tự nhập)</option>
            </Select>
          </Field>
          {choice === CUSTOM ? (
            <Field label="Lý do khác">
              <Input name="reason" required maxLength={500} autoFocus />
            </Field>
          ) : null}
          <FormMessage state={state} />
          <SubmitButton pending={pending} tone="danger">
            Kết thúc điều trị
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
