import "server-only";
import { createClient } from "./supabase/server";
import type {
  AlertSeverity,
  ConditionCategory,
  ConditionStatus,
  Gender,
  MetricType,
  MetricValue,
} from "./labels";
import { vnDateKey } from "./labels";
import { getAppointments, type AppointmentRow } from "./data";

// Truy vấn cho khu bác sĩ (/bs) — giống src/services/staff.service.ts của app. Chạy với phiên của bác sĩ:
// RLS (staff_assignments ACTIVE, can_view_elderly) và các RPC staff_* quyết định dữ liệu trả về.
// Trang luôn gọi requireStaff() trước.

export type PatientSummary = {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  dateOfBirth: string | null;
  unreadAlerts: number;
  latestAlert: { severity: AlertSeverity; title: string } | null;
  pendingRequests: number;
  todayAppointments: number;
  nextAppointment: { date: string; time: string; reason: string | null } | null;
};

// Một dòng cho mỗi bệnh nhân đang phụ trách (RPC staff_dashboard). today: ngày theo giờ Việt Nam.
export async function getPatientSummaries(today: string): Promise<PatientSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_dashboard", { p_date: today });
  if (error) throw new Error(error.message);
  return (
    (data ?? []) as {
      elderly_id: string;
      name: string;
      code: string;
      phone: string | null;
      date_of_birth: string | null;
      unread_alerts: number;
      latest_alert_severity: AlertSeverity | null;
      latest_alert_title: string | null;
      pending_requests: number;
      today_appointments: number;
      next_appointment: { date: string; time: string; reason: string | null } | null;
    }[]
  ).map((r) => ({
    id: r.elderly_id,
    name: r.name,
    code: r.code,
    phone: r.phone,
    dateOfBirth: r.date_of_birth,
    unreadAlerts: r.unread_alerts,
    latestAlert: r.latest_alert_severity && r.latest_alert_title ? { severity: r.latest_alert_severity, title: r.latest_alert_title } : null,
    pendingRequests: r.pending_requests,
    todayAppointments: r.today_appointments,
    nextAppointment: r.next_appointment,
  }));
}

// Một dòng của bảng Bệnh nhân: tổng quan (staff_dashboard) + giới tính, bệnh nền đang theo dõi, lần đo gần nhất.
export type PatientRow = PatientSummary & {
  gender: Gender | null;
  conditions: string[];
  lastMetric: { type: MetricType; value: MetricValue; recordedAt: string } | null;
};

export async function getPatientRows(today: string): Promise<PatientRow[]> {
  const summaries = await getPatientSummaries(today);
  const ids = summaries.map((p) => p.id);
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const [hp, conditions, metrics] = await Promise.all([
    supabase.from("health_profiles").select("user_id, gender").in("user_id", ids).returns<{ user_id: string; gender: Gender | null }[]>(),
    supabase
      .from("medical_conditions")
      .select("user_id, name")
      .in("user_id", ids)
      .eq("category", "CHRONIC")
      .eq("status", "ACTIVE")
      .order("created_at")
      .returns<{ user_id: string; name: string }[]>(),
    supabase
      .from("health_metrics")
      .select("user_id, type, value, recorded_at")
      .in("user_id", ids)
      .gte("recorded_at", new Date(Date.now() - 90 * 86_400_000).toISOString())
      .order("recorded_at", { ascending: false })
      .limit(1000)
      .returns<{ user_id: string; type: MetricType; value: MetricValue; recorded_at: string }[]>(),
  ]);

  const gender = new Map((hp.data ?? []).map((h) => [h.user_id, h.gender]));
  const lastMetric = new Map<string, PatientRow["lastMetric"]>();
  for (const m of metrics.data ?? []) {
    if (!lastMetric.has(m.user_id)) lastMetric.set(m.user_id, { type: m.type, value: m.value, recordedAt: m.recorded_at });
  }
  return summaries.map((p) => ({
    ...p,
    gender: gender.get(p.id) ?? null,
    conditions: (conditions.data ?? []).filter((c) => c.user_id === p.id).map((c) => c.name),
    lastMetric: lastMetric.get(p.id) ?? null,
  }));
}

export type FormerPatient = { id: string; name: string; code: string; endedAt: string | null; endReason: string | null };

export async function getFormerPatients(): Promise<FormerPatient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_former_patients");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { elderly_id: string; name: string; code: string; ended_at: string | null; end_reason: string | null }[]).map(
    (r) => ({ id: r.elderly_id, name: r.name, code: r.code, endedAt: r.ended_at, endReason: r.end_reason })
  );
}

export type StaffAlert = {
  id: string;
  patientId: string;
  patientName: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: string;
};

