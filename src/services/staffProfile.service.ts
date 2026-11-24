import { supabase } from "../config/supabase";
import type { AcademicTitle, StaffDegree, StaffProfile } from "../types/staff";
import { toAppError } from "./supabaseError";

type StaffProfileRow = {
  academic_title: AcademicTitle | null;
  degree: StaffDegree | null;
  specialty: string | null;
  department: string | null;
  room: string | null;
  license_number: string | null;
  years_experience: number | null;
  working_hours: string | null;
  bio: string | null;
};

const PROFILE_COLUMNS =
  "academic_title, degree, specialty, department, room, license_number, years_experience, working_hours, bio";

// Hồ sơ chuyên môn + nơi làm việc của một bác sĩ (RLS: chính bác sĩ, ADMIN, bệnh nhân / người thân liên quan).
export async function getStaffProfile(staffId: string): Promise<StaffProfile> {
  const [profileRes, workplaceRes] = await Promise.all([
    supabase.from("staff_profiles").select(PROFILE_COLUMNS).eq("user_id", staffId).maybeSingle<StaffProfileRow>(),
    supabase
      .from("profiles")
      .select("workplace, workplace_phone")
      .eq("id", staffId)
      .maybeSingle<{ workplace: string | null; workplace_phone: string | null }>(),
  ]);
  if (profileRes.error) throw toAppError(profileRes.error);
  if (workplaceRes.error) throw toAppError(workplaceRes.error);

  const p = profileRes.data;
  const w = workplaceRes.data;
  return {
    academicTitle: p?.academic_title ?? undefined,
    degree: p?.degree ?? undefined,
    specialty: p?.specialty ?? undefined,
    department: p?.department ?? undefined,
    room: p?.room ?? undefined,
    licenseNumber: p?.license_number ?? undefined,
    yearsExperience: p?.years_experience ?? undefined,
    workingHours: p?.working_hours ?? undefined,
    bio: p?.bio ?? undefined,
    workplace: w?.workplace ?? undefined,
    workplacePhone: w?.workplace_phone ?? undefined,
  };
}

const orNull = (v?: string) => (v && v.trim() ? v.trim() : null);

// Bác sĩ tự cập nhật hồ sơ chuyên môn (upsert) và nơi làm việc của mình.
export async function saveStaffProfile(staffId: string, input: StaffProfile): Promise<void> {
  const { error } = await supabase.from("staff_profiles").upsert(
    {
      user_id: staffId,
      academic_title: input.academicTitle ?? null,
      degree: input.degree ?? null,
      specialty: orNull(input.specialty),
      department: orNull(input.department),
      room: orNull(input.room),
      license_number: orNull(input.licenseNumber),
      years_experience: input.yearsExperience ?? null,
      working_hours: orNull(input.workingHours),
      bio: orNull(input.bio),
    },
    { onConflict: "user_id" }
  );
  if (error) throw toAppError(error);

  const { error: workplaceError } = await supabase
    .from("profiles")
    .update({ workplace: orNull(input.workplace), workplace_phone: orNull(input.workplacePhone) })
    .eq("id", staffId);
  if (workplaceError) throw toAppError(workplaceError);
}
