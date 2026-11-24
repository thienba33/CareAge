import { supabase } from "../config/supabase";
import type { InboxRow } from "./inbox.service";

// Thông báo mới trong hộp thông báo của chính người dùng (RLS: chỉ nhận dòng có recipient_id = mình).
// userId được dùng làm định danh channel để tránh conflict khi nhiều phiên cùng subscribe.
export function subscribeToInbox(userId: string, onInsert: (row: InboxRow) => void): () => void {
  const channel = supabase
    .channel(`inbox:${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) =>
      onInsert(payload.new as InboxRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
