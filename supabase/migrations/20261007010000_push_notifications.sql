-- CareAge — Push notification cho người thân (Phần 8).
-- Mỗi thông báo mới trong hộp thông báo → gọi Edge Function `send-push` → Expo Push API → máy người thân,
-- kể cả khi app đã tắt hẳn. Realtime (Phần 7) chỉ chạy khi app đang mở nên không thay được push.

create extension if not exists pg_net with schema extensions;

-- ------------------------------------------------------------
-- Expo push token của từng máy. Một máy chỉ thuộc về người đang đăng nhập trên máy đó.
-- ------------------------------------------------------------
create table public.push_tokens (
  token       text primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  platform    text not null check (platform in ('ios', 'android')),
  updated_at  timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own" on public.push_tokens for select to authenticated
  using (user_id = (select auth.uid()));

-- Ghi chỉ qua RPC bên dưới (máy đổi người đăng nhập thì token phải chuyển sang người mới).
revoke insert, update, delete on public.push_tokens from anon, authenticated;

create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  insert into public.push_tokens (token, user_id, platform)
  values (p_token, (select auth.uid()), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

-- Gọi trước khi đăng xuất để máy không còn nhận thông báo của tài khoản cũ.
create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = (select auth.uid());
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- ------------------------------------------------------------
-- Thông báo mới → gọi Edge Function (bất đồng bộ qua pg_net).
-- URL và secret lưu trong Vault (xem docs/PLAN.md Phần 8); chưa cấu hình thì bỏ qua push.
-- ------------------------------------------------------------
create or replace function public.push_notification_to_devices()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    return new;
  end if;

  if not exists (select 1 from public.push_tokens where user_id = new.recipient_id) then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object(
      'id', new.id,
      'recipient_id', new.recipient_id,
      'elderly_id', new.elderly_id,
      'type', new.type,
      'title', new.title,
      'body', new.body
    )
  );
  return new;
exception when others then
  -- Push lỗi không được chặn việc lưu thông báo; người thân vẫn thấy trong hộp thông báo.
  return new;
end;
$$;

revoke execute on function public.push_notification_to_devices() from public, anon, authenticated;

create trigger push_after_notification
  after insert on public.notifications
  for each row execute function public.push_notification_to_devices();
