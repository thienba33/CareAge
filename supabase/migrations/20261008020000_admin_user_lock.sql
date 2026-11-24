-- CareAge — Quản trị viên khoá / mở khoá tài khoản (thay cho xoá: giữ nguyên dữ liệu y tế, mở khoá lại được).
-- Khoá = đặt auth.users.banned_until (GoTrue từ chối đăng nhập và làm mới phiên của người bị cấm) + ghi lý do ở profiles.
-- Không cần service_role key ở web: hàm security definer, chỉ ADMIN gọi được.

alter table public.profiles
  add column locked_at     timestamptz,
  add column locked_reason text check (char_length(locked_reason) <= 500);

create or replace function public.admin_set_user_locked(p_user_id uuid, p_locked boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_reason text := nullif(trim(p_reason), '');
begin
  if not public.is_admin() then
    raise exception 'Chỉ dành cho quản trị viên' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'Không thể tự khoá tài khoản của mình' using errcode = 'CA007';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if v_role is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  if p_locked then
    if v_reason is null then
      raise exception 'Reason is required' using errcode = 'CA006';
    end if;

    -- Mốc thời gian rất xa (không dùng 'infinity': GoTrue viết bằng Go không đọc được, trả lỗi schema thay vì user_banned).
    update auth.users set banned_until = now() + interval '100 years' where id = p_user_id;
    update public.profiles set locked_at = now(), locked_reason = v_reason where id = p_user_id;

    -- Bác sĩ bị khoá: kết thúc phân công + từ chối yêu cầu đang chờ gửi tới bác sĩ (người thân được báo qua trigger).
    if v_role = 'MEDICAL_STAFF' then
      update public.staff_assignments
      set status = 'INACTIVE', ended_at = now(), end_reason = 'Tài khoản bác sĩ đã bị khoá'
      where staff_id = p_user_id and status = 'ACTIVE';

      update public.appointments
      set status = 'REJECTED', reject_reason = 'Bác sĩ hiện không tiếp nhận lịch. Vui lòng đặt lịch với bác sĩ phụ trách khác.'
      where staff_id = p_user_id and status = 'REQUESTED';
    end if;
  else
    update auth.users set banned_until = null where id = p_user_id;
    update public.profiles set locked_at = null, locked_reason = null where id = p_user_id;
  end if;
end;
$$;

revoke execute on function public.admin_set_user_locked(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_user_locked(uuid, boolean, text) to authenticated;
