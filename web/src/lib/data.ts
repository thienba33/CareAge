import "server-only";
import { createClient } from "./supabase/server";
import type { AcademicTitle, AppointmentStatus, Role, StaffDegree } from "./labels";

// Truy vấn cho web quản trị. Chạy với phiên của người đăng nhập — RLS chỉ trả đủ dữ liệu khi là ADMIN.
// Trang luôn gọi requireAdmin() trước. (getAppointments / getStaff(id) dùng chung với khu bác sĩ — xem staffData.ts.)

export type UserRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
  locked_at: string | null;
  locked_reason: string | null;
  // Người cao tuổi: số bác sĩ đang phụ trách (để hiện "Ngừng điều trị").
  activeDoctors: number;
};

// Mọi tài khoản (lọc / tìm / sắp xếp làm ở trình duyệt — xem UsersBrowser).
export async function getUsers(): Promise<UserRow[]> {
  const supabase = await createClient();
  const [usersRes, assignRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, code, name, email, phone, role, created_at, locked_at, locked_reason")
      .order("created_at", { ascending: false })
      .limit(2000)
      .returns<Omit<UserRow, "activeDoctors">[]>(),
    supabase.from("staff_assignments").select("elderly_id").eq("status", "ACTIVE").returns<{ elderly_id: string }[]>(),
  ]);
  if (usersRes.error) throw new Error(usersRes.error.message);
  if (assignRes.error) throw new Error(assignRes.error.message);

  const doctors = new Map<string, number>();
  assignRes.data.forEach((a) => doctors.set(a.elderly_id, (doctors.get(a.elderly_id) ?? 0) + 1));
  return usersRes.data.map((u) => ({ ...u, activeDoctors: doctors.get(u.id) ?? 0 }));
}

// ---------- Chi tiết một tài khoản (popup "Xem chi tiết") ----------

export type UserDetail = {
  elderly?: {
    dateOfBirth: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    doctors: { name: string; since: string }[];
    caregivers: { name: string; phone: string | null; relationship: string }[];
    nextAppointment: { date: string; time: string; reason: string | null; doctor: string | null } | null;
    pendingRequests: number;
    alerts30Days: number;
  };
  caregiver?: { elderly: { name: string; code: string; relationship: string }[] };
  staff?: {
    academicTitle: AcademicTitle | null;
    degree: StaffDegree | null;
    specialty: string | null;
    department: string | null;
    room: string | null;
    workplace: string | null;
    patients: { name: string; code: string }[];
  };
};

export async function getUserDetail(id: string, role: Role): Promise<UserDetail> {
  const supabase = await createClient();

  if (role === "ELDERLY") {
    const today = new Date().toISOString().slice(0, 10);
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [hp, doctors, caregivers, next, pending, alerts] = await Promise.all([
      supabase.from("health_profiles").select("date_of_birth, gender").eq("user_id", id).maybeSingle(),
      supabase
        .from("staff_assignments")
        .select("assigned_at, staff:profiles!staff_assignments_staff_id_fkey(name)")
        .eq("elderly_id", id)
        .eq("status", "ACTIVE")
        .returns<{ assigned_at: string; staff: { name: string } | null }[]>(),
      supabase
        .from("caregiver_links")
        .select("relationship, caregiver:profiles!caregiver_links_caregiver_id_fkey(name, phone)")
        .eq("elderly_id", id)
        .eq("status", "ACTIVE")
        .returns<{ relationship: string; caregiver: { name: string; phone: string | null } | null }[]>(),
      supabase
        .from("appointments")
        .select("appointment_date, appointment_time, reason, doctor")
        .eq("user_id", id)
        .eq("status", "UPCOMING")
        .gte("appointment_date", today)
        .order("appointment_date")
        .order("appointment_time")
        .limit(1)
        .maybeSingle<{ appointment_date: string; appointment_time: string; reason: string | null; doctor: string | null }>(),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("user_id", id).eq("status", "REQUESTED"),
      supabase.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", id).gte("created_at", since30),
    ]);
    return {
      elderly: {
        dateOfBirth: hp.data?.date_of_birth ?? null,
        gender: hp.data?.gender ?? null,
        doctors: (doctors.data ?? []).map((d) => ({ name: d.staff?.name ?? "", since: d.assigned_at })),
        caregivers: (caregivers.data ?? []).map((c) => ({
          name: c.caregiver?.name ?? "",
          phone: c.caregiver?.phone ?? null,
          relationship: c.relationship,
        })),
        nextAppointment: next.data
          ? {
              date: next.data.appointment_date,
              time: next.data.appointment_time.slice(0, 5),
              reason: next.data.reason,
              doctor: next.data.doctor,
            }
          : null,
        pendingRequests: pending.count ?? 0,
        alerts30Days: alerts.count ?? 0,
      },
    };
  }

  if (role === "CAREGIVER") {
    const { data } = await supabase
      .from("caregiver_links")
      .select("relationship, elderly:profiles!caregiver_links_elderly_id_fkey(name, code)")
      .eq("caregiver_id", id)
      .eq("status", "ACTIVE")
      .returns<{ relationship: string; elderly: { name: string; code: string } | null }[]>();
    return {
      caregiver: {
        elderly: (data ?? []).map((l) => ({ name: l.elderly?.name ?? "", code: l.elderly?.code ?? "", relationship: l.relationship })),
      },
    };
  }

  if (role === "MEDICAL_STAFF") {
    const [sp, wp, patients] = await Promise.all([
      supabase
        .from("staff_profiles")
        .select("academic_title, degree, specialty, department, room")
        .eq("user_id", id)
        .maybeSingle<{
          academic_title: AcademicTitle | null;
          degree: StaffDegree | null;
          specialty: string | null;
          department: string | null;
          room: string | null;
        }>(),
      supabase.from("profiles").select("workplace").eq("id", id).maybeSingle<{ workplace: string | null }>(),
      supabase
        .from("staff_assignments")
        .select("elderly:profiles!staff_assignments_elderly_id_fkey(name, code)")
        .eq("staff_id", id)
        .eq("status", "ACTIVE")
        .returns<{ elderly: { name: string; code: string } | null }[]>(),
    ]);
    return {
      staff: {
        academicTitle: sp.data?.academic_title ?? null,
        degree: sp.data?.degree ?? null,
        specialty: sp.data?.specialty ?? null,
        department: sp.data?.department ?? null,
        room: sp.data?.room ?? null,
        workplace: wp.data?.workplace ?? null,
        patients: (patients.data ?? []).filter((p) => p.elderly).map((p) => ({ name: p.elderly!.name, code: p.elderly!.code })),
      },
    };
  }

  return {};
}

