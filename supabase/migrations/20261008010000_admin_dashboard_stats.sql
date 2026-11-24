-- CareAge — Số liệu dashboard của web quản trị (ADMIN): tổng hợp ở Backend, một lần gọi.
-- Ngày tháng tính theo giờ Việt Nam (Asia/Ho_Chi_Minh); timestamptz đổi sang ngày local trước khi so sánh.

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today       date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_month       date := date_trunc('month', v_today)::date;            -- ngày 1 tháng này
  v_prev_month  date := (date_trunc('month', v_today) - interval '1 month')::date;
  v_next_month  date := (date_trunc('month', v_today) + interval '1 month')::date;
begin
  if not public.is_admin() then
    raise exception 'Chỉ dành cho quản trị viên' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'today', v_today,
    'month', v_month,
    'prevMonth', v_prev_month,

    -- ---------- Ô chỉ số: tháng này / tháng trước ----------
    'kpis', jsonb_build_object(
      'newElderly', jsonb_build_object(
        'current',  (select count(*) from public.profiles p where p.role = 'ELDERLY'
                      and (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_month),
        'previous', (select count(*) from public.profiles p where p.role = 'ELDERLY'
                      and (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_prev_month
                      and (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date < v_month),
        'total',    (select count(*) from public.profiles p where p.role = 'ELDERLY')
      ),
      -- Lượt đặt lịch = yêu cầu do người cao tuổi / người thân gửi (requested_by có giá trị), theo ngày gửi.
      'bookings', jsonb_build_object(
        'current',  (select count(*) from public.appointments a where a.requested_by is not null
                      and (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_month),
        'previous', (select count(*) from public.appointments a where a.requested_by is not null
                      and (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_prev_month
                      and (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date < v_month)
      ),
      -- Lượt khám hoàn thành theo ngày khám.
      'completed', jsonb_build_object(
        'current',  (select count(*) from public.appointments a where a.status = 'COMPLETED'
                      and a.appointment_date >= v_month and a.appointment_date < v_next_month),
        'previous', (select count(*) from public.appointments a where a.status = 'COMPLETED'
                      and a.appointment_date >= v_prev_month and a.appointment_date < v_month)
      ),
      'alerts', jsonb_build_object(
        'current',  (select count(*) from public.alerts al
                      where (al.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_month),
        'previous', (select count(*) from public.alerts al
                      where (al.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_prev_month
                        and (al.created_at at time zone 'Asia/Ho_Chi_Minh')::date < v_month),
        'urgentCurrent', (select count(*) from public.alerts al
                           where (al.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_month
                             and al.severity in ('HIGH', 'CRITICAL'))
      ),
      -- Tỉ lệ uống thuốc: liều TAKEN / liều đã đến hạn (TAKEN + SKIPPED + MISSED), 7 ngày qua so với 7 ngày trước.
      'adherence', jsonb_build_object(
        'current',  (select round(100.0 * count(*) filter (where d.status = 'TAKEN') / nullif(count(*), 0), 1)
                       from public.medication_doses d
                      where d.status in ('TAKEN', 'SKIPPED', 'MISSED')
                        and d.scheduled_date > v_today - 7 and d.scheduled_date <= v_today),
        'previous', (select round(100.0 * count(*) filter (where d.status = 'TAKEN') / nullif(count(*), 0), 1)
                       from public.medication_doses d
                      where d.status in ('TAKEN', 'SKIPPED', 'MISSED')
                        and d.scheduled_date > v_today - 14 and d.scheduled_date <= v_today - 7)
      )
    ),

    -- ---------- Bệnh nhân mới theo tháng, 12 tháng gần nhất (cả tháng 0) ----------
    'newElderlyByMonth', (
      select jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'count', coalesce(c.n, 0)) order by m)
      from generate_series(v_month - interval '11 months', v_month, interval '1 month') as m
      left join (
        select date_trunc('month', (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date) as mon, count(*) as n
        from public.profiles p where p.role = 'ELDERLY' group by 1
      ) c on c.mon = m
    ),

    -- ---------- Lượt đặt lịch theo ngày trong tháng: tháng này vs tháng trước ----------
    'bookingsByDay', (
      select jsonb_agg(jsonb_build_object(
               'day', d,
               -- Ngày chưa tới của tháng này để null (không vẽ thành 0).
               'current',  case when v_month + (d - 1) <= v_today
                                then coalesce((select count(*) from public.appointments a where a.requested_by is not null
                                               and (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date = v_month + (d - 1)), 0)
                           end,
               'previous', case when v_prev_month + (d - 1) < v_month
                                then (select count(*) from public.appointments a where a.requested_by is not null
                                      and (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date = v_prev_month + (d - 1))
                           end
             ) order by d)
      from generate_series(1, 31) as d
    ),

    -- ---------- Trạng thái lịch khám có ngày khám trong tháng này ----------
    'appointmentStatus', (
      select jsonb_agg(jsonb_build_object('status', s, 'count', coalesce(c.n, 0)) order by ord)
      from unnest(array['REQUESTED', 'UPCOMING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'MISSED']) with ordinality as t(s, ord)
      left join (
        select a.status, count(*) as n from public.appointments a
        where a.appointment_date >= v_month and a.appointment_date < v_next_month group by 1
      ) c on c.status = t.s
    ),

    -- ---------- Cảnh báo theo mức độ: tháng này vs tháng trước ----------
    'alertsBySeverity', (
      select jsonb_agg(jsonb_build_object(
               'severity', s,
               'current',  (select count(*) from public.alerts al where al.severity = s
                             and (al.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_month),
               'previous', (select count(*) from public.alerts al where al.severity = s
                             and (al.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_prev_month
                             and (al.created_at at time zone 'Asia/Ho_Chi_Minh')::date < v_month)
             ) order by ord)
      from unnest(array['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) with ordinality as t(s, ord)
    ),

    -- ---------- Khối lượng việc của bác sĩ ----------
    'staffWorkload', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', p.name,
               'patients', (select count(*) from public.staff_assignments s
                             where s.staff_id = p.id and s.status = 'ACTIVE'),
               'pending',  (select count(*) from public.appointments a
                             where a.staff_id = p.id and a.status = 'REQUESTED' and a.appointment_date >= v_today)
             ) order by p.code), '[]'::jsonb)
      from public.profiles p where p.role = 'MEDICAL_STAFF'
    ),

    -- ---------- Tỉ lệ uống thuốc theo ngày, 14 ngày gần nhất ----------
    'adherenceByDay', (
      select jsonb_agg(jsonb_build_object(
               'date', day::date,
               'taken', coalesce(c.taken, 0),
               'due',   coalesce(c.due, 0),
               'rate',  case when coalesce(c.due, 0) > 0 then round(100.0 * c.taken / c.due, 1) end
             ) order by day)
      from generate_series(v_today - 13, v_today, interval '1 day') as g(day)
      left join (
        select d.scheduled_date as sd,
               count(*) filter (where d.status = 'TAKEN') as taken,
               count(*) as due
        from public.medication_doses d
        where d.status in ('TAKEN', 'SKIPPED', 'MISSED') and d.scheduled_date > v_today - 14
        group by 1
      ) c on c.sd = g.day::date
    )
  );
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
