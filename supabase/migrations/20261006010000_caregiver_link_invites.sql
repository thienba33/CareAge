-- CareAge — liên kết người thân bằng mã mời (Phần 7B).
-- Người cao tuổi tạo mã 6 số (hiệu lực 15 phút, dùng 1 lần) → người thân nhập mã → liên kết ACTIVE.
-- Người cao tuổi chủ động tạo mã nên coi như đã đồng ý; không cần bước duyệt.
-- Mọi thao tác đi qua RPC security definer có kiểm tra role; client không ghi trực tiếp vào bảng.

create table public.link_invites (
  id          uuid primary key default gen_random_uuid(),
  code        text not null check (code ~ '^[0-9]{6}$'),
  elderly_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid references public.profiles (id) on delete set null
);

-- Một mã chỉ thuộc về một lời mời còn hiệu lực tại một thời điểm.
create unique index link_invites_active_code_idx on public.link_invites (code) where used_at is null;
create index link_invites_elderly_idx on public.link_invites (elderly_id, created_at desc);

-- Ghi lại các lần nhập mã sai để chặn dò mã.
create table public.link_invite_attempts (
  id            bigint generated always as identity primary key,
  caregiver_id  uuid not null references public.profiles (id) on delete cascade,
  attempted_at  timestamptz not null default now()
);
create index link_invite_attempts_caregiver_idx on public.link_invite_attempts (caregiver_id, attempted_at desc);

alter table public.link_invites enable row level security;
alter table public.link_invite_attempts enable row level security;

-- Người cao tuổi xem được lời mời của chính mình (để hiện lại mã đang còn hạn). Không có quyền ghi trực tiếp.
create policy "link_invites_select_own" on public.link_invites for select to authenticated
  using (elderly_id = (select auth.uid()));
revoke insert, update, delete on public.link_invites from anon, authenticated;
revoke all on public.link_invite_attempts from anon, authenticated;

-- ------------------------------------------------------------
-- Tạo mã mời (chỉ ELDERLY). Mã cũ chưa dùng của người này bị hủy.
-- ------------------------------------------------------------
create or replace function public.create_link_invite()
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_expires timestamptz := now() + interval '15 minutes';
begin
  if public.current_user_role() is distinct from 'ELDERLY' then
    raise exception 'Chỉ người cao tuổi mới tạo được mã mời' using errcode = '42501';
  end if;

  update public.link_invites set used_at = now()
  where elderly_id = auth.uid() and used_at is null;

  -- Dọn mã đã hết hạn để không chiếm chỗ trong index mã còn hiệu lực.
  update public.link_invites set used_at = now()
  where used_at is null and link_invites.expires_at < now();

  loop
    v_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
    begin
      insert into public.link_invites (code, elderly_id, expires_at) values (v_code, auth.uid(), v_expires);
      exit;
    exception when unique_violation then
      -- Trùng với một mã đang hiệu lực khác → sinh lại.
    end;
  end loop;

  return query select v_code, v_expires;
end;
$$;

-- ------------------------------------------------------------
-- Nhập mã (chỉ CAREGIVER). Trả về trạng thái thay vì ném lỗi để lượt nhập sai vẫn được ghi lại.
-- status: LINKED | INVALID | LOCKED
-- ------------------------------------------------------------
create or replace function public.accept_link_invite(p_code text, p_relationship text)
returns table (status text, elderly_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.link_invites;
  v_failed integer;
begin
  if public.current_user_role() is distinct from 'CAREGIVER' then
    raise exception 'Chỉ người thân mới nhập được mã mời' using errcode = '42501';
  end if;
  if p_relationship not in ('CHILD', 'SPOUSE', 'GRANDCHILD', 'RELATIVE', 'OTHER') then
    raise exception 'Quan hệ không hợp lệ' using errcode = '22023';
  end if;

  select count(*) into v_failed
  from public.link_invite_attempts
  where caregiver_id = auth.uid() and attempted_at > now() - interval '10 minutes';
  if v_failed >= 5 then
    return query select 'LOCKED'::text, null::text;
    return;
  end if;

  select * into v_invite
  from public.link_invites i
  where i.code = trim(p_code) and i.used_at is null and i.expires_at > now()
  for update;

  if not found then
    insert into public.link_invite_attempts (caregiver_id) values (auth.uid());
    return query select 'INVALID'::text, null::text;
    return;
  end if;

  insert into public.caregiver_links (caregiver_id, elderly_id, relationship, status)
  values (auth.uid(), v_invite.elderly_id, p_relationship, 'ACTIVE')
  on conflict (caregiver_id, elderly_id)
  do update set status = 'ACTIVE', relationship = excluded.relationship;

  update public.link_invites set used_at = now(), used_by = auth.uid() where id = v_invite.id;

  return query select 'LINKED'::text, (select p.name from public.profiles p where p.id = v_invite.elderly_id);
end;
$$;

-- ------------------------------------------------------------
-- Gỡ liên kết: người cao tuổi gỡ người thân, hoặc người thân tự rời.
-- ------------------------------------------------------------
create or replace function public.revoke_caregiver_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.caregiver_links
  set status = 'REVOKED'
  where id = p_link_id
    and status = 'ACTIVE'
    and (caregiver_id = auth.uid() or elderly_id = auth.uid());

  if not found then
    raise exception 'Không tìm thấy liên kết' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.create_link_invite() from public, anon;
revoke execute on function public.accept_link_invite(text, text) from public, anon;
revoke execute on function public.revoke_caregiver_link(uuid) from public, anon;
grant execute on function public.create_link_invite() to authenticated;
grant execute on function public.accept_link_invite(text, text) to authenticated;
grant execute on function public.revoke_caregiver_link(uuid) to authenticated;
