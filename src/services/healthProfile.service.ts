import { supabase } from "../config/supabase";
import type { BloodType, Gender, HealthProfile } from "../types/healthProfile";
import { toAppError } from "./supabaseError";

const COLUMNS = "user_id, date_of_birth, gender, height_cm, weight_kg, blood_type, address";

type HealthProfileRow = {
  user_id: string;
  date_of_birth: string | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: BloodType | null;
  address: string | null;
};

const toHealthProfile = (row: HealthProfileRow): HealthProfile => ({
  userId: row.user_id,
  dateOfBirth: row.date_of_birth ?? undefined,
  gender: row.gender ?? undefined,
  heightCm: row.height_cm ?? undefined,
  weightKg: row.weight_kg ?? undefined,
  bloodType: row.blood_type ?? undefined,
  address: row.address ?? undefined,
});

export async function getHealthProfile(userId: string): Promise<HealthProfile> {
  const { data, error } = await supabase
    .from("health_profiles")
    .select(COLUMNS)
    .eq("user_id", userId)
    .maybeSingle<HealthProfileRow>();

  if (error) throw toAppError(error);
  return data ? toHealthProfile(data) : { userId };
}

export async function updateHealthProfile(
  userId: string,
  input: Omit<HealthProfile, "userId">
): Promise<HealthProfile> {
  // Trường bỏ trống trên form → null để xóa giá trị cũ.
  const { data, error } = await supabase
    .from("health_profiles")
    .upsert({
      user_id: userId,
      date_of_birth: input.dateOfBirth ?? null,
      gender: input.gender ?? null,
      height_cm: input.heightCm ?? null,
      weight_kg: input.weightKg ?? null,
      blood_type: input.bloodType ?? null,
      address: input.address ?? null,
    })
    .select(COLUMNS)
    .single<HealthProfileRow>();

  if (error) throw toAppError(error);
  return toHealthProfile(data);
}
