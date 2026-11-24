import { supabase } from "../config/supabase";
import type { InboxNotification, InboxType } from "../types/inbox";
import { toAppError } from "./supabaseError";

// Hộp thông báo do Backend tạo (cron / trigger). App chỉ đọc và đánh dấu đã đọc.

const COLUMNS = "id, elderly_id, type, title, body, data, created_at, read_at";
const MAX_ITEMS = 100;

export type InboxRow = {
  id: string;
  elderly_id: string | null;
  type: InboxType;
  title: string;
  body: string;
  data: { date?: string; time?: string } | null;
  created_at: string;
  read_at: string | null;
};

export const toInboxNotification = (row: InboxRow): InboxNotification => ({
  id: row.id,
  elderlyId: row.elderly_id ?? undefined,
  type: row.type,
  title: row.title,
  body: row.body,
  createdAt: row.created_at,
  readAt: row.read_at ?? undefined,
  dose:
    row.type === "MEDICATION_MISSED" && row.data?.date && row.data.time
      ? { date: row.data.date, time: row.data.time }
      : undefined,
});

export async function getInbox(recipientId: string): Promise<InboxNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(COLUMNS)
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false })
    .limit(MAX_ITEMS)
    .returns<InboxRow[]>();

  if (error) throw toAppError(error);
  return data.map(toInboxNotification);
}

export async function markRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
  if (error) throw toAppError(error);
}
