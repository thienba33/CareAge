-- CareAge — Trang chủ người thân, trạng thái đã đọc cảnh báo riêng, realtime cảnh báo (Phần 7C–7E).

-- ============================================================
-- 7D. Trạng thái "đã đọc" cảnh báo riêng cho từng người xem (người thân không đánh dấu thay người cao tuổi).
-- ============================================================

create table public.alert_reads (
  alert_id  uuid not null references public.alerts (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  read_at   timestamptz not null default now(),
  primary key (alert_id, user_id)
);

alter table public.alert_reads enable row level security;

create policy "alert_reads_select_own" on public.alert_reads for select to authenticated
  using (user_id = (select auth.uid()));
create policy "alert_reads_insert_own" on public.alert_reads for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.alerts a where a.id = alert_id and public.can_view_elderly(a.user_id))
  );
revoke update, delete on public.alert_reads from anon, authenticated;

-- ============================================================
-- 7C. Tổng quan cho người thân: một dòng cho mỗi người cao tuổi đang theo dõi.
-- p_date: ngày theo giờ máy người dùng (giờ server là UTC).
-- ============================================================

create or replace function public.caregiver_dashboard(p_date date)
returns table (
  elderly_id            uuid,
  name                  text,
  phone                 text,
  relationship          text,
  doses                 jsonb,        -- [{ "time": "08:00", "status": "PENDING", "medication": "Amlodipine" }]
  latest_bp             jsonb,        -- { "systolic": 130, "diastolic": 80 }
  latest_bp_at          timestamptz,
  latest_hr             numeric,
  latest_hr_at          timestamptz,
  unread_alerts         integer,
  latest_alert_severity text,
  latest_alert_title    text,
  next_appointment      jsonb         -- { "date": "2026-10-10", "time": "09:00", "facility": "..." }
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if public.current_user_role() is distinct from 'CAREGIVER' then
    raise exception 'Chỉ dành cho người thân' using errcode = '42501';
  end if;

  for r in
    select l.elderly_id as id, l.relationship as rel, p.name as pname, p.phone as pphone
    from public.caregiver_links l
    join public.profiles p on p.id = l.elderly_id
    where l.caregiver_id = auth.uid() and l.status = 'ACTIVE'
    order by l.created_at
  loop
    -- Sinh liều của ngày (nếu người cao tuổi chưa mở app hôm nay) để người thân vẫn thấy lịch uống.
    perform public.ensure_doses_for_date(r.id, p_date);

    return query
    select
      r.id,
      r.pname,
      r.pphone,
      r.rel,
      (select coalesce(jsonb_agg(jsonb_build_object(
                'time', to_char(d.scheduled_time, 'HH24:MI'),
                'status', d.status,
                'medication', m.name) order by d.scheduled_time), '[]'::jsonb)
         from public.medication_doses d
         join public.medications m on m.id = d.medication_id
        where d.user_id = r.id and d.scheduled_date = p_date),
      bp.value, bp.recorded_at,
      (hr.value #>> '{}')::numeric, hr.recorded_at,
      (select count(*)::int from public.alerts a
        where a.user_id = r.id and a.created_at > now() - interval '30 days'
          and not exists (select 1 from public.alert_reads ar where ar.alert_id = a.id and ar.user_id = auth.uid())),
      la.severity, la.title,
      (select jsonb_build_object('date', ap.appointment_date, 'time', to_char(ap.appointment_time, 'HH24:MI'), 'facility', ap.facility)
         from public.appointments ap
        where ap.user_id = r.id and ap.status = 'UPCOMING' and ap.appointment_date >= p_date
        order by ap.appointment_date, ap.appointment_time
        limit 1)
    from (select 1) as one
    left join lateral (
      select m.value, m.recorded_at from public.health_metrics m
      where m.user_id = r.id and m.type = 'BLOOD_PRESSURE' order by m.recorded_at desc limit 1
    ) bp on true
    left join lateral (
      select m.value, m.recorded_at from public.health_metrics m
      where m.user_id = r.id and m.type = 'HEART_RATE' order by m.recorded_at desc limit 1
    ) hr on true
    left join lateral (
      select a.severity, a.title from public.alerts a
      where a.user_id = r.id and a.created_at > now() - interval '30 days'
        and not exists (select 1 from public.alert_reads ar where ar.alert_id = a.id and ar.user_id = auth.uid())
      order by public.severity_rank(a.severity) desc, a.created_at desc
      limit 1
    ) la on true;
  end loop;
end;
$$;

revoke execute on function public.caregiver_dashboard(date) from public, anon;
grant execute on function public.caregiver_dashboard(date) to authenticated;

-- ============================================================
-- 7E. Realtime: người thân nhận cảnh báo mới ngay khi app đang mở (RLS vẫn áp dụng cho realtime).
-- ============================================================

alter publication supabase_realtime add table public.alerts;
