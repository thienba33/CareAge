-- CareAge — Tạo tài khoản quản trị viên web: adm001@careage.vn / Careage@2026 (đổi mật khẩu sau khi đăng nhập).
-- App không cho tự đăng ký ADMIN (handle_new_user hạ về ELDERLY), nên tạo user rồi nâng role bằng SQL.
-- Chạy lại nhiều lần không tạo trùng.
do $$
declare
  v_id uuid := '40000000-0000-0000-0000-000000000001';
begin
  if not exists (select 1 from auth.users where id = v_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'adm001@careage.vn',
      extensions.crypt('Careage@2026', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Quản trị Phenikaamec', 'phone', '0904000001'),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text, 'email',
            jsonb_build_object('sub', v_id::text, 'email', 'adm001@careage.vn', 'email_verified', true), now(), now(), now());
  end if;

  -- Trigger đã tạo profile ELDERLY (+ health_profiles) → chuyển thành ADMIN.
  if (select role from public.profiles where id = v_id) <> 'ADMIN' then
    update public.profiles set role = 'ADMIN', code = public.next_profile_code('ADMIN') where id = v_id;
    delete from public.health_profiles where user_id = v_id;
  end if;
end;
$$;
