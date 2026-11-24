"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "@/components/form";
import { reviewRequest } from "@/lib/actions";
import { useModalAction } from "@/components/useModalAction";

type Props = { appointment: { id: string; patientName: string; time: string; date: string } };

// Duyệt yêu cầu đặt lịch: Xác nhận (kèm lời dặn, không bắt buộc) hoặc Từ chối (bắt buộc lý do).
export default function ReviewButton({ appointment }: Props) {
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const { open, setOpen, state, action, pending } = useModalAction(reviewRequest);

  const tab = (active: boolean, danger = false) =>
    `flex-1 rounded-lg py-2 text-sm font-medium ${active ? (danger ? "bg-danger text-white" : "bg-primary text-white") : "text-muted hover:bg-canvas"}`;

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark">
        Duyệt
      </button>
      <Modal open={open} title="Duyệt yêu cầu đặt lịch" onClose={() => setOpen(false)}>
        <p className="mb-4 rounded-xl bg-canvas px-4 py-3 text-sm">
          <b>{appointment.patientName}</b>, lúc {appointment.time} ngày {appointment.date}
        </p>
        <div className="mb-4 flex gap-1 rounded-xl p-1 ring-1 ring-line">
          <button type="button" className={tab(decision === "approve")} onClick={() => setDecision("approve")}>
            Xác nhận
          </button>
          <button type="button" className={tab(decision === "reject", true)} onClick={() => setDecision("reject")}>
            Từ chối
          </button>
        </div>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="decision" value={decision} />
          {decision === "approve" ? (
            <Field label="Lời dặn cho bệnh nhân và người nhà (không bắt buộc)">
              <Textarea name="note" maxLength={500} placeholder="Nhịn ăn sáng trước khi khám…" />
            </Field>
          ) : (
            <Field label="Lý do từ chối">
              <Input name="reason" required maxLength={500} placeholder="Bác sĩ bận vào giờ này" />
            </Field>
          )}
          <FormMessage state={state} />
          <SubmitButton pending={pending} tone={decision === "reject" ? "danger" : "primary"}>
            {decision === "approve" ? "Xác nhận lịch" : "Từ chối yêu cầu"}
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
