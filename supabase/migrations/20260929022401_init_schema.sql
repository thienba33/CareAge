-- CareAge — schema khởi tạo (Phần 0b).
-- Quyền truy cập do RLS quyết định (skill elderly-health-mobile-app mục 3):
--   ELDERLY       → chỉ dữ liệu của chính mình
--   CAREGIVER     → người cao tuổi đã liên kết (caregiver_links, status ACTIVE)
--   MEDICAL_STAFF → người cao tuổi được phân công (staff_assignments, status ACTIVE)
--   ADMIN         → toàn hệ thống
-- Bảng alerts / alert_thresholds thuộc Phần 3, sẽ có migration riêng.

-- ============================================================
-- 1. Tiện ích chung
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Mã người dùng theo role: ELD001, CG001, STA001, ADM001 (khớp ROLE_CODE_PREFIX ở Mobile).
create sequence public.profile_code_seq_admin;
create sequence public.profile_code_seq_elderly;
create sequence public.profile_code_seq_caregiver;
create sequence public.profile_code_seq_medical_staff;

create or replace function public.next_profile_code(p_role text)
returns text
language plpgsql
set search_path = ''
as $$
begin

  return case p_role
    when 'ADMIN'         then 'ADM' || lpad(nextval('public.profile_code_seq_admin')::text, 3, '0')
    when 'ELDERLY'       then 'ELD' || lpad(nextval('public.profile_code_seq_elderly')::text, 3, '0')
    when 'CAREGIVER'     then 'CG'  || lpad(nextval('public.profile_code_seq_caregiver')::text, 3, '0')
    when 'MEDICAL_STAFF' then 'STA' || lpad(nextval('public.profile_code_seq_medical_staff')::text, 3, '0')
  end;
end;
$$;

-- ============================================================
-- 2. Bảng
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  code        text not null unique,
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null,
  phone       text,
  role        text not null check (role in ('ADMIN', 'ELDERLY', 'CAREGIVER', 'MEDICAL_STAFF')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.caregiver_links (
  id            uuid primary key default gen_random_uuid(),
  caregiver_id  uuid not null references public.profiles (id) on delete cascade,
  elderly_id    uuid not null references public.profiles (id) on delete cascade,
  relationship  text not null check (relationship in ('CHILD', 'SPOUSE', 'GRANDCHILD', 'RELATIVE', 'OTHER')),
  status        text not null default 'ACTIVE' check (status in ('PENDING', 'ACTIVE', 'REVOKED')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (caregiver_id, elderly_id)
);

create table public.staff_assignments (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references public.profiles (id) on delete cascade,
  elderly_id   uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  assigned_at  timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (staff_id, elderly_id)
);

create table public.health_profiles (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth  date,
  gender         text check (gender in ('MALE', 'FEMALE', 'OTHER')),
  height_cm      numeric(5, 1) check (height_cm > 0 and height_cm < 300),
  weight_kg      numeric(5, 1) check (weight_kg > 0 and weight_kg < 500),
  blood_type     text check (blood_type in ('A', 'B', 'AB', 'O', 'UNKNOWN')),
  address        text,
  updated_at     timestamptz not null default now()
);

create table public.medical_conditions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  category     text not null check (category in ('CHRONIC', 'HISTORY', 'ALLERGY')),
  name         text not null check (char_length(name) between 1 and 200),
  diagnosed_at date,
  status       text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'RESOLVED')),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.emergency_contacts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 100),
  relationship  text not null,
  phone         text not null check (char_length(phone) between 3 and 20),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.medications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 200),
  dosage             text not null,
  unit               text not null,
  frequency          integer not null check (frequency > 0),
  times              time[] not null default '{}',
  start_date         date not null,
  end_date           date check (end_date is null or end_date >= start_date),
  instructions       text,
  status             text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'COMPLETED')),
  active_ingredient  text,
  indication         text,
  description        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- user_id lặp lại từ medications để RLS và truy vấn theo ngày không cần join.
