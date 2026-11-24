import { supabase } from "../config/supabase";
import type { CaregiverDashboardItem, CaregiverRelationship, LinkedCaregiver, LinkedElderly } from "../types/caregiver";
import { toAppError } from "./supabaseError";

// Liên kết người thân ↔ người cao tuổi. Quyền xem do RLS quyết định (chỉ liên kết ACTIVE).

type ProfileLite = { id: string; code: string; name: string; phone: string | null };

type ElderlyLinkRow = {
  id: string;
  relationship: CaregiverRelationship;
  elderly: ProfileLite | null;
};

type CaregiverLinkRow = {
  id: string;
  relationship: CaregiverRelationship;
  caregiver: ProfileLite | null;
};

async function fetchCaregiverLinks<TRow>(
  filterField: "caregiver_id" | "elderly_id",
  filterId: string,
  joinAlias: "elderly" | "caregiver",
  fkey: "caregiver_links_elderly_id_fkey" | "caregiver_links_caregiver_id_fkey"
): Promise<TRow[]> {
  const { data, error } = await supabase
    .from("caregiver_links")
    .select(`id, relationship, ${joinAlias}:profiles!${fkey}(id, code, name, phone)`)
    .eq(filterField, filterId)
    .eq("status", "ACTIVE")
    .order("created_at")
    .returns<TRow[]>();

  if (error) throw toAppError(error);
  return data ?? [];
}

export async function getLinkedElderly(caregiverId: string): Promise<LinkedElderly[]> {
  const rows = await fetchCaregiverLinks<ElderlyLinkRow>(
    "caregiver_id",
    caregiverId,
    "elderly",
    "caregiver_links_elderly_id_fkey"
  );

  return rows
    .filter((row) => row.elderly)
    .map((row) => ({
      linkId: row.id,
      id: row.elderly!.id,
      code: row.elderly!.code,
      name: row.elderly!.name,
      phone: row.elderly!.phone ?? undefined,
      relationship: row.relationship,
    }));
}

export async function getLinkedCaregivers(elderlyId: string): Promise<LinkedCaregiver[]> {
  const rows = await fetchCaregiverLinks<CaregiverLinkRow>(
    "elderly_id",
    elderlyId,
    "caregiver",
    "caregiver_links_caregiver_id_fkey"
  );

  return rows
    .filter((row) => row.caregiver)
    .map((row) => ({
      linkId: row.id,
      id: row.caregiver!.id,
      name: row.caregiver!.name,
      phone: row.caregiver!.phone ?? undefined,
      relationship: row.relationship,
    }));
}

export type LinkInvite = { code: string; expiresAt: string };

// Người cao tuổi tạo mã mời 6 số (hiệu lực 15 phút, dùng 1 lần). Mã cũ chưa dùng bị hủy.
export async function createInvite(): Promise<LinkInvite> {
  const { data, error } = await supabase.rpc("create_link_invite");
  if (error) throw toAppError(error);
  const row = (data as { code: string; expires_at: string }[])[0];
  return { code: row.code, expiresAt: row.expires_at };
}

export type AcceptInviteResult =
  | { status: "LINKED"; elderlyName: string }
  | { status: "INVALID" }
  | { status: "LOCKED" };

// Người thân nhập mã mời. Backend giới hạn 5 lần sai trong 10 phút.
export async function acceptInvite(code: string, relationship: CaregiverRelationship): Promise<AcceptInviteResult> {
  const { data, error } = await supabase.rpc("accept_link_invite", {
    p_code: code.trim(),
    p_relationship: relationship,
  });
  if (error) throw toAppError(error);
  const row = (data as { status: "LINKED" | "INVALID" | "LOCKED"; elderly_name: string | null }[])[0];
  return row.status === "LINKED" ? { status: "LINKED", elderlyName: row.elderly_name ?? "" } : { status: row.status };
}

// Người cao tuổi gỡ người thân, hoặc người thân tự rời.
export async function revokeLink(linkId: string): Promise<void> {
  const { error } = await supabase.rpc("revoke_caregiver_link", { p_link_id: linkId });
  if (error) throw toAppError(error);
}

type DashboardRow = {
  elderly_id: string;
  name: string;
  phone: string | null;
  relationship: CaregiverRelationship;
  date_of_birth: string | null;
  doses: CaregiverDashboardItem["doses"];
  latest_bp: { systolic: number; diastolic: number } | null;
  latest_bp_at: string | null;
  latest_hr: number | null;
  latest_hr_at: string | null;
  latest_spo2: number | null;
  latest_spo2_at: string | null;
  unread_alerts: number;
  latest_alert_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  latest_alert_title: string | null;
  next_appointment: { date: string; time: string; facility: string; doctor: string | null } | null;
};

// Tổng quan mọi người cao tuổi đang theo dõi trong một lần gọi. dateKey: ngày theo giờ máy người dùng.
export async function getDashboard(dateKey: string): Promise<CaregiverDashboardItem[]> {
  const { data, error } = await supabase.rpc("caregiver_dashboard", { p_date: dateKey });
  if (error) throw toAppError(error);

  return (data as DashboardRow[]).map((row) => ({
    elderlyId: row.elderly_id,
    name: row.name,
    phone: row.phone ?? undefined,
    relationship: row.relationship,
    dateOfBirth: row.date_of_birth ?? undefined,
    doses: row.doses ?? [],
    latestBp:
      row.latest_bp && row.latest_bp_at
        ? { systolic: row.latest_bp.systolic, diastolic: row.latest_bp.diastolic, recordedAt: row.latest_bp_at }
        : undefined,
    latestHr: row.latest_hr !== null && row.latest_hr_at ? { value: Number(row.latest_hr), recordedAt: row.latest_hr_at } : undefined,
    latestSpo2:
      row.latest_spo2 !== null && row.latest_spo2_at
        ? { value: Number(row.latest_spo2), recordedAt: row.latest_spo2_at }
        : undefined,
    unreadAlerts: row.unread_alerts,
    latestAlert:
      row.latest_alert_severity && row.latest_alert_title
        ? { severity: row.latest_alert_severity, title: row.latest_alert_title }
        : undefined,
    nextAppointment: row.next_appointment
      ? { ...row.next_appointment, doctor: row.next_appointment.doctor ?? undefined }
      : undefined,
  }));
}
