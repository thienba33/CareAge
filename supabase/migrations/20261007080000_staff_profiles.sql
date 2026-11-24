-- CareAge — Hồ sơ chuyên môn của nhân viên y tế: học hàm / học vị, chuyên khoa, khoa, phòng khám,
-- chứng chỉ hành nghề, kinh nghiệm, giờ làm việc, giới thiệu.
-- Cơ sở y tế + hotline vẫn ở profiles.workplace / workplace_phone (đặt lịch đang dùng).

create table public.staff_profiles (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  academic_title    text check (academic_title in ('GS', 'PGS')),
  degree            text check (degree in ('BS', 'BSCKI', 'BSCKII', 'THS', 'TS', 'DD', 'KTV')),
  specialty         text check (char_length(specialty) <= 100),
  department        text check (char_length(department) <= 100),
  room              text check (char_length(room) <= 50),
  license_number    text check (char_length(license_number) <= 50),
  years_experience  integer check (years_experience between 0 and 70),
  working_hours     text check (char_length(working_hours) <= 200),
  bio               text check (char_length(bio) <= 1000),
  updated_at        timestamptz not null default now()
);

create trigger set_updated_at before update on public.staff_profiles
  for each row execute function public.set_updated_at();

-- Được xem hồ sơ chuyên môn của một bác sĩ: chính bác sĩ, ADMIN, bệnh nhân đang được bác sĩ phụ trách
-- và người thân của những bệnh nhân đó.
create or replace function public.can_view_staff_profile(p_staff_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_staff_id = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.staff_assignments s
        where s.staff_id = p_staff_id and s.status = 'ACTIVE'
          and (s.elderly_id = auth.uid() or public.is_caregiver_of(s.elderly_id))
      );
$$;

alter table public.staff_profiles enable row level security;

create policy "staff_profiles_select" on public.staff_profiles for select to authenticated
  using (public.can_view_staff_profile(user_id));
-- Chỉ chính nhân viên y tế (role MEDICAL_STAFF) hoặc ADMIN được tạo / sửa.
create policy "staff_profiles_insert" on public.staff_profiles for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and public.current_user_role() = 'MEDICAL_STAFF') or public.is_admin()
  );
create policy "staff_profiles_update" on public.staff_profiles for update to authenticated
  using ((user_id = (select auth.uid()) and public.current_user_role() = 'MEDICAL_STAFF') or public.is_admin())
  with check ((user_id = (select auth.uid()) and public.current_user_role() = 'MEDICAL_STAFF') or public.is_admin());

revoke delete on public.staff_profiles from anon, authenticated;

-- Bác sĩ tự cập nhật nơi làm việc (profiles chỉ cấp quyền sửa name, phone — xem init_schema mục 8).
-- Policy profiles_update_self vẫn giới hạn chỉ sửa được dòng của chính mình.
grant update (workplace, workplace_phone) on public.profiles to authenticated;

-- ------------------------------------------------------------
-- Danh sách bác sĩ phụ trách (form đặt lịch): thêm học vị, chuyên khoa, phòng khám.
-- Đổi kiểu trả về nên phải drop rồi tạo lại.
-- ------------------------------------------------------------
drop function public.get_assigned_doctors(uuid);

create or replace function public.get_assigned_doctors(p_elderly_id uuid)
returns table (
  id uuid, name text, phone text, workplace text, workplace_phone text,
  academic_title text, degree text, specialty text, room text
)
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
  select p.id, p.name, p.phone, p.workplace, p.workplace_phone,
         sp.academic_title, sp.degree, sp.specialty, sp.room
  from public.staff_assignments s
  join public.profiles p on p.id = s.staff_id
  left join public.staff_profiles sp on sp.user_id = p.id
  where s.elderly_id = p_elderly_id and s.status = 'ACTIVE'
  order by s.assigned_at;
end;
$$;

revoke execute on function public.get_assigned_doctors(uuid) from public, anon;
grant execute on function public.get_assigned_doctors(uuid) to authenticated;