// Cảnh báo 30 ngày gần nhất của các bệnh nhân đang phụ trách (RLS lọc). patientId: chỉ một bệnh nhân.
export async function getRecentAlerts(options: { patientId?: string; limit?: number } = {}): Promise<StaffAlert[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  let query = supabase
    .from("alerts")
    .select("id, user_id, severity, title, message, created_at, patient:profiles!alerts_user_id_fkey(name)")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 20);
  if (options.patientId) query = query.eq("user_id", options.patientId);
  const { data, error } = await query.returns<
    {
      id: string;
      user_id: string;
      severity: AlertSeverity;
      title: string;
      message: string;
      created_at: string;
      patient: { name: string } | null;
    }[]
  >();
  if (error) throw new Error(error.message);
  return data.map((a) => ({
    id: a.id,
    patientId: a.user_id,
    patientName: a.patient?.name ?? "",
    severity: a.severity,
    title: a.title,
    message: a.message,
    createdAt: a.created_at,
  }));
}

// ---------- Chi tiết một bệnh nhân ----------

export type MetricPoint = { id: string; type: MetricType; value: MetricValue; unit: string; recordedAt: string; source: "HOSPITAL" | "DEVICE" };

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  times: string[];
  startDate: string;
  endDate: string | null;
  instructions: string | null;
};

export type PatientDetail = {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  profile: {
    dateOfBirth: string | null;
    gender: Gender | null;
    heightCm: number | null;
    weightKg: number | null;
    bloodType: string | null;
    address: string | null;
  } | null;
  conditions: { id: string; category: ConditionCategory; name: string; status: ConditionStatus; diagnosedAt: string | null; note: string | null }[];
  caregivers: { name: string; phone: string | null; relationship: string }[];
  contacts: { id: string; name: string; relationship: string; phone: string }[];
  metrics: MetricPoint[];
  medications: Medication[];
  alerts: StaffAlert[];
  appointments: AppointmentRow[];
};

const METRIC_DAYS = 90;

// null: không còn phụ trách (RLS không trả profile) → trang hiện 404.
export async function getPatientDetail(id: string): Promise<PatientDetail | null> {
  const supabase = await createClient();
  const since = new Date(Date.now() - METRIC_DAYS * 86_400_000).toISOString();

  const { data: assignment } = await supabase
    .from("staff_assignments")
    .select("elderly:profiles!staff_assignments_elderly_id_fkey(id, name, code, phone)")
    .eq("elderly_id", id)
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle<{ elderly: { id: string; name: string; code: string; phone: string | null } | null }>();
  const person = assignment?.elderly;
  if (!person) return null;

  const [hp, conditions, caregivers, contacts, metrics, medications, alerts, appointments] = await Promise.all([
    supabase
      .from("health_profiles")
      .select("date_of_birth, gender, height_cm, weight_kg, blood_type, address")
      .eq("user_id", id)
      .maybeSingle<{
        date_of_birth: string | null;
        gender: Gender | null;
        height_cm: number | null;
        weight_kg: number | null;
        blood_type: string | null;
        address: string | null;
      }>(),
    supabase
      .from("medical_conditions")
      .select("id, category, name, status, diagnosed_at, note")
      .eq("user_id", id)
      .order("created_at")
      .returns<
        { id: string; category: ConditionCategory; name: string; status: ConditionStatus; diagnosed_at: string | null; note: string | null }[]
      >(),
    supabase
      .from("caregiver_links")
      .select("relationship, caregiver:profiles!caregiver_links_caregiver_id_fkey(name, phone)")
      .eq("elderly_id", id)
      .eq("status", "ACTIVE")
      .returns<{ relationship: string; caregiver: { name: string; phone: string | null } | null }[]>(),
    supabase
      .from("emergency_contacts")
      .select("id, name, relationship, phone")
      .eq("user_id", id)
      .returns<{ id: string; name: string; relationship: string; phone: string }[]>(),
    supabase
      .from("health_metrics")
      .select("id, type, value, unit, recorded_at, source")
      .eq("user_id", id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true })
      .limit(2000)
      .returns<{ id: string; type: MetricType; value: MetricValue; unit: string; recorded_at: string; source: "HOSPITAL" | "DEVICE" }[]>(),
    supabase
      .from("medications")
      .select("id, name, dosage, unit, times, start_date, end_date, instructions")
      .eq("user_id", id)
      .eq("status", "ACTIVE")
      .order("start_date", { ascending: false })
      .returns<
        {
          id: string;
          name: string;
          dosage: string;
          unit: string;
          times: string[];
          start_date: string;
          end_date: string | null;
          instructions: string | null;
        }[]
      >(),
    getRecentAlerts({ patientId: id, limit: 10 }),
    getAppointmentsOf(id),
  ]);

  return {
    ...person,
    profile: hp.data
      ? {
          dateOfBirth: hp.data.date_of_birth,
          gender: hp.data.gender,
          heightCm: hp.data.height_cm,
          weightKg: hp.data.weight_kg,
          bloodType: hp.data.blood_type,
          address: hp.data.address,
        }
      : null,
    conditions: (conditions.data ?? []).map((c) => ({ ...c, diagnosedAt: c.diagnosed_at })),
    caregivers: (caregivers.data ?? []).map((c) => ({
      name: c.caregiver?.name ?? "",
      phone: c.caregiver?.phone ?? null,
      relationship: c.relationship,
    })),
    contacts: contacts.data ?? [],
    metrics: (metrics.data ?? []).map((m) => ({ id: m.id, type: m.type, value: m.value, unit: m.unit, recordedAt: m.recorded_at, source: m.source })),
    medications: (medications.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      unit: m.unit,
      times: m.times,
      startDate: m.start_date,
      endDate: m.end_date,
      instructions: m.instructions,
    })),
    alerts,
    appointments,
  };
}