export type StaffOption = { id: string; code: string; name: string; specialty: string | null };

export type AssignmentRow = {
  staffId: string;
  staffName: string;
  status: "ACTIVE" | "INACTIVE";
  assignedAt: string;
  endedAt: string | null;
  endReason: string | null;
};

export type ElderlyAssignment = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  active: AssignmentRow[];
  former: AssignmentRow[];
};

export async function getAssignments(): Promise<{ elderly: ElderlyAssignment[]; staff: StaffOption[] }> {
  const supabase = await createClient();
  const [elderlyRes, assignRes, staffRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, code, name, phone")
      .eq("role", "ELDERLY")
      .order("code")
      .returns<{ id: string; code: string; name: string; phone: string | null }[]>(),
    supabase
      .from("staff_assignments")
      .select("elderly_id, staff_id, status, assigned_at, ended_at, end_reason, staff:profiles!staff_assignments_staff_id_fkey(name)")
      .returns<
        {
          elderly_id: string;
          staff_id: string;
          status: "ACTIVE" | "INACTIVE";
          assigned_at: string;
          ended_at: string | null;
          end_reason: string | null;
          staff: { name: string } | null;
        }[]
      >(),
    getStaffOptions(),
  ]);
  if (elderlyRes.error) throw new Error(elderlyRes.error.message);
  if (assignRes.error) throw new Error(assignRes.error.message);

  const elderly = elderlyRes.data.map((e) => {
    const rows = assignRes.data
      .filter((a) => a.elderly_id === e.id)
      .map((a) => ({
        staffId: a.staff_id,
        staffName: a.staff?.name ?? "",
        status: a.status,
        assignedAt: a.assigned_at,
        endedAt: a.ended_at,
        endReason: a.end_reason,
      }));
    return { ...e, active: rows.filter((r) => r.status === "ACTIVE"), former: rows.filter((r) => r.status === "INACTIVE") };
  });
  return { elderly, staff: staffRes };
}

async function getStaffOptions(): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, code, name, staff_profiles(specialty)")
    .eq("role", "MEDICAL_STAFF")
    .order("code")
    .returns<{ id: string; code: string; name: string; staff_profiles: { specialty: string | null } | null }[]>();
  if (error) throw new Error(error.message);
  return data.map((s) => ({ id: s.id, code: s.code, name: s.name, specialty: s.staff_profiles?.specialty ?? null }));
}

export type StaffRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  workplace: string | null;
  workplacePhone: string | null;
  activePatients: number;
  // Bệnh nhân đang phụ trách (phân công ACTIVE), mới phân công trước.
  patients: { id: string; code: string; name: string; phone: string | null; assignedAt: string }[];
  profile: {
    academicTitle: AcademicTitle | null;
    degree: StaffDegree | null;
    specialty: string | null;
    department: string | null;
    room: string | null;
    licenseNumber: string | null;
    yearsExperience: number | null;
    workingHours: string | null;
    bio: string | null;
  };
};