create table public.medication_doses (
  id              uuid primary key default gen_random_uuid(),
  medication_id   uuid not null references public.medications (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  scheduled_date  date not null,
  scheduled_time  time not null,
  status          text not null default 'PENDING' check (status in ('PENDING', 'TAKEN', 'SKIPPED', 'MISSED')),
  taken_at        timestamptz,
  updated_at      timestamptz not null default now(),
  unique (medication_id, scheduled_date, scheduled_time)
);

create table public.appointments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  appointment_date  date not null,
  appointment_time  time not null,
  facility          text not null,
  facility_phone    text,
  doctor            text,
  reason            text,
  status            text not null default 'UPCOMING' check (status in ('UPCOMING', 'COMPLETED', 'CANCELLED', 'MISSED')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- value: số đơn, riêng BLOOD_PRESSURE là {"systolic": n, "diastolic": n} (khớp MetricValue ở Mobile).
create table public.health_metrics (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  type            text not null check (type in ('BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'SPO2', 'TEMPERATURE', 'WEIGHT')),
  value           jsonb not null,
  unit            text not null,
  recorded_at     timestamptz not null default now(),
  source          text not null check (source in ('HOSPITAL', 'DEVICE')),
  appointment_id  uuid references public.appointments (id) on delete set null,
  device_name     text,
  created_at      timestamptz not null default now(),
  constraint health_metrics_value_shape check (
    (type = 'BLOOD_PRESSURE'
      and jsonb_typeof(value) = 'object'
      and jsonb_typeof(value -> 'systolic') = 'number'
      and jsonb_typeof(value -> 'diastolic') = 'number')
    or (type <> 'BLOOD_PRESSURE' and jsonb_typeof(value) = 'number')
  )
);

-- ============================================================
-- 3. Index
-- ============================================================

create index caregiver_links_elderly_idx     on public.caregiver_links (elderly_id);
create index staff_assignments_elderly_idx   on public.staff_assignments (elderly_id);
create index medical_conditions_user_idx     on public.medical_conditions (user_id);
create index emergency_contacts_user_idx     on public.emergency_contacts (user_id);
create index medications_user_idx            on public.medications (user_id);
create index medication_doses_user_date_idx  on public.medication_doses (user_id, scheduled_date);
create index appointments_user_date_idx      on public.appointments (user_id, appointment_date);
create index health_metrics_user_type_idx    on public.health_metrics (user_id, type, recorded_at desc);

-- ============================================================
-- 4. Trigger updated_at
-- ============================================================

create trigger set_updated_at before update on public.profiles           for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.caregiver_links    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.staff_assignments  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.health_profiles    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.medical_conditions for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.emergency_contacts for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.medications        for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.medication_doses   for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.appointments       for each row execute function public.set_updated_at();

-- ============================================================
-- 5. Hàm kiểm tra quyền (security definer để tránh RLS đệ quy)
-- ============================================================

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'ADMIN', false);
$$;

create or replace function public.is_caregiver_of(p_elderly_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.caregiver_links
    where caregiver_id = auth.uid() and elderly_id = p_elderly_id and status = 'ACTIVE'
  );
$$;

create or replace function public.is_staff_of(p_elderly_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_assignments
    where staff_id = auth.uid() and elderly_id = p_elderly_id and status = 'ACTIVE'
  );
$$;

-- Được xem dữ liệu sức khỏe của một người cao tuổi.
create or replace function public.can_view_elderly(p_elderly_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_elderly_id = auth.uid()
      or public.is_admin()
      or public.is_caregiver_of(p_elderly_id)
      or public.is_staff_of(p_elderly_id);
$$;

-- Được ghi dữ liệu chuyên môn (thuốc, lịch khám, kết quả tái khám): nhân viên y tế được phân công hoặc ADMIN.
create or replace function public.can_manage_medical(p_elderly_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or public.is_staff_of(p_elderly_id);
$$;

-- Hai người có liên kết với nhau (theo cả hai chiều), dùng để xem profile của nhau.
create or replace function public.is_related_user(p_other_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.caregiver_links
    where status = 'ACTIVE'
      and ((caregiver_id = auth.uid() and elderly_id = p_other_id)
        or (elderly_id = auth.uid() and caregiver_id = p_other_id))
  ) or exists (
    select 1 from public.staff_assignments
    where status = 'ACTIVE'
      and ((staff_id = auth.uid() and elderly_id = p_other_id)
        or (elderly_id = auth.uid() and staff_id = p_other_id))
  );
$$;

-- ============================================================
-- 6. Trigger nghiệp vụ
-- ============================================================

-- Tạo profile khi đăng ký. Role lấy từ metadata lúc đăng ký nhưng không bao giờ cho tự đăng ký ADMIN
-- (khớp REGISTERABLE_ROLES ở Mobile). Sau đó role nằm trong profiles, client không sửa được.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'ELDERLY');
  v_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));
begin
  if v_role not in ('ELDERLY', 'CAREGIVER', 'MEDICAL_STAFF') then
    v_role := 'ELDERLY';
  end if;

  insert into public.profiles (id, code, name, email, phone, role)
  values (new.id, public.next_profile_code(v_role), v_name, new.email, new.raw_user_meta_data ->> 'phone', v_role);

  if v_role = 'ELDERLY' then
    insert into public.health_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Đảm bảo liên kết đúng role: caregiver_id là CAREGIVER, staff_id là MEDICAL_STAFF, elderly_id là ELDERLY.
create or replace function public.validate_link_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected text := case tg_table_name when 'caregiver_links' then 'CAREGIVER' else 'MEDICAL_STAFF' end;
  -- Đọc qua jsonb vì mỗi bảng chỉ có một trong hai cột caregiver_id / staff_id.
  v_member_id uuid := (to_jsonb(new) ->> case tg_table_name when 'caregiver_links' then 'caregiver_id' else 'staff_id' end)::uuid;
begin
  if (select role from public.profiles where id = v_member_id) is distinct from v_expected then
    raise exception 'Tài khoản liên kết phải có role %', v_expected using errcode = '23514';
  end if;
  if (select role from public.profiles where id = new.elderly_id) is distinct from 'ELDERLY' then
    raise exception 'elderly_id phải là tài khoản ELDERLY' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validate_link_roles before insert or update on public.caregiver_links
  for each row execute function public.validate_link_roles();
create trigger validate_link_roles before insert or update on public.staff_assignments
  for each row execute function public.validate_link_roles();

-- Thời điểm uống do server ghi, client chỉ đổi status.
create or replace function public.set_dose_taken_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'TAKEN' and old.status is distinct from 'TAKEN' then
    new.taken_at := now();
  elsif new.status <> 'TAKEN' then
    new.taken_at := null;
  end if;
  return new;
end;
$$;

create trigger set_dose_taken_at before update of status on public.medication_doses
  for each row execute function public.set_dose_taken_at();

-- Sinh các liều của một ngày từ lịch thuốc đang ACTIVE, rồi trả về danh sách liều của ngày đó.
-- p_date do client truyền (ngày theo giờ địa phương), vì current_date của server là UTC.
create or replace function public.ensure_doses_for_date(p_user_id uuid, p_date date)
returns setof public.medication_doses
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_view_elderly(p_user_id) then
    raise exception 'Không có quyền truy cập' using errcode = '42501';
  end if;

  insert into public.medication_doses (medication_id, user_id, scheduled_date, scheduled_time)
  select m.id, m.user_id, p_date, t.scheduled_time
  from public.medications m
  cross join lateral unnest(m.times) as t(scheduled_time)
  where m.user_id = p_user_id
    and m.status = 'ACTIVE'
    and m.start_date <= p_date
    and (m.end_date is null or m.end_date >= p_date)
  on conflict (medication_id, scheduled_date, scheduled_time) do nothing;

  return query
    select d.* from public.medication_doses d
    where d.user_id = p_user_id and d.scheduled_date = p_date
    order by d.scheduled_time;
end;
$$;

-- ============================================================
-- 7. Row Level Security
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.caregiver_links    enable row level security;
alter table public.staff_assignments  enable row level security;
alter table public.health_profiles    enable row level security;
alter table public.medical_conditions enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.medications        enable row level security;
alter table public.medication_doses   enable row level security;
alter table public.appointments       enable row level security;
alter table public.health_metrics     enable row level security;

-- profiles: tự xem/sửa của mình; xem người có liên kết; ADMIN xem tất cả.
-- Insert chỉ qua trigger handle_new_user. Cột được sửa giới hạn ở phần GRANT bên dưới.
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin() or public.is_related_user(id));
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Liên kết / phân công: hai bên được xem, chỉ ADMIN được ghi.
create policy "caregiver_links_select" on public.caregiver_links for select to authenticated
  using (caregiver_id = (select auth.uid()) or elderly_id = (select auth.uid()) or public.is_admin());
create policy "caregiver_links_admin_write" on public.caregiver_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "staff_assignments_select" on public.staff_assignments for select to authenticated
  using (staff_id = (select auth.uid()) or elderly_id = (select auth.uid()) or public.is_admin());
create policy "staff_assignments_admin_write" on public.staff_assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- health_profiles: bản thân và nhân viên y tế được phân công được sửa.
create policy "health_profiles_select" on public.health_profiles for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "health_profiles_insert" on public.health_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) or public.can_manage_medical(user_id));
create policy "health_profiles_update" on public.health_profiles for update to authenticated
  using (user_id = (select auth.uid()) or public.can_manage_medical(user_id))
  with check (user_id = (select auth.uid()) or public.can_manage_medical(user_id));

