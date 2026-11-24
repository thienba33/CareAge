-- CareAge — Web quản trị bệnh viện (ADMIN): số liệu tổng quan + quyền sửa hồ sơ người dùng.
-- Các bảng còn lại ADMIN đã đọc / ghi được qua is_admin() trong RLS (staff_assignments, staff_profiles,
-- appointments, review_appointment_request...).

-- ADMIN sửa hồ sơ người khác. Cột được sửa vẫn bị giới hạn bởi quyền cột (name, phone, workplace,
-- workplace_phone) — role / email / code không đổi được từ client.
create policy "profiles_admin_update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Số liệu trang Tổng quan.
-- ------------------------------------------------------------
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Chỉ dành cho quản trị viên' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'elderly',            (select count(*) from public.profiles where role = 'ELDERLY'),
    'caregivers',         (select count(*) from public.profiles where role = 'CAREGIVER'),
    'staff',              (select count(*) from public.profiles where role = 'MEDICAL_STAFF'),
    'unassignedElderly',  (select count(*) from public.profiles p
                            where p.role = 'ELDERLY'
                              and not exists (select 1 from public.staff_assignments s
                                              where s.elderly_id = p.id and s.status = 'ACTIVE')),
    'pendingRequests',    (select count(*) from public.appointments
                            where status = 'REQUESTED' and appointment_date >= current_date),
    'upcomingThisWeek',   (select count(*) from public.appointments
                            where status = 'UPCOMING' and appointment_date between current_date and current_date + 6),
    'alertsLast7Days',    (select count(*) from public.alerts where created_at > now() - interval '7 days'),
    'urgentAlertsLast7Days', (select count(*) from public.alerts
                               where created_at > now() - interval '7 days' and severity in ('HIGH', 'CRITICAL'))
  );
end;
$$;

revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
