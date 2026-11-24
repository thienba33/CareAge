import { AppState } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";

// Cache server state dùng chung cho mọi màn hình (skill mục 20–21): một dữ liệu chỉ tải một lần,
// các tab cùng đọc một cache; mutation cập nhật cache trực tiếp.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// React Native không có sự kiện "window focus": coi app quay lại foreground là focus
// để tự tải lại dữ liệu đã cũ.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
  return () => subscription.remove();
});

export function toErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : fallback;
}