-- medical_conditions: bản thân và nhân viên y tế được phân công được ghi.
create policy "medical_conditions_select" on public.medical_conditions for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "medical_conditions_insert" on public.medical_conditions for insert to authenticated
  with check (user_id = (select auth.uid()) or public.can_manage_medical(user_id));
create policy "medical_conditions_update" on public.medical_conditions for update to authenticated
  using (user_id = (select auth.uid()) or public.can_manage_medical(user_id))
  with check (user_id = (select auth.uid()) or public.can_manage_medical(user_id));
create policy "medical_conditions_delete" on public.medical_conditions for delete to authenticated
  using (user_id = (select auth.uid()) or public.can_manage_medical(user_id));

-- emergency_contacts: người cao tuổi tự quản lý, người liên kết chỉ xem.
create policy "emergency_contacts_select" on public.emergency_contacts for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "emergency_contacts_insert" on public.emergency_contacts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "emergency_contacts_update" on public.emergency_contacts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "emergency_contacts_delete" on public.emergency_contacts for delete to authenticated
  using (user_id = (select auth.uid()));

-- medications / appointments: dữ liệu chuyên môn, chỉ nhân viên y tế được phân công hoặc ADMIN ghi.
create policy "medications_select" on public.medications for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "medications_manage" on public.medications for all to authenticated
  using (public.can_manage_medical(user_id)) with check (public.can_manage_medical(user_id));

