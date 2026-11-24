-- CareAge — Đặt lịch theo bác sĩ phụ trách.
-- Yêu cầu đặt lịch chỉ chọn trong các bác sĩ đang được phân công (staff_assignments ACTIVE) cho người cao tuổi;
-- cơ sở y tế, số điện thoại và tên bác sĩ do Backend lấy từ hồ sơ bác sĩ — client không tự gửi.
-- Mã lỗi riêng: CA004 bác sĩ không phụ trách người này, CA005 bác sĩ chưa cập nhật nơi làm việc.

-- Nơi làm việc của nhân viên y tế (chỉ có nghĩa với MEDICAL_STAFF; tự sửa qua profiles_update_self hoặc ADMIN).
alter table public.profiles
  add column workplace       text check (char_length(workplace) <= 200),
  add column workplace_phone text check (char_length(workplace_phone) <= 30);

-- Bác sĩ được chọn cho lịch khám (lịch cũ / lịch do Admin tạo có thể để trống).
alter table public.appointments
  add column staff_id uuid references public.profiles (id) on delete set null;

-- ------------------------------------------------------------
-- Bác sĩ đang phụ trách một người cao tuổi: chính người đó, người thân đang liên kết, hoặc ADMIN.
-- security definer vì người thân không đọc được staff_assignments / profiles của bác sĩ qua RLS.
-- ------------------------------------------------------------
create or replace function public.get_assigned_doctors(p_elderly_id uuid)
returns table (id uuid, name text, phone text, workplace text, workplace_phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if p_elderly_id <> (select auth.uid())
     and not public.is_caregiver_of(p_elderly_id)
     and not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  return query
  select p.id, p.name, p.phone, p.workplace, p.workplace_phone
  from public.staff_assignments s
  join public.profiles p on p.id = s.staff_id
  where s.elderly_id = p_elderly_id and s.status = 'ACTIVE'
  order by s.assigned_at;
end;
$$;

revoke execute on function public.get_assigned_doctors(uuid) from public, anon;
grant execute on function public.get_assigned_doctors(uuid) to authenticated;

-- ------------------------------------------------------------
-- Gửi yêu cầu đặt lịch: thay cơ sở y tế / bác sĩ gõ tự do bằng bác sĩ phụ trách.
-- ------------------------------------------------------------
drop function public.request_appointment(uuid, date, time, text, text, text, text);

create or replace function public.request_appointment(
  p_elderly_id uuid,
  p_date date,
  p_time time,
  p_staff_id uuid,
  p_reason text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_now_local timestamp := now() at time zone 'Asia/Ho_Chi_Minh';
  v_doctor record;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not (p_elderly_id = v_uid and public.current_user_role() = 'ELDERLY')
     and not public.is_caregiver_of(p_elderly_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if (p_date + p_time) <= v_now_local then
    raise exception 'Appointment must be in the future' using errcode = 'CA001';
  end if;

  select p.name, p.workplace, p.workplace_phone into v_doctor
  from public.staff_assignments s
  join public.profiles p on p.id = s.staff_id
  where s.staff_id = p_staff_id and s.elderly_id = p_elderly_id and s.status = 'ACTIVE';
  if not found then
    raise exception 'Doctor is not assigned to this elderly' using errcode = 'CA004';
  end if;
  if char_length(trim(coalesce(v_doctor.workplace, ''))) = 0 then
    raise exception 'Doctor has no workplace' using errcode = 'CA005';
  end if;

  if (select count(*) from public.appointments
      where user_id = p_elderly_id and status = 'REQUESTED') >= public.max_pending_appointment_requests() then
    raise exception 'Too many pending requests' using errcode = 'CA003';
  end if;

  insert into public.appointments
    (user_id, appointment_date, appointment_time, facility, facility_phone, doctor, staff_id,
     reason, note, status, requested_by)
  values
    (p_elderly_id, p_date, p_time, trim(v_doctor.workplace), nullif(trim(v_doctor.workplace_phone), ''),
     v_doctor.name, p_staff_id,
     nullif(trim(p_reason), ''), nullif(trim(p_note), ''), 'REQUESTED', v_uid)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.request_appointment(uuid, date, time, uuid, text, text) from public, anon;
grant execute on function public.request_appointment(uuid, date, time, uuid, text, text) to authenticated;
