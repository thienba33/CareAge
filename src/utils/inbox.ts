import type { InboxEntry, InboxNotification } from "../types/inbox";

// Gộp các lần báo cho cùng một cữ thuốc bị quên (lần 1 + lần nhắc lại) thành một dòng có số lần.
// Hàm thuần: chỉ đổi cách hiển thị, dữ liệu gốc vẫn là từng thông báo do Backend tạo.

const groupKey = (n: InboxNotification) =>
  n.dose ? `missed:${n.elderlyId ?? ""}:${n.dose.date}:${n.dose.time}` : n.id;

// `items` sắp xếp mới nhất trước (như Backend trả về) → dòng gộp nằm ở vị trí lần báo mới nhất.
export function groupInbox(items: InboxNotification[]): InboxEntry[] {
  const groups = new Map<string, InboxNotification[]>();
  for (const n of items) {
    const key = groupKey(n);
    const group = groups.get(key);
    if (group) group.push(n);
    else groups.set(key, [n]);
  }

  return Array.from(groups, ([key, group]) => {
    const latest = group[0];
    const first = group[group.length - 1];
    return {
      key,
      type: latest.type,
      elderlyId: latest.elderlyId,
      // Tiêu đề của lần báo đầu ("Mẹ chưa uống thuốc 08:00"), nội dung + giờ của lần nhắc mới nhất.
      title: first.title,
      body: latest.body,
      createdAt: latest.createdAt,
      count: group.length,
      ids: group.map((n) => n.id),
      unreadIds: group.filter((n) => !n.readAt).map((n) => n.id),
    };
  });
}
