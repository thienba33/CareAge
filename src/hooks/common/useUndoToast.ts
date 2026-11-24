import { useCallback, useEffect, useRef, useState } from "react";

const UNDO_WINDOW_MS = 5000;

type UndoState = { message: string; undo: () => Promise<void> };

// Hiện dải "Hoàn tác" vài giây sau một thao tác (vd. đánh dấu đã uống) để sửa khi bấm/vuốt nhầm.
export function useUndoToast() {
  const [state, setState] = useState<UndoState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setState(null);
  }, []);

  useEffect(() => dismiss, [dismiss]);

  const show = useCallback(
    (message: string, undo: () => Promise<void>) => {
      dismiss();
      setState({ message, undo });
      timer.current = setTimeout(dismiss, UNDO_WINDOW_MS);
    },
    [dismiss]
  );

  // Trả về promise của thao tác hoàn tác để nơi gọi xử lý lỗi.
  const undo = useCallback(async () => {
    const current = state;
    dismiss();
    if (current) await current.undo();
  }, [state, dismiss]);

  return { message: state?.message ?? null, show, undo };
}
