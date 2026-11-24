-- CareAge — Lời dặn của bác sĩ khi xác nhận lịch khám (vd. "Nhịn ăn sáng trước khi khám").
-- Lưu ở appointments.staff_note; người cao tuổi / người thân xem trong chi tiết lịch,
-- người thân nhận kèm trong thông báo "Đã xác nhận lịch khám".

alter table public.appointments
  add column staff_note text check (char_length(staff_note) <= 500);

-- ------------------------------------------------------------
-- Duyệt yêu cầu: thêm p_note (chỉ lưu khi xác nhận). Giữ nguyên quy tắc quyền của 20261007050000_staff_portal.
-- ------------------------------------------------------------
drop function public.review_appointment_request(uuid, boolean, text);

create or replace function public.review_appointment_request(
  p_id uuid,
  p_approve boolean,
  p_reason text default null,
  p_note text default null
)
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
      reject_reason = case when p_approve then null else nullif(trim(p_reason), '') end,
      staff_note = case when p_approve then nullif(trim(p_note), '') else null end
  where id = p_id;
end;
$$;

revoke execute on function public.review_appointment_request(uuid, boolean, text, text) from public, anon;
grant execute on function public.review_appointment_request(uuid, boolean, text, text) to authenticated;

-- ------------------------------------------------------------
-- Thông báo cho người thân: kèm lời dặn của bác sĩ khi lịch được xác nhận.
-- (Cùng nội dung với 20261007020000_appointment_requests, thêm phần "Lời dặn của bác sĩ".)
-- ------------------------------------------------------------
create or replace function public.notify_caregivers_of_appointment_review()
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
    'APPOINTMENT_REVIEWED',
    case new.status
      when 'UPCOMING' then 'Đã xác nhận lịch khám của ' || public.kinship_label(l.relationship, hp.gender, p.name)
      else 'Lịch khám của ' || public.kinship_label(l.relationship, hp.gender, p.name) || ' chưa được nhận'
    end,
    to_char(new.appointment_time, 'HH24:MI') || ' ngày ' || to_char(new.appointment_date, 'DD/MM') || ' tại ' || new.facility
      || case
           when new.status = 'REJECTED' then coalesce('. Lý do: ' || new.reject_reason, '') || '. Bạn có thể đặt lịch khác.'
           else '.' || coalesce(' Lời dặn của bác sĩ: ' || new.staff_note, '')
         end,
    jsonb_build_object('appointmentId', new.id, 'status', new.status),
    'appointment-review:' || new.id
  from public.caregiver_links l
  join public.profiles p on p.id = new.user_id
  left join public.health_profiles hp on hp.user_id = new.user_id
  where l.elderly_id = new.user_id and l.status = 'ACTIVE'
  on conflict (recipient_id, dedupe_key) do nothing;
  return new;
end;
$$;

revoke execute on function public.notify_caregivers_of_appointment_review() from public, anon, authenticated;
