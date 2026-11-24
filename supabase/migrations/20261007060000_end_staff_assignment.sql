-- CareAge — Bác sĩ kết thúc theo dõi một bệnh nhân (điều trị xong, chuyển bác sĩ / cơ sở...) → "cựu bệnh nhân".
-- Bác sĩ chỉ được KẾT THÚC phân công của chính mình; phân công lại vẫn chỉ ADMIN (bác sĩ không tự thêm bệnh nhân).
-- Sau khi kết thúc: is_staff_of() = false → bác sĩ không còn xem dữ liệu sức khỏe qua RLS.

alter table public.staff_assignments
  add column ended_at   timestamptz,
  add column end_reason text check (char_length(end_reason) <= 500);

-- ------------------------------------------------------------
-- Kết thúc theo dõi. Yêu cầu đặt lịch đang chờ gửi tới bác sĩ này bị từ chối kèm lý do
-- (trigger notify_caregivers_after_appointment_review báo cho người thân).
-- ------------------------------------------------------------
create or replace function public.end_staff_assignment(p_elderly_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if public.current_user_role() is distinct from 'MEDICAL_STAFF' then
    raise exception 'Chỉ dành cho nhân viên y tế' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Reason is required' using errcode = 'CA006';
  end if;

  update public.staff_assignments
  set status = 'INACTIVE', ended_at = now(), end_reason = trim(p_reason)
  where staff_id = v_uid and elderly_id = p_elderly_id and status = 'ACTIVE';
  if not found then
    raise exception 'Assignment not found' using errcode = 'P0002';
  end if;

  update public.appointments
  set status = 'REJECTED',
      reject_reason = 'Bác sĩ đã kết thúc theo dõi. Vui lòng đặt lịch với bác sĩ phụ trách khác.'
  where user_id = p_elderly_id and staff_id = v_uid and status = 'REQUESTED';
end;
$$;

revoke execute on function public.end_staff_assignment(uuid, text) from public, anon;
grant execute on function public.end_staff_assignment(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- Cựu bệnh nhân của bác sĩ đang đăng nhập (chỉ thông tin nhận diện + lý do; không kèm dữ liệu sức khỏe).
-- security definer vì profile của cựu bệnh nhân không còn đọc được qua RLS (is_related_user cần ACTIVE).
-- Người đã được phân công lại cho chính bác sĩ này thì không tính là cựu bệnh nhân.
-- ------------------------------------------------------------
create or replace function public.get_former_patients()
returns table (elderly_id uuid, name text, code text, ended_at timestamptz, end_reason text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() is distinct from 'MEDICAL_STAFF' then
    raise exception 'Chỉ dành cho nhân viên y tế' using errcode = '42501';
  end if;

  return query
  select p.id, p.name, p.code, s.ended_at, s.end_reason
  from public.staff_assignments s
  join public.profiles p on p.id = s.elderly_id
  where s.staff_id = auth.uid() and s.status = 'INACTIVE'
  order by s.ended_at desc nulls last;
end;
$$;

revoke execute on function public.get_former_patients() from public, anon;
grant execute on function public.get_former_patients() to authenticated;
