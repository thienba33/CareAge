-- CareAge — Nhắc người thân 2 lần khi người cao tuổi chưa uống thuốc.
--   Lần 1: quá giờ 5 phút  → "Mẹ chưa uống thuốc 08:00"
--   Lần 2: quá giờ 30 phút → "Nhắc lại: Mẹ vẫn chưa uống thuốc 08:00"
-- Lần 1 chỉ gửi trong khoảng 5–30 phút; nếu lần kiểm tra đầu đã quá 30 phút thì chỉ gửi lần 2 (không báo dồn 2 cái).
-- Cron chạy mỗi phút để báo đúng mốc 5 phút.

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
  -- Sinh liều hôm nay (nếu người cao tuổi chưa mở app) để không bỏ sót.
  insert into public.medication_doses (medication_id, user_id, scheduled_date, scheduled_time)
  select m.id, m.user_id, v_today, t.scheduled_time
  from public.medications m
  cross join lateral unnest(m.times) as t(scheduled_time)
  where m.status = 'ACTIVE'
    and m.start_date <= v_today
    and (m.end_date is null or m.end_date >= v_today)
  on conflict (medication_id, scheduled_date, scheduled_time) do nothing;

  with pending as (
    select
      d.user_id,
      d.scheduled_time,
      v_now_local - (d.scheduled_date + d.scheduled_time) as overdue,
      string_agg(m.name || ' ' || m.dosage || ' ' || m.unit, ', ' order by m.name) as meds
    from public.medication_doses d
    join public.medications m on m.id = d.medication_id
    where d.status = 'PENDING'
      and d.scheduled_date = v_today
      and (d.scheduled_date + d.scheduled_time) <= v_now_local - interval '5 minutes'
    group by d.user_id, d.scheduled_date, d.scheduled_time
  ),
  staged as (
    select p.*, case when p.overdue >= interval '30 minutes' then 2 else 1 end as stage
    from pending p
  )
  insert into public.notifications (recipient_id, elderly_id, type, title, body, data, dedupe_key)
  select
    l.caregiver_id,
    s.user_id,
    'MEDICATION_MISSED',
    case s.stage
      when 1 then public.kinship_label(l.relationship, hp.gender, p.name) || ' chưa uống thuốc ' || to_char(s.scheduled_time, 'HH24:MI')
      else 'Nhắc lại: ' || public.kinship_label(l.relationship, hp.gender, p.name) || ' vẫn chưa uống thuốc ' || to_char(s.scheduled_time, 'HH24:MI')
    end,
    case s.stage
      when 1 then p.name || ' chưa uống: ' || s.meds || '. Hãy gọi nhắc nhé.'
      else 'Đã quá 30 phút, ' || p.name || ' vẫn chưa uống: ' || s.meds || '. Hãy gọi ngay.'
    end,
    jsonb_build_object('date', v_today, 'time', to_char(s.scheduled_time, 'HH24:MI'), 'stage', s.stage),
    'missed' || s.stage || ':' || s.user_id || ':' || v_today || ':' || to_char(s.scheduled_time, 'HH24:MI')
  from staged s
  join public.caregiver_links l on l.elderly_id = s.user_id and l.status = 'ACTIVE'
  join public.profiles p on p.id = s.user_id
  left join public.health_profiles hp on hp.user_id = s.user_id
  on conflict (recipient_id, dedupe_key) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.notify_missed_doses() from public, anon, authenticated;

-- Cùng tên job → cập nhật lịch chạy: mỗi phút.
select cron.schedule('notify-missed-doses', '* * * * *', $$select public.notify_missed_doses();$$);
