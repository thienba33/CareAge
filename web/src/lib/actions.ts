"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { homeFor, requireAdmin, requireRole, requireStaff } from "./auth";
import { createClient } from "./supabase/server";
import type { AcademicTitle, Role, StaffDegree } from "./labels";
import { getUserDetail, type UserDetail } from "./data";

// Server Actions của web (quản trị + bác sĩ). Mỗi action tự kiểm tra vai trò (không tin phía client); RLS ở Backend chặn thêm lần nữa.

export type ActionState = { ok: boolean; message?: string } | null;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const orNull = (v: string) => (v ? v : null);
const fail = (message: string): ActionState => ({ ok: false, message });

// ---------- Đăng nhập / đăng xuất ----------

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return fail("Vui lòng nhập email và mật khẩu.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return fail(error.code === "user_banned" ? "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị hệ thống." : "Email hoặc mật khẩu không đúng.");
  }
  // Vào thẳng khu theo vai trò: quản trị viên → "/", bác sĩ → "/bs".
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle<{ role: Role }>();
  redirect(profile ? homeFor(profile.role) : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- Người dùng ----------

export async function updateUser(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(form, "id");
  const name = text(form, "name");
  const phone = text(form, "phone");
  if (!name) return fail("Họ tên không được để trống.");
  if (name.length > 100) return fail("Họ tên tối đa 100 ký tự.");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ name, phone: orNull(phone) }).eq("id", id);
  if (error) return fail("Không lưu được. Vui lòng thử lại.");
  revalidatePath("/nguoi-dung");
  return { ok: true, message: "Đã lưu." };
}

// ---------- Phân công bác sĩ ----------

export async function assignDoctor(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const elderlyId = text(form, "elderlyId");
  const staffId = text(form, "staffId");
  if (!staffId) return fail("Vui lòng chọn bác sĩ.");

  const supabase = await createClient();
  // Có thể đã từng phân công (INACTIVE) → kích hoạt lại cùng dòng (unique staff_id + elderly_id).
  const { error } = await supabase.from("staff_assignments").upsert(
    {
      staff_id: staffId,
      elderly_id: elderlyId,
      status: "ACTIVE",
      assigned_at: new Date().toISOString(),
      ended_at: null,
      end_reason: null,
    },
    { onConflict: "staff_id,elderly_id" }
  );
  if (error) return fail("Không phân công được. Vui lòng thử lại.");
  revalidatePath("/bac-si");
  revalidatePath("/");
  return { ok: true, message: "Đã phân công." };
}

export async function endAssignment(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const elderlyId = text(form, "elderlyId");
  const staffId = text(form, "staffId");
  const reason = text(form, "reason");
  if (!reason) return fail("Vui lòng chọn hoặc nhập lý do.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_assignments")
    .update({ status: "INACTIVE", ended_at: new Date().toISOString(), end_reason: reason.slice(0, 500) })
    .eq("staff_id", staffId)
    .eq("elderly_id", elderlyId)
    .eq("status", "ACTIVE");
  if (error) return fail("Không kết thúc được. Vui lòng thử lại.");

  // Như khi bác sĩ tự kết thúc: yêu cầu đặt lịch đang chờ gửi tới bác sĩ này bị từ chối (người thân được báo).
  await supabase
    .from("appointments")
    .update({
      status: "REJECTED",
      reject_reason: "Bác sĩ đã kết thúc theo dõi. Vui lòng đặt lịch với bác sĩ phụ trách khác.",
    })
    .eq("user_id", elderlyId)
    .eq("staff_id", staffId)
    .eq("status", "REQUESTED");

  revalidatePath("/bac-si");
  revalidatePath("/");
  return { ok: true, message: "Đã kết thúc phân công." };
}

// ---------- Bác sĩ ----------

// Quản trị viên sửa hồ sơ của bất kỳ bác sĩ nào; bác sĩ chỉ sửa hồ sơ của chính mình (trang /bs/ho-so).
export async function saveStaffProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireRole(["ADMIN", "MEDICAL_STAFF"]);
  const staffId = text(form, "staffId");
  if (me.role === "MEDICAL_STAFF" && staffId !== me.id) return fail("Bạn chỉ sửa được hồ sơ của chính mình.");
  const years = text(form, "yearsExperience");
  if (years && (!/^\d{1,2}$/.test(years) || Number(years) > 70)) return fail("Số năm kinh nghiệm phải từ 0 đến 70.");

  const supabase = await createClient();
  const { error } = await supabase.from("staff_profiles").upsert(
    {
      user_id: staffId,
      academic_title: (orNull(text(form, "academicTitle")) as AcademicTitle | null) ?? null,
      degree: (orNull(text(form, "degree")) as StaffDegree | null) ?? null,
      specialty: orNull(text(form, "specialty")),
      department: orNull(text(form, "department")),
      room: orNull(text(form, "room")),
      license_number: orNull(text(form, "licenseNumber")),
      years_experience: years ? Number(years) : null,
      working_hours: orNull(text(form, "workingHours")),
      bio: orNull(text(form, "bio")),
    },
    { onConflict: "user_id" }
  );
  if (error) return fail("Không lưu được hồ sơ chuyên môn. Kiểm tra lại độ dài các trường.");

  const { error: wpError } = await supabase
    .from("profiles")
    .update({ workplace: orNull(text(form, "workplace")), workplace_phone: orNull(text(form, "workplacePhone")) })
    .eq("id", staffId);
  if (wpError) return fail("Không lưu được nơi làm việc.");

  revalidatePath("/bac-si");
  revalidatePath("/bs/ho-so");
  return { ok: true, message: "Đã lưu hồ sơ bác sĩ." };
}

