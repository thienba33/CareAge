import { supabase } from "../config/supabase";
import type { EmergencyContact } from "../types";
import { toAppError } from "./supabaseError";

const COLUMNS = "id, user_id, name, relationship, phone";

type ContactRow = {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
};

const toContact = (row: ContactRow): EmergencyContact => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  relationship: row.relationship,
  phone: row.phone,
});

export type ContactInput = {
  name: string;
  relationship: string;
  phone: string;
};

export async function getContacts(userId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at")
    .returns<ContactRow[]>();

  if (error) throw toAppError(error);
  return data.map(toContact);
}

export async function addContact(userId: string, input: ContactInput): Promise<EmergencyContact> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({ user_id: userId, ...input })
    .select(COLUMNS)
    .single<ContactRow>();

  if (error) throw toAppError(error);
  return toContact(data);
}

export async function updateContact(id: string, input: ContactInput): Promise<EmergencyContact> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .update(input)
    .eq("id", id)
    .select(COLUMNS)
    .single<ContactRow>();

  if (error) throw toAppError(error);
  return toContact(data);
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
  if (error) throw toAppError(error);
}
