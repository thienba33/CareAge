export type Role = "ADMIN" | "ELDERLY" | "CAREGIVER" | "MEDICAL_STAFF";

// Roles a new user is allowed to self-register as (ADMIN is provisioned separately).
export const REGISTERABLE_ROLES: Role[] = ["ELDERLY", "CAREGIVER", "MEDICAL_STAFF"];

export const roleLabel: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  ELDERLY: "Người cao tuổi",
  CAREGIVER: "Người thân / Người chăm sóc",
  MEDICAL_STAFF: "Nhân viên y tế",
};

export type User = {
  id: string;
  code: string; // mã người dùng do Backend sinh, vd: ELD001
  name: string;
  email: string;
  phone?: string;
  role: Role;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
};
