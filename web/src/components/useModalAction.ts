"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/actions";

type ServerAction = (state: ActionState, form: FormData) => Promise<ActionState>;

// Popup chứa một form gọi Server Action: thành công thì tự đóng popup (đóng ngay trong action, không qua effect).
export function useModalAction(serverAction: ServerAction) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const result = await serverAction(prev, form);
    if (result?.ok) setOpen(false);
    return result;
  }, null);
  return { open, setOpen, state, action, pending };
}

// Biến thể cho popup được điều khiển từ bên ngoài (vd. mở từ menu ⋮): thành công thì gọi onSuccess (đóng popup).
export function useFormAction(serverAction: ServerAction, onSuccess: () => void) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const result = await serverAction(prev, form);
    if (result?.ok) onSuccess();
    return result;
  }, null);
  return { state, action, pending };
}
