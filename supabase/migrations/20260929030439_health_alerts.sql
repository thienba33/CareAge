-- CareAge — cảnh báo sức khỏe (Phần 3).
-- Ngưỡng theo dõi là cấu hình của Backend; trigger tự sinh cảnh báo khi có chỉ số mới vượt ngưỡng.
-- Mobile chỉ hiển thị cảnh báo, không tự đánh giá chỉ số và không đưa ra chẩn đoán (skill mục 15, 26).

-- ============================================================
-- 1. Bảng
-- ============================================================

-- user_id NULL = ngưỡng mặc định cho mọi người. Nếu một người có ngưỡng riêng cho một loại chỉ số
-- thì chỉ dùng ngưỡng riêng của người đó cho loại chỉ số ấy.
-- field: 'value' cho chỉ số một số; 'systolic' / 'diastolic' cho huyết áp.
create table public.alert_thresholds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete cascade,
  metric_type  text not null check (metric_type in ('BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'SPO2', 'TEMPERATURE', 'WEIGHT')),
  field        text not null default 'value' check (field in ('value', 'systolic', 'diastolic')),
  direction    text not null check (direction in ('ABOVE', 'BELOW')),
  limit_value  numeric not null,
  severity     text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique nulls not distinct (user_id, metric_type, field, direction, severity)
);

create table public.alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  type         text not null default 'ABNORMAL_METRIC' check (type in ('ABNORMAL_METRIC')),
  severity     text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title        text not null,
  message      text not null,
  metric_type  text,
  metric_id    uuid references public.health_metrics (id) on delete cascade,
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  unique (metric_id)
);

create index alert_thresholds_lookup_idx on public.alert_thresholds (metric_type, user_id);
create index alerts_user_created_idx on public.alerts (user_id, created_at desc);

create trigger set_updated_at before update on public.alert_thresholds
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. Ngưỡng mặc định (khoảng theo dõi chung cho người cao tuổi, bác sĩ có thể đặt ngưỡng riêng)
-- Không đặt mức 140/90 làm mặc định để tránh cảnh báo hằng ngày với người đã được chẩn đoán tăng huyết áp.
-- ============================================================

insert into public.alert_thresholds (user_id, metric_type, field, direction, limit_value, severity) values
  (null, 'BLOOD_PRESSURE', 'systolic',  'ABOVE', 160,  'HIGH'),
  (null, 'BLOOD_PRESSURE', 'systolic',  'ABOVE', 180,  'CRITICAL'),
  (null, 'BLOOD_PRESSURE', 'systolic',  'BELOW', 90,   'MEDIUM'),
  (null, 'BLOOD_PRESSURE', 'diastolic', 'ABOVE', 100,  'HIGH'),
  (null, 'BLOOD_PRESSURE', 'diastolic', 'ABOVE', 120,  'CRITICAL'),
  (null, 'BLOOD_PRESSURE', 'diastolic', 'BELOW', 60,   'MEDIUM'),
  (null, 'HEART_RATE',     'value',     'ABOVE', 100,  'MEDIUM'),
  (null, 'HEART_RATE',     'value',     'ABOVE', 120,  'HIGH'),
  (null, 'HEART_RATE',     'value',     'BELOW', 50,   'MEDIUM'),
  (null, 'HEART_RATE',     'value',     'BELOW', 40,   'HIGH'),
  (null, 'SPO2',           'value',     'BELOW', 94,   'MEDIUM'),
  (null, 'SPO2',           'value',     'BELOW', 90,   'HIGH'),
  (null, 'SPO2',           'value',     'BELOW', 85,   'CRITICAL'),
  (null, 'BLOOD_GLUCOSE',  'value',     'ABOVE', 180,  'MEDIUM'),
  (null, 'BLOOD_GLUCOSE',  'value',     'ABOVE', 250,  'HIGH'),
  (null, 'BLOOD_GLUCOSE',  'value',     'BELOW', 70,   'HIGH'),
  (null, 'BLOOD_GLUCOSE',  'value',     'BELOW', 54,   'CRITICAL'),
  (null, 'TEMPERATURE',    'value',     'ABOVE', 37.5, 'LOW'),
  (null, 'TEMPERATURE',    'value',     'ABOVE', 38.5, 'MEDIUM'),
  (null, 'TEMPERATURE',    'value',     'ABOVE', 39.5, 'HIGH'),
  (null, 'TEMPERATURE',    'value',     'BELOW', 35.5, 'MEDIUM');

-- ============================================================
-- 3. Đánh giá chỉ số và sinh cảnh báo
-- ============================================================

