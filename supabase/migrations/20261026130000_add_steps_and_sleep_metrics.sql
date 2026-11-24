-- CareAge — Bổ sung chỉ số Bước chân (STEPS) và Giấc ngủ (SLEEP) từ đồng hồ thông minh.

-- 1. Cập nhật check constraint cho bảng health_metrics
alter table public.health_metrics drop constraint if exists health_metrics_type_check;
alter table public.health_metrics add constraint health_metrics_type_check
  check (type in ('BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'SPO2', 'TEMPERATURE', 'WEIGHT', 'STEPS', 'SLEEP'));

-- 2. Cập nhật check constraint cho bảng alert_thresholds
alter table public.alert_thresholds drop constraint if exists alert_thresholds_metric_type_check;
alter table public.alert_thresholds add constraint alert_thresholds_metric_type_check
  check (metric_type in ('BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'SPO2', 'TEMPERATURE', 'WEIGHT', 'STEPS', 'SLEEP'));

-- 3. Cập nhật hàm metric_label để hỗ trợ hiển thị tiếng Việt
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
    when 'STEPS'          then 'Bước chân'
    when 'SLEEP'          then 'Giấc ngủ'
    else p_type
  end;
$$;
