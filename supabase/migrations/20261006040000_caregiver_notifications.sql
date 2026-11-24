-- CareAge — Hộp thông báo cho người thân (Phần 7F).
-- Backend tạo và lưu thông báo: quên uống thuốc, lịch khám ngày mai, cảnh báo sức khỏe.
-- App chỉ đọc / đánh dấu đã đọc; realtime đẩy thông báo mới tới app đang mở.

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  elderly_id    uuid references public.profiles (id) on delete cascade,
  type          text not null check (type in ('MEDICATION_MISSED', 'APPOINTMENT_TOMORROW', 'HEALTH_ALERT')),
  title         text not null,
  body          text not null,
  data          jsonb not null default '{}'::jsonb,
  -- Chống tạo trùng cho cùng một sự kiện (vd. cùng một liều, cùng một lịch khám).
  dedupe_key    text not null,
  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  unique (recipient_id, dedupe_key)
);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy "notifications_mark_read_own" on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ------------------------------------------------------------
-- Cách người thân gọi người cao tuổi: con → Bố/Mẹ, cháu → Ông/Bà, vợ chồng → Vợ/Chồng; còn lại dùng tên.
-- ------------------------------------------------------------
create or replace function public.kinship_label(p_relationship text, p_gender text, p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    case p_relationship
      when 'CHILD'      then case p_gender when 'FEMALE' then 'Mẹ' when 'MALE' then 'Bố' end
      when 'GRANDCHILD' then case p_gender when 'FEMALE' then 'Bà' when 'MALE' then 'Ông' end
      when 'SPOUSE'     then case p_gender when 'FEMALE' then 'Vợ' when 'MALE' then 'Chồng' end
    end,
    p_name
  );
$$;

-- ------------------------------------------------------------
-- Cảnh báo sức khỏe mới → thông báo cho mọi người thân đang theo dõi.
-- ------------------------------------------------------------
create or replace function public.notify_caregivers_of_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, elderly_id, type, title, body, data, dedupe_key)
  select
    l.caregiver_id,
    new.user_id,
    'HEALTH_ALERT',
    public.kinship_label(l.relationship, hp.gender, p.name) || ': ' || new.title,
    new.message,
    jsonb_build_object('alertId', new.id, 'severity', new.severity),
    'alert:' || new.id
  from public.caregiver_links l
  join public.profiles p on p.id = new.user_id
  left join public.health_profiles hp on hp.user_id = new.user_id
  where l.elderly_id = new.user_id and l.status = 'ACTIVE'
  on conflict (recipient_id, dedupe_key) do nothing;
  return new;
end;
$$;

create trigger notify_caregivers_after_alert
  after insert on public.alerts
  for each row execute function public.notify_caregivers_of_alert();

-- ------------------------------------------------------------
-- Quên uống thuốc: liều PENDING quá giờ 30 phút (giờ VN) → báo người thân, gộp các thuốc cùng giờ.
-- Chạy định kỳ bằng cron. Tự sinh liều hôm nay (nếu người cao tuổi chưa mở app) để không bỏ sót.
-- ------------------------------------------------------------
create or replace function public.notify_missed_doses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now_local timestamp := now() at time zone 'Asia/Ho_Chi_Minh';
  v_today date := v_now_local::date;
  v_count integer;
begin
  insert into public.medication_doses (medication_id, user_id, scheduled_date, scheduled_time)
  select m.id, m.user_id, v_today, t.scheduled_time
  from public.medications m
  cross join lateral unnest(m.times) as t(scheduled_time)
  where m.status = 'ACTIVE'
    and m.start_date <= v_today
    and (m.end_date is null or m.end_date >= v_today)
  on conflict (medication_id, scheduled_date, scheduled_time) do nothing;

  with missed as (
    select
      d.user_id,
      d.scheduled_time,
      string_agg(m.name || ' ' || m.dosage || ' ' || m.unit, ', ' order by m.name) as meds
    from public.medication_doses d
    join public.medications m on m.id = d.medication_id
    where d.status = 'PENDING'
      and d.scheduled_date = v_today
      and (d.scheduled_date + d.scheduled_time) <= v_now_local - interval '30 minutes'
    group by d.user_id, d.scheduled_time
  )
  insert into public.notifications (recipient_id, elderly_id, type, title, body, data, dedupe_key)
  select
    l.caregiver_id,
    x.user_id,
    'MEDICATION_MISSED',
    public.kinship_label(l.relationship, hp.gender, p.name) || ' quên uống thuốc ' || to_char(x.scheduled_time, 'HH24:MI'),
    p.name || ' chưa uống: ' || x.meds || '. Hãy gọi nhắc nhé.',
    jsonb_build_object('date', v_today, 'time', to_char(x.scheduled_time, 'HH24:MI')),
    'missed:' || x.user_id || ':' || v_today || ':' || to_char(x.scheduled_time, 'HH24:MI')
  from missed x
  join public.caregiver_links l on l.elderly_id = x.user_id and l.status = 'ACTIVE'
  join public.profiles p on p.id = x.user_id
  left join public.health_profiles hp on hp.user_id = x.user_id
  on conflict (recipient_id, dedupe_key) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ------------------------------------------------------------
-- Lịch khám ngày mai → báo người thân (cron chạy 18:00 giờ VN).
-- ------------------------------------------------------------
create or replace function public.notify_appointments_tomorrow()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tomorrow date := (now() at time zone 'Asia/Ho_Chi_Minh')::date + 1;
  v_count integer;
begin
  insert into public.notifications (recipient_id, elderly_id, type, title, body, data, dedupe_key)
  select
    l.caregiver_id,
    a.user_id,
    'APPOINTMENT_TOMORROW',
    public.kinship_label(l.relationship, hp.gender, p.name) || ' có lịch khám ngày mai',
    'Lúc ' || to_char(a.appointment_time, 'HH24:MI') || ' tại ' || a.facility
      || coalesce(' với ' || a.doctor, '')
      || coalesce(' — ' || a.reason, '') || '.',
    jsonb_build_object('appointmentId', a.id, 'date', a.appointment_date),
    'appointment:' || a.id
  from public.appointments a
  join public.caregiver_links l on l.elderly_id = a.user_id and l.status = 'ACTIVE'
  join public.profiles p on p.id = a.user_id
  left join public.health_profiles hp on hp.user_id = a.user_id
  where a.status = 'UPCOMING' and a.appointment_date = v_tomorrow
  on conflict (recipient_id, dedupe_key) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.notify_caregivers_of_alert() from public, anon, authenticated;
revoke execute on function public.notify_missed_doses() from public, anon, authenticated;
revoke execute on function public.notify_appointments_tomorrow() from public, anon, authenticated;

-- Mỗi 10 phút kiểm tra liều quên uống; 18:00 giờ VN (= 11:00 UTC) báo lịch khám ngày mai.
select cron.schedule('notify-missed-doses', '*/10 * * * *', $$select public.notify_missed_doses();$$);
select cron.schedule('notify-appointments-tomorrow', '0 11 * * *', $$select public.notify_appointments_tomorrow();$$);

-- Realtime: app người thân nhận thông báo mới ngay khi đang mở.
alter publication supabase_realtime add table public.notifications;
