import { supabase } from "../config/supabase";
import { LoginPayload, RegisterPayload, REGISTERABLE_ROLES, Role, User } from "../types/auth";
import { toAppError } from "./supabaseError";

// Supabase Auth + bảng profiles. Role/code do Backend (trigger handle_new_user) quyết định,
// client chỉ đọc lại từ profiles — không tin role trong user_metadata.

const PROFILE_COLUMNS = "id, code, name, email, phone, role";

type ProfileRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
};

const toUser = (row: ProfileRow): User => ({
  id: row.id,
  code: row.code,
  name: row.name,
  email: row.email,
  phone: row.phone ?? undefined,
  role: row.role,
});

async function fetchProfile(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .single<ProfileRow>();

  if (error) throw toAppError(error);
  return toUser(data);
}

export async function login({ email, password }: LoginPayload): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw toAppError(error);

  return fetchProfile(data.user.id);
}

export type RegisterResult =
  | { status: "SIGNED_IN"; user: User }
  // Project bật "Confirm email": tài khoản đã tạo nhưng phải xác nhận email trước khi đăng nhập.
  | { status: "NEEDS_EMAIL_CONFIRMATION" };

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  if (!REGISTERABLE_ROLES.includes(payload.role)) {
    throw new Error("Vai trò này không thể tự đăng ký.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
    options: {
      // Chỉ dùng lúc tạo profile; Backend vẫn chặn ADMIN và tự sinh mã người dùng.
      data: { name: payload.name.trim(), phone: payload.phone?.trim() || null, role: payload.role },
    },
  });
  if (error) throw toAppError(error);

  if (!data.session || !data.user) {
    return { status: "NEEDS_EMAIL_CONFIRMATION" };
  }

  return { status: "SIGNED_IN", user: await fetchProfile(data.user.id) };
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Gọi server lỗi (vd. mất mạng) thì Supabase giữ nguyên phiên trong máy — xóa phiên cục bộ để thoát hẳn.
    await supabase.auth.signOut({ scope: "local" });
  }
}

// Khôi phục phiên đã lưu khi mở app. Trả về null nếu chưa đăng nhập.
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toAppError(error);
  if (!data.session) return null;

  return fetchProfile(data.session.user.id);
}

// Báo cho tầng trên khi phiên kết thúc (đăng xuất ở nơi khác, refresh token hết hạn...).
// Không gọi Supabase bên trong callback của onAuthStateChange để tránh deadlock.
export function onSignedOut(callback: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") callback();
  });
  return () => data.subscription.unsubscribe();
}

export type UpdateProfilePayload = {
  name: string;
  phone?: string;
};

export async function updateProfile(userId: string, payload: UpdateProfilePayload): Promise<User> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ name: payload.name.trim(), phone: payload.phone?.trim() || null })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single<ProfileRow>();

  if (error) throw toAppError(error);
  return toUser(data);
}