// id: chỉ một bác sĩ (trang Hồ sơ của khu bác sĩ).
export async function getStaff(id?: string): Promise<StaffRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, code, name, email, phone, workplace, workplace_phone, " +
        "staff_profiles(academic_title, degree, specialty, department, room, license_number, years_experience, working_hours, bio), " +
        "assignments:staff_assignments!staff_assignments_staff_id_fkey(status, assigned_at, elderly:profiles!staff_assignments_elderly_id_fkey(id, code, name, phone))"
    )
    .eq("role", "MEDICAL_STAFF")
    .order("code");
  if (id) query = query.eq("id", id);
  const { data, error } = await query.returns<
      {
        id: string;
        code: string;
        name: string;
        email: string;
        phone: string | null;
        workplace: string | null;
        workplace_phone: string | null;
        staff_profiles: {
          academic_title: AcademicTitle | null;
          degree: StaffDegree | null;
          specialty: string | null;
          department: string | null;
          room: string | null;
          license_number: string | null;
          years_experience: number | null;
          working_hours: string | null;
          bio: string | null;
        } | null;
        assignments: {
          status: string;
          assigned_at: string;
          elderly: { id: string; code: string; name: string; phone: string | null } | null;
        }[];
      }[]
    >();
  if (error) throw new Error(error.message);
  return data.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    email: s.email,
    phone: s.phone,
    workplace: s.workplace,
    workplacePhone: s.workplace_phone,
    activePatients: s.assignments.filter((a) => a.status === "ACTIVE").length,
    patients: s.assignments
      .filter((a) => a.status === "ACTIVE" && a.elderly)
      .sort((a, b) => b.assigned_at.localeCompare(a.assigned_at))
      .map((a) => ({ ...a.elderly!, assignedAt: a.assigned_at })),
    profile: {
      academicTitle: s.staff_profiles?.academic_title ?? null,
      degree: s.staff_profiles?.degree ?? null,
      specialty: s.staff_profiles?.specialty ?? null,
      department: s.staff_profiles?.department ?? null,
      room: s.staff_profiles?.room ?? null,
      licenseNumber: s.staff_profiles?.license_number ?? null,
      yearsExperience: s.staff_profiles?.years_experience ?? null,
      workingHours: s.staff_profiles?.working_hours ?? null,
      bio: s.staff_profiles?.bio ?? null,
    },
  }));
}

export type AppointmentRow = {
  id: string;
  date: string;
  time: string;
  facility: string;
  doctor: string | null;
  reason: string | null;
  note: string | null;
  status: AppointmentStatus;
  rejectReason: string | null;
  staffNote: string | null;
  patientId: string;
  patientName: string;
  patientCode: string;
};

// staffId: khu bác sĩ — chỉ lịch gửi tới bác sĩ này hoặc chưa gắn bác sĩ (RLS đã lọc theo bệnh nhân được phân công).
export async function getAppointments(filter: {
  status?: AppointmentStatus;
  statuses?: AppointmentStatus[];
  from?: string;
  to?: string;
  staffId?: string;
  patientId?: string;
  limit?: number;
}): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      "id, user_id, appointment_date, appointment_time, facility, doctor, reason, note, status, reject_reason, staff_note, " +
        "patient:profiles!appointments_user_id_fkey(name, code)"
    )
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(filter.limit ?? 300);
  if (filter.staffId) query = query.or(`staff_id.is.null,staff_id.eq.${filter.staffId}`);
  if (filter.patientId) query = query.eq("user_id", filter.patientId);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.statuses) query = query.in("status", filter.statuses);
  if (filter.from) query = query.gte("appointment_date", filter.from);
  if (filter.to) query = query.lte("appointment_date", filter.to);
  const { data, error } = await query.returns<
    {
      id: string;
      user_id: string;
      appointment_date: string;
      appointment_time: string;
      facility: string;
      doctor: string | null;
      reason: string | null;
      note: string | null;
      status: AppointmentStatus;
      reject_reason: string | null;
      staff_note: string | null;
      patient: { name: string; code: string } | null;
    }[]
  >();
  if (error) throw new Error(error.message);
  return data.map((a) => ({
    id: a.id,
    date: a.appointment_date,
    time: a.appointment_time.slice(0, 5),
    facility: a.facility,
    doctor: a.doctor,
    reason: a.reason,
    note: a.note,
    status: a.status,
    rejectReason: a.reject_reason,
    staffNote: a.staff_note,
    patientId: a.user_id,
    patientName: a.patient?.name ?? "",
    patientCode: a.patient?.code ?? "",
  }));
}

// ---------- Dashboard (RPC admin_dashboard_stats) ----------

type Compare = { current: number; previous: number };

export type DashboardStats = {
  today: string;
  month: string;
  prevMonth: string;
  kpis: {
    newElderly: Compare & { total: number };
    bookings: Compare;
    completed: Compare;
    alerts: Compare & { urgentCurrent: number };
    adherence: { current: number | null; previous: number | null };
  };
  newElderlyByMonth: { month: string; count: number }[];
  bookingsByDay: { day: number; current: number | null; previous: number | null }[];
  appointmentStatus: { status: AppointmentStatus; count: number }[];
  alertsBySeverity: { severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; current: number; previous: number }[];
  staffWorkload: { name: string; patients: number; pending: number }[];
  adherenceByDay: { date: string; taken: number; due: number; rate: number | null }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw new Error(error.message);
  return data as DashboardStats;
}