// ---------- Lịch khám ----------

// Quản trị viên hoặc bác sĩ. RPC kiểm tra thêm: yêu cầu đã chọn bác sĩ thì chỉ bác sĩ đó (hoặc ADMIN) được duyệt.
export async function reviewRequest(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "MEDICAL_STAFF"]);
  const id = text(form, "id");
  const approve = text(form, "decision") === "approve";
  const reason = text(form, "reason");
  const note = text(form, "note");
  if (!approve && !reason) return fail("Vui lòng nhập lý do từ chối.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_appointment_request", {
    p_id: id,
    p_approve: approve,
    p_reason: approve ? null : reason,
    p_note: approve ? orNull(note) : null,
  });
  if (error) return fail("Không thực hiện được. Yêu cầu có thể đã được xử lý.");
  revalidatePath("/lich-kham");
  revalidatePath("/");
  revalidatePath("/bs", "layout");
  return { ok: true, message: approve ? "Đã xác nhận lịch." : "Đã từ chối yêu cầu." };
}

// ---------- Bác sĩ ----------

// Bác sĩ kết thúc theo dõi một bệnh nhân (→ cựu bệnh nhân). RPC từ chối các yêu cầu đặt lịch đang chờ gửi tới bác sĩ.
export async function endMyAssignment(_: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff();
  const elderlyId = text(form, "elderlyId");
  const reason = text(form, "reason");
  if (!reason) return fail("Vui lòng chọn hoặc nhập lý do.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("end_staff_assignment", { p_elderly_id: elderlyId, p_reason: reason.slice(0, 500) });
  if (error) return fail(error.code === "P0002" ? "Bạn không còn phụ trách bệnh nhân này." : "Không thực hiện được. Vui lòng thử lại.");
  revalidatePath("/bs", "layout");
  redirect("/bs/benh-nhan?tab=cu");
}

// ---------- Menu ⋮ của trang Người dùng ----------

// Chi tiết tài khoản cho popup "Xem chi tiết" (đọc với quyền ADMIN qua RLS).
export async function loadUserDetail(id: string, role: Role): Promise<UserDetail> {
  await requireAdmin();
  return getUserDetail(id, role);
}

// Ngừng điều trị: kết thúc mọi phân công bác sĩ của người cao tuổi + từ chối yêu cầu đặt lịch đang chờ.
export async function stopTreatment(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const elderlyId = text(form, "elderlyId");
  const reason = text(form, "reason");
  if (!reason) return fail("Vui lòng chọn hoặc nhập lý do.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_assignments")
    .update({ status: "INACTIVE", ended_at: new Date().toISOString(), end_reason: reason.slice(0, 500) })
    .eq("elderly_id", elderlyId)
    .eq("status", "ACTIVE");
  if (error) return fail("Không thực hiện được. Vui lòng thử lại.");

  await supabase
    .from("appointments")
    .update({ status: "REJECTED", reject_reason: "Đã ngừng theo dõi điều trị. Vui lòng liên hệ cơ sở y tế khi cần đặt lịch." })
    .eq("user_id", elderlyId)
    .eq("status", "REQUESTED");

  revalidatePath("/nguoi-dung");
  revalidatePath("/bac-si");
  return { ok: true, message: "Đã ngừng điều trị." };
}

// Khoá / mở khoá tài khoản (RPC admin_set_user_locked: chặn đăng nhập qua banned_until, không xoá dữ liệu).
export async function setUserLocked(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(form, "id");
  const locked = text(form, "locked") === "true";
  const reason = text(form, "reason");
  if (locked && !reason) return fail("Vui lòng nhập lý do khoá.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_locked", { p_user_id: id, p_locked: locked, p_reason: locked ? reason : null });
  if (error) {
    return fail(error.code === "CA007" ? "Không thể tự khoá tài khoản của chính mình." : "Không thực hiện được. Vui lòng thử lại.");
  }
  revalidatePath("/nguoi-dung");
  revalidatePath("/bac-si");
  return { ok: true, message: locked ? "Đã khoá tài khoản." : "Đã mở khoá tài khoản." };
}
