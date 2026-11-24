-- CareAge — Đặt lịch tái khám (yêu cầu → nhân viên y tế xác nhận).
-- Người cao tuổi / người thân gửi yêu cầu (REQUESTED). Nhân viên y tế được phân công hoặc ADMIN xác nhận
-- (→ UPCOMING) hoặc từ chối (→ REJECTED). App không ghi trực tiếp vào bảng appointments — chỉ qua RPC.
-- Lịch REQUESTED/REJECTED không được nhắc, không vào dashboard / thông báo "lịch khám ngày mai"
-- (các chỗ đó đều lọc status = 'UPCOMING').
-- Mã lỗi riêng (app hiện thông báo tương ứng): CA001 giờ khám đã qua, CA002 thiếu cơ sở y tế,
-- CA003 quá số yêu cầu đang chờ.

alter table public.appointments drop constraint appointments_status_check;
alter table public.appointments add constraint appointments_status_check
  check (status in ('REQUESTED', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'MISSED', 'REJECTED'));

alter table public.appointments
  add column requested_by  uuid references public.profiles (id) on delete set null,
  add column note          text check (char_length(note) <= 500),
  add column reject_reason text check (char_length(reject_reason) <= 500);

-- Thông báo cho người thân khi yêu cầu được xác nhận / từ chối.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('MEDICATION_MISSED', 'APPOINTMENT_TOMORROW', 'HEALTH_ALERT', 'APPOINTMENT_REVIEWED'));

-- Số yêu cầu đang chờ tối đa cho một người cao tuổi (chống gửi dồn).
create or replace function public.max_pending_appointment_requests()
returns integer language sql immutable as $$ select 3 $$;

-- ------------------------------------------------------------
-- Gửi yêu cầu đặt lịch: chính người cao tuổi hoặc người thân đang liên kết.
-- ------------------------------------------------------------
create or replace function public.request_appointment(
  p_elderly_id uuid,
  p_date date,
  p_time time,
  p_facility text,
  p_doctor text default null,
  p_reason text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_now_local timestamp := now() at time zone 'Asia/Ho_Chi_Minh';
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not (p_elderly_id = v_uid and public.current_user_role() = 'ELDERLY')
     and not public.is_caregiver_of(p_elderly_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if (p_date + p_time) <= v_now_local then
    raise exception 'Appointment must be in the future' using errcode = 'CA001';
  end if;
  if char_length(trim(coalesce(p_facility, ''))) = 0 then
    raise exception 'Facility is required' using errcode = 'CA002';
  end if;
  if (select count(*) from public.appointments
      where user_id = p_elderly_id and status = 'REQUESTED') >= public.max_pending_appointment_requests() then
    raise exception 'Too many pending requests' using errcode = 'CA003';
  end if;

  insert into public.appointments
    (user_id, appointment_date, appointment_time, facility, doctor, reason, note, status, requested_by)
  values
    (p_elderly_id, p_date, p_time, trim(p_facility),
     nullif(trim(p_doctor), ''), nullif(trim(p_reason), ''), nullif(trim(p_note), ''),
     'REQUESTED', v_uid)
  returning id into v_id;

  return v_id;
end;
$$;

-- ------------------------------------------------------------
-- Hủy yêu cầu đang chờ: người cao tuổi đó hoặc người thân đang liên kết.
-- ------------------------------------------------------------
create or replace function public.cancel_appointment_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_elderly uuid;
begin
  select user_id into v_elderly from public.appointments where id = p_id and status = 'REQUESTED';
  if v_elderly is null then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if v_elderly <> (select auth.uid()) and not public.is_caregiver_of(v_elderly) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.appointments set status = 'CANCELLED' where id = p_id;
end;
$$;

-- ------------------------------------------------------------
-- Xác nhận / từ chối: nhân viên y tế được phân công hoặc ADMIN (Admin web dùng chung).
-- ------------------------------------------------------------
create or replace function public.review_appointment_request(p_id uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_elderly uuid;
begin
  select user_id into v_elderly from public.appointments where id = p_id and status = 'REQUESTED';
  if v_elderly is null then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if not public.can_manage_medical(v_elderly) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.appointments
  set status = case when p_approve then 'UPCOMING' else 'REJECTED' end,
      reject_reason = case when p_approve then null else nullif(trim(p_reason), '') end
  where id = p_id;
end;
$$;

revoke execute on function public.request_appointment(uuid, date, time, text, text, text, text) from public, anon;
revoke execute on function public.cancel_appointment_request(uuid) from public, anon;
revoke execute on function public.review_appointment_request(uuid, boolean, text) from public, anon;
grant execute on function public.request_appointment(uuid, date, time, text, text, text, text) to authenticated;
grant execute on function public.cancel_appointment_request(uuid) to authenticated;
grant execute on function public.review_appointment_request(uuid, boolean, text) to authenticated;

-- ------------------------------------------------------------
-- Yêu cầu được xác nhận / từ chối → báo mọi người thân đang theo dõi (push tự chạy theo Phần 8).
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
           else '.'
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

create trigger notify_caregivers_after_appointment_review
  after update of status on public.appointments
  for each row
  when (old.status = 'REQUESTED' and new.status in ('UPCOMING', 'REJECTED'))
  execute function public.notify_caregivers_of_appointment_review();