create policy "appointments_select" on public.appointments for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "appointments_manage" on public.appointments for all to authenticated
  using (public.can_manage_medical(user_id)) with check (public.can_manage_medical(user_id));

-- medication_doses: insert chỉ qua ensure_doses_for_date; người cao tuổi tự đánh dấu đã uống/bỏ qua.
create policy "medication_doses_select" on public.medication_doses for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "medication_doses_update_self" on public.medication_doses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- health_metrics: người cao tuổi thêm chỉ số từ thiết bị (DEVICE); nhân viên y tế thêm kết quả tái khám (HOSPITAL).
create policy "health_metrics_select" on public.health_metrics for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "health_metrics_insert" on public.health_metrics for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and source = 'DEVICE')
    or (public.can_manage_medical(user_id) and source = 'HOSPITAL')
  );
create policy "health_metrics_manage" on public.health_metrics for update to authenticated
  using (public.can_manage_medical(user_id)) with check (public.can_manage_medical(user_id));
create policy "health_metrics_delete" on public.health_metrics for delete to authenticated
  using (public.can_manage_medical(user_id));

-- ============================================================
-- 8. Quyền cột và quyền gọi hàm
-- ============================================================

-- Client chỉ được sửa tên và số điện thoại; role / code / email không bao giờ sửa được từ app.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (name, phone) on public.profiles to authenticated;

-- Liều thuốc: client chỉ được đổi status (taken_at do trigger ghi).
revoke insert, update, delete on public.medication_doses from anon, authenticated;
grant update (status) on public.medication_doses to authenticated;

-- Hàm nội bộ không được gọi qua RPC.
revoke execute on function public.next_profile_code(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.validate_link_roles() from public, anon, authenticated;

revoke execute on function public.ensure_doses_for_date(uuid, date) from public, anon;
grant execute on function public.ensure_doses_for_date(uuid, date) to authenticated;
