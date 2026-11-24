-- CareAge — Phần cho nhân viên y tế: tổng quan bệnh nhân được phân công + duyệt yêu cầu đặt lịch.
-- Dữ liệu chi tiết (hồ sơ, chỉ số, thuốc, lịch khám, cảnh báo) bác sĩ đã đọc được qua RLS (can_view_elderly).

-- ============================================================
-- 1. Tổng quan: một dòng cho mỗi người cao tuổi đang được phân công (Trang chủ + tab Bệnh nhân).
-- p_date: ngày theo giờ máy người dùng (giờ server là UTC).
-- Yêu cầu chờ duyệt / lịch hôm nay chỉ tính lịch gửi tới chính bác sĩ này hoặc chưa gắn bác sĩ.
-- ============================================================
create or replace function public.staff_dashboard(p_date date)
returns table (
  elderly_id            uuid,
  name                  text,
  code                  text,
  phone                 text,
  date_of_birth         date,
  unread_alerts         integer,
  latest_alert_severity text,
  latest_alert_title    text,
  pending_requests      integer,
  today_appointments    integer,
  next_appointment      jsonb         -- { "date": "2026-10-10", "time": "09:00", "reason": "..." }
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() is distinct from 'MEDICAL_STAFF' then
    raise exception 'Chỉ dành cho nhân viên y tế' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.name,
    p.code,
    p.phone,
    hp.date_of_birth,
    (select count(*)::int from public.alerts a
      where a.user_id = p.id and a.created_at > now() - interval '30 days'
        and not exists (select 1 from public.alert_reads ar where ar.alert_id = a.id and ar.user_id = auth.uid())),
    la.severity,
    la.title,
    (select count(*)::int from public.appointments ap
      where ap.user_id = p.id and ap.status = 'REQUESTED' and ap.appointment_date >= p_date
        and (ap.staff_id is null or ap.staff_id = auth.uid())),
    (select count(*)::int from public.appointments ap
      where ap.user_id = p.id and ap.status = 'UPCOMING' and ap.appointment_date = p_date
        and (ap.staff_id is null or ap.staff_id = auth.uid())),
    (select jsonb_build_object('date', ap.appointment_date, 'time', to_char(ap.appointment_time, 'HH24:MI'), 'reason', ap.reason)
       from public.appointments ap
      where ap.user_id = p.id and ap.status = 'UPCOMING' and ap.appointment_date >= p_date
        and (ap.staff_id is null or ap.staff_id = auth.uid())
      order by ap.appointment_date, ap.appointment_time
      limit 1)
  from public.staff_assignments s
  join public.profiles p on p.id = s.elderly_id
  left join public.health_profiles hp on hp.user_id = p.id
  left join lateral (
    select a.severity, a.title from public.alerts a
    where a.user_id = p.id and a.created_at > now() - interval '30 days'
      and not exists (select 1 from public.alert_reads ar where ar.alert_id = a.id and ar.user_id = auth.uid())
    order by public.severity_rank(a.severity) desc, a.created_at desc
    limit 1
  ) la on true
  where s.staff_id = auth.uid() and s.status = 'ACTIVE'
  order by s.assigned_at;
end;
$$;

revoke execute on function public.staff_dashboard(date) from public, anon;
grant execute on function public.staff_dashboard(date) to authenticated;

-- ============================================================
-- 2. Duyệt yêu cầu: yêu cầu đã chọn bác sĩ cụ thể thì chỉ bác sĩ đó (hoặc ADMIN) được xác nhận / từ chối.
-- Yêu cầu chưa gắn bác sĩ: như trước, nhân viên y tế được phân công hoặc ADMIN.
-- ============================================================
create or replace function public.review_appointment_request(p_id uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_elderly uuid;
  v_staff uuid;
begin
  select user_id, staff_id into v_elderly, v_staff
  from public.appointments where id = p_id and status = 'REQUESTED';
  if v_elderly is null then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if not public.can_manage_medical(v_elderly) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if v_staff is not null and v_staff <> (select auth.uid()) and not public.is_admin() then
    raise exception 'Request is addressed to another doctor' using errcode = '42501';
  end if;

  update public.appointments
  set status = case when p_approve then 'UPCOMING' else 'REJECTED' end,
      reject_reason = case when p_approve then null else nullif(trim(p_reason), '') end
  where id = p_id;
end;
$$;
