import { supabase } from "../config/supabase";
import type { ConditionCategory, ConditionStatus, MedicalCondition } from "../types/medicalCondition";
import { toAppError } from "./supabaseError";

const COLUMNS = "id, user_id, category, name, diagnosed_at, status, note";

type ConditionRow = {
  id: string;
  user_id: string;
  category: ConditionCategory;
  name: string;
  diagnosed_at: string | null;
  status: ConditionStatus;
  note: string | null;
};

const toCondition = (row: ConditionRow): MedicalCondition => ({
  id: row.id,
  userId: row.user_id,
  category: row.category,
  name: row.name,
  diagnosedAt: row.diagnosed_at ?? undefined,
  status: row.status,
  note: row.note ?? undefined,
});

export type ConditionInput = Omit<MedicalCondition, "id" | "userId">;

const toRow = (input: ConditionInput) => ({
  category: input.category,
  name: input.name,
  diagnosed_at: input.diagnosedAt ?? null,
  status: input.status,
  note: input.note ?? null,
});

export async function getConditions(userId: string): Promise<MedicalCondition[]> {
  const { data, error } = await supabase
    .from("medical_conditions")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at")
    .returns<ConditionRow[]>();

  if (error) throw toAppError(error);
  return data.map(toCondition);
}

export async function addCondition(userId: string, input: ConditionInput): Promise<MedicalCondition> {
  const { data, error } = await supabase
    .from("medical_conditions")
    .insert({ user_id: userId, ...toRow(input) })
    .select(COLUMNS)
    .single<ConditionRow>();

  if (error) throw toAppError(error);
  return toCondition(data);
}

export async function updateCondition(id: string, input: ConditionInput): Promise<MedicalCondition> {
  const { data, error } = await supabase
    .from("medical_conditions")
    .update(toRow(input))
    .eq("id", id)
    .select(COLUMNS)
    .single<ConditionRow>();

  if (error) throw toAppError(error);
  return toCondition(data);
}

export async function deleteCondition(id: string): Promise<void> {
  const { error } = await supabase.from("medical_conditions").delete().eq("id", id);
  if (error) throw toAppError(error);
}
