-- CareAge — lấy ngưỡng theo dõi đang áp dụng cho một người (Phần 4, dùng làm khoảng tham chiếu trên biểu đồ).
-- Cùng quy tắc với evaluate_metric: có ngưỡng riêng cho loại chỉ số thì chỉ dùng ngưỡng riêng, không thì dùng mặc định.
-- security invoker: RLS của alert_thresholds vẫn áp dụng cho người gọi.

create or replace function public.applicable_alert_thresholds(p_user_id uuid, p_metric_type text)
returns setof public.alert_thresholds
language sql
stable
security invoker
set search_path = ''
as $$
  select t.*
  from public.alert_thresholds t
  where t.metric_type = p_metric_type
    and (
      t.user_id = p_user_id
      or (t.user_id is null and not exists (
        select 1 from public.alert_thresholds own
        where own.user_id = p_user_id and own.metric_type = p_metric_type
      ))
    )
  order by t.field, t.direction, t.limit_value;
$$;

revoke execute on function public.applicable_alert_thresholds(uuid, text) from public, anon;
grant execute on function public.applicable_alert_thresholds(uuid, text) to authenticated;