// Lịch khám của một bệnh nhân (mọi trạng thái, mới nhất trước) — RLS cho bác sĩ đang phụ trách đọc.
async function getAppointmentsOf(patientId: string): Promise<AppointmentRow[]> {
  const all = await getAppointments({ limit: 300, patientId });
  return all.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

// ---------- Trang Tổng quan (dashboard) của bác sĩ ----------

export type StaffOverview = {
  today: string;
  // Lịch gần nhất (chờ duyệt + đã xác nhận, từ hôm nay, không giới hạn ngày), sớm trước.
  next: AppointmentRow[];
  upcomingByDay: { date: string; confirmed: number; requested: number }[];
  completed: { current: number; previous: number };
  alerts: { current: number; previous: number; urgent: number };
  // Số cảnh báo 30 ngày theo bệnh nhân (nhiều trước).
  alertsByPatient: { id: string; name: string; count: number }[];
};

const DAY = 86_400_000;
const UPCOMING_DAYS = 14;

export async function getStaffOverview(staffId: string): Promise<StaffOverview> {
  const today = vnDateKey();
  const until = vnDateKey(UPCOMING_DAYS - 1);
  const monthStart = `${today.slice(0, 8)}01`;
  const [y, m] = today.split("-").map(Number);
  const prevMonthStart = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}-01`;
  // Cùng số ngày của tháng trước (vd. 1–19/9 so với 1–19/10) để so sánh công bằng.
  const prevMonthSameDay = `${prevMonthStart.slice(0, 8)}${today.slice(8, 10)}`;

  const supabase = await createClient();
  const [upcoming, next, completed, alertsRes] = await Promise.all([
    getAppointments({ statuses: ["REQUESTED", "UPCOMING"], from: today, to: until, staffId }),
    getAppointments({ statuses: ["REQUESTED", "UPCOMING"], from: today, staffId, limit: 6 }),
    getAppointments({ status: "COMPLETED", from: prevMonthStart, to: today, staffId }),
    supabase
      .from("alerts")
      .select("user_id, severity, created_at, patient:profiles!alerts_user_id_fkey(name)")
      .gte("created_at", new Date(Date.now() - 60 * DAY).toISOString())
      .limit(2000)
      .returns<{ user_id: string; severity: AlertSeverity; created_at: string; patient: { name: string } | null }[]>(),
  ]);
  if (alertsRes.error) throw new Error(alertsRes.error.message);

  const upcomingByDay = Array.from({ length: UPCOMING_DAYS }, (_, i) => {
    const date = vnDateKey(i);
    const items = upcoming.filter((a) => a.date === date);
    return {
      date,
      confirmed: items.filter((a) => a.status === "UPCOMING").length,
      requested: items.filter((a) => a.status === "REQUESTED").length,
    };
  });

  const since30 = Date.now() - 30 * DAY;
  const recent = alertsRes.data.filter((a) => new Date(a.created_at).getTime() >= since30);
  const byPatient = new Map<string, { id: string; name: string; count: number }>();
  for (const a of recent) {
    const row = byPatient.get(a.user_id) ?? { id: a.user_id, name: a.patient?.name ?? "", count: 0 };
    row.count++;
    byPatient.set(a.user_id, row);
  }

  return {
    today,
    next,
    upcomingByDay,
    completed: {
      current: completed.filter((a) => a.date >= monthStart).length,
      previous: completed.filter((a) => a.date < monthStart && a.date <= prevMonthSameDay).length,
    },
    alerts: {
      current: recent.length,
      previous: alertsRes.data.length - recent.length,
      urgent: recent.filter((a) => a.severity === "HIGH" || a.severity === "CRITICAL").length,
    },
    alertsByPatient: [...byPatient.values()].sort((a, b) => b.count - a.count),
  };
}
