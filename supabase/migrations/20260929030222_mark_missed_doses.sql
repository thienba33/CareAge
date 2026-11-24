-- CareAge — tự động đánh dấu liều bị bỏ lỡ (Phần 2).
-- Liều PENDING của các ngày TRƯỚC hôm nay (giờ Việt Nam) chuyển sang MISSED.
-- Liều trong ngày giữ PENDING để người cao tuổi vẫn đánh dấu uống trễ được; app tự hiển thị "quá giờ".

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.mark_missed_doses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.medication_doses
  set status = 'MISSED'
  where status = 'PENDING'
    and scheduled_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Chỉ cron (chạy bằng role postgres) được gọi, không mở qua RPC.
revoke execute on function public.mark_missed_doses() from public, anon, authenticated;

-- 00:05 giờ Việt Nam mỗi ngày = 17:05 UTC.
select cron.schedule('mark-missed-doses', '5 17 * * *', $$select public.mark_missed_doses();$$);
