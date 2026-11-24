// CareAge — Gửi push cho người thân khi có thông báo mới (gọi từ trigger `push_after_notification`).
// Đọc push token của người nhận bằng service role, gửi qua Expo Push API, xóa token máy đã gỡ app.

import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
// Khớp CAREGIVER_ALERT_CHANNEL_ID trong src/constants/notification.ts.
const CHANNEL_ID = "caregiver-alerts";

type InboxType = "MEDICATION_MISSED" | "APPOINTMENT_TOMORROW" | "HEALTH_ALERT" | "APPOINTMENT_REVIEWED";

// Khớp LOCAL_TYPE trong src/hooks/useCaregiverAlertWatch.ts để app xử lý bấm thông báo như nhau.
const NOTIFICATION_TYPE: Record<InboxType, string> = {
  MEDICATION_MISSED: "MEDICATION_REMINDER",
  APPOINTMENT_TOMORROW: "APPOINTMENT_REMINDER",
  HEALTH_ALERT: "HEALTH_ALERT",
  APPOINTMENT_REVIEWED: "APPOINTMENT_REMINDER",
};

type Payload = {
  id: string;
  recipient_id: string;
  elderly_id: string | null;
  type: InboxType;
  title: string;
  body: string;
};

type ExpoTicket = { status: "ok"; id: string } | { status: "error"; message: string; details?: { error?: string } };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const secret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-push-secret") !== secret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const notification = (await req.json()) as Payload;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rows, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", notification.recipient_id);
  if (error) return json({ error: error.message }, 500);
  if (!rows || rows.length === 0) return json({ sent: 0 });

  const messages = rows.map(({ token }) => ({
    to: token,
    title: notification.title,
    body: notification.body,
    sound: "default",
    priority: "high",
    channelId: CHANNEL_ID,
    data: {
      type: NOTIFICATION_TYPE[notification.type],
      elderlyId: notification.elderly_id ?? undefined,
      inboxType: notification.type,
    },
  }));

  const accessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(messages),
  });
  if (!response.ok) return json({ error: `Expo push ${response.status}` }, 502);

  // Ticket trả về theo đúng thứ tự message. Máy đã gỡ app / token hết hạn → xóa token.
  const { data: tickets } = (await response.json()) as { data: ExpoTicket[] };
  const staleTokens = tickets
    .map((ticket, i) =>
      ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered" ? messages[i].to : null
    )
    .filter((token): token is string => token !== null);
  if (staleTokens.length > 0) {
    await supabase.from("push_tokens").delete().in("token", staleTokens);
  }

  return json({ sent: tickets.filter((t) => t.status === "ok").length, removed: staleTokens.length });
});
