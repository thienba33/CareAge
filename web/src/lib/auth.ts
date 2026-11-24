import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Role } from "./labels";

export type SessionUser = { id: string; name: string; email: string; code: string; role: Role };
export type Admin = SessionUser;

// Trang chủ theo vai trò: quản trị viên → khu quản trị, bác sĩ → khu bác sĩ (/bs); người cao tuổi / người thân dùng app.
export function homeFor(role: Role): string {
  if (role === "ADMIN") return "/";
  if (role === "MEDICAL_STAFF") return "/bs";
  return "/khong-co-quyen";
}

// Người đang đăng nhập + profile (một lần mỗi request — layout, trang và action dùng chung).
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, code, role")
    .eq("id", user.id)
    .maybeSingle<SessionUser>();
  return profile ?? null;
});

// Lớp truy cập dữ liệu (DAL): mọi trang / action gọi một trong các hàm dưới trước.
// Chưa đăng nhập → /login; sai vai trò → về khu của vai trò đó. Quyền thật vẫn do RLS ở Backend.
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export const requireAdmin = () => requireRole(["ADMIN"]);
export const requireStaff = () => requireRole(["MEDICAL_STAFF"]);