create or replace function public.severity_rank(p_severity text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_severity when 'LOW' then 1 when 'MEDIUM' then 2 when 'HIGH' then 3 when 'CRITICAL' then 4 else 0 end;
$$;

create or replace function public.metric_label(p_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'BLOOD_PRESSURE' then 'Huyết áp'
    when 'HEART_RATE'     then 'Nhịp tim'
    when 'BLOOD_GLUCOSE'  then 'Đường huyết'
    when 'SPO2'           then 'SpO2'
    when 'TEMPERATURE'    then 'Nhiệt độ'
    when 'WEIGHT'         then 'Cân nặng'
    else p_type
  end;
$$;

-- Tạo tối đa một cảnh báo cho một lần đo (mức nghiêm trọng cao nhất trong các ngưỡng bị vượt).
create or replace function public.evaluate_metric(p_metric_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_metric    public.health_metrics;
  v_severity  text;
  v_display   text;
begin
  select * into v_metric from public.health_metrics where id = p_metric_id;
  if not found then return; end if;

  with applicable as (
    select t.*
    from public.alert_thresholds t
    where t.metric_type = v_metric.type
      and (
        t.user_id = v_metric.user_id
        or (t.user_id is null and not exists (
          select 1 from public.alert_thresholds own
          where own.user_id = v_metric.user_id and own.metric_type = v_metric.type
        ))
      )
  ),
  measured as (
    select a.*,
      case a.field
        when 'value' then case when jsonb_typeof(v_metric.value) = 'number' then (v_metric.value #>> '{}')::numeric end
        else (v_metric.value ->> a.field)::numeric
      end as measured_value
    from applicable a
  )
  select severity into v_severity
  from measured
  where measured_value is not null
    and ((direction = 'ABOVE' and measured_value > limit_value)
      or (direction = 'BELOW' and measured_value < limit_value))
  order by public.severity_rank(severity) desc
  limit 1;

  if v_severity is null then return; end if;

  v_display := case
    when v_metric.type = 'BLOOD_PRESSURE'
      then (v_metric.value ->> 'systolic') || '/' || (v_metric.value ->> 'diastolic')
    else v_metric.value #>> '{}'
  end || ' ' || v_metric.unit;

  insert into public.alerts (user_id, severity, title, message, metric_type, metric_id, created_at)
  values (
    v_metric.user_id,
    v_severity,
    public.metric_label(v_metric.type) || ' nằm ngoài khoảng theo dõi',
    public.metric_label(v_metric.type) || ' ' || v_display
      || ' nằm ngoài khoảng theo dõi được cấu hình. Bạn nên đo lại, và liên hệ nhân viên y tế nếu chỉ số vẫn bất thường.',
    v_metric.type,
    v_metric.id,
    v_metric.recorded_at
  )
  on conflict (metric_id) do nothing;
end;
$$;

create or replace function public.on_health_metric_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.evaluate_metric(new.id);
  return new;
end;
$$;

create trigger evaluate_metric_after_insert
  after insert on public.health_metrics
  for each row execute function public.on_health_metric_inserted();

-- Đánh giá lại các lần đo 7 ngày gần nhất để có cảnh báo ban đầu.
select public.evaluate_metric(id) from public.health_metrics where recorded_at >= now() - interval '7 days';

-- ============================================================
-- 4. Row Level Security
-- ============================================================

alter table public.alert_thresholds enable row level security;
alter table public.alerts enable row level security;

-- Ngưỡng: người xem được dữ liệu thì xem được ngưỡng (để hiển thị khoảng tham chiếu trên biểu đồ).
-- Ngưỡng mặc định chỉ ADMIN sửa; ngưỡng riêng do nhân viên y tế được phân công hoặc ADMIN sửa.
create policy "alert_thresholds_select" on public.alert_thresholds for select to authenticated
  using (user_id is null or public.can_view_elderly(user_id));
create policy "alert_thresholds_manage" on public.alert_thresholds for all to authenticated
  using (case when user_id is null then public.is_admin() else public.can_manage_medical(user_id) end)
  with check (case when user_id is null then public.is_admin() else public.can_manage_medical(user_id) end);

-- Cảnh báo: người liên quan được xem; insert chỉ qua trigger. Người cao tuổi tự đánh dấu đã đọc.
create policy "alerts_select" on public.alerts for select to authenticated
  using (public.can_view_elderly(user_id));
create policy "alerts_mark_read_self" on public.alerts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke insert, update, delete on public.alerts from anon, authenticated;
grant update (read_at) on public.alerts to authenticated;

revoke execute on function public.evaluate_metric(uuid) from public, anon, authenticated;
revoke execute on function public.on_health_metric_inserted() from public, anon, authenticated;
