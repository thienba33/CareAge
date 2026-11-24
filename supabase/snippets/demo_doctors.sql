-- CareAge — Dữ liệu mẫu bác sĩ: thêm 5 bác sĩ (STA002–STA006) + điền đầy đủ hồ sơ chuyên môn cho cả 6 bác sĩ
-- (kể cả STA001 · BS. Phạm Thị Hoa) và phân công thêm vài bệnh nhân cho bác sĩ mới.
-- Cần migration 20261007030000 (workplace) và 20261007080000 (staff_profiles).
-- Mật khẩu mọi tài khoản mẫu: Careage@2026. Chạy lại nhiều lần không tạo trùng (cập nhật nếu đã có).

-- ------------------------------------------------------------
-- 1. Tài khoản bác sĩ mới (profile + mã STAxxx do trigger handle_new_user tạo, role MEDICAL_STAFF)
-- ------------------------------------------------------------
-- Tạo từng tài khoản trong một khối DO (giống create_admin.sql). Không dùng câu "with … insert … returning"
-- ghi vào auth.identities: trên project Supabase thật, SQL Editor báo "must be owner of table identities".
do $$
declare
  d record;
begin
  for d in
    select * from (values
      ('30000000-0000-0000-0000-000000000002'::uuid, 'sta002@careage.vn', 'BS. Nguyễn Đức Minh', '0903000002'),
      ('30000000-0000-0000-0000-000000000003'::uuid, 'sta003@careage.vn', 'BS. Lê Thu Hằng',     '0903000003'),
      ('30000000-0000-0000-0000-000000000004'::uuid, 'sta004@careage.vn', 'BS. Trần Quốc Bảo',   '0903000004'),
      ('30000000-0000-0000-0000-000000000005'::uuid, 'sta005@careage.vn', 'BS. Vũ Thị Ngọc Anh', '0903000005'),
      ('30000000-0000-0000-0000-000000000006'::uuid, 'sta006@careage.vn', 'BS. Hoàng Minh Tuấn', '0903000006')
    ) as v(id, email, name, phone)
    order by id
  loop
    if not exists (select 1 from auth.users where id = d.id) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email,
        extensions.crypt('Careage@2026', extensions.gen_salt('bf')), now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('name', d.name, 'phone', d.phone, 'role', 'MEDICAL_STAFF'),
        now(), now(), '', '', '', ''
      );
      insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), d.id, d.id::text, 'email',
              jsonb_build_object('sub', d.id::text, 'email', d.email, 'email_verified', true), now(), now(), now());
    end if;
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 2. Nơi làm việc (cơ sở y tế dùng khi đặt lịch) cho cả 6 bác sĩ
-- ------------------------------------------------------------
update public.profiles
set workplace = 'Phenikaamec', workplace_phone = '1900 1000'
where id in (
  '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006'
);

-- ------------------------------------------------------------
-- 3. Hồ sơ chuyên môn đầy đủ
-- ------------------------------------------------------------
insert into public.staff_profiles
  (user_id, academic_title, degree, specialty, department, room, license_number, years_experience, working_hours, bio)
values
  ('30000000-0000-0000-0000-000000000001', null, 'THS', 'Nội tổng quát', 'Khoa Khám bệnh', 'Phòng 203',
   '001234/HNO-CCHN', 12, 'Thứ 2 – Thứ 6: 7:30 – 16:30; Thứ 7: 7:30 – 11:30',
   'Bác sĩ nội khoa, nhiều năm theo dõi và điều trị tăng huyết áp, đái tháo đường và các bệnh mạn tính ở người cao tuổi. Tốt nghiệp Thạc sĩ Nội khoa – Đại học Y Hà Nội.'),
  ('30000000-0000-0000-0000-000000000002', 'PGS', 'TS', 'Tim mạch', 'Khoa Tim mạch', 'Phòng 305',
   '002871/HNO-CCHN', 24, 'Thứ 2, Thứ 4, Thứ 6: 7:30 – 16:30',
   'Phó giáo sư, Tiến sĩ chuyên ngành Tim mạch. Chuyên điều trị tăng huyết áp, suy tim, rối loạn nhịp tim và theo dõi tim mạch dài hạn cho người cao tuổi.'),
  ('30000000-0000-0000-0000-000000000003', null, 'BSCKII', 'Nội tiết – Đái tháo đường', 'Khoa Nội tiết', 'Phòng 210',
   '003456/HNO-CCHN', 18, 'Thứ 2 – Thứ 6: 7:30 – 16:30',
   'Bác sĩ chuyên khoa II Nội tiết. Quản lý đái tháo đường type 2, rối loạn mỡ máu và bệnh tuyến giáp; tư vấn chế độ ăn, dùng thuốc và tự theo dõi đường huyết tại nhà.'),
  ('30000000-0000-0000-0000-000000000004', null, 'BSCKI', 'Lão khoa', 'Khoa Lão khoa', 'Phòng 112',
   '004102/HNO-CCHN', 9, 'Thứ 2 – Thứ 7: 7:30 – 11:30',
   'Bác sĩ chuyên khoa I Lão khoa. Khám và chăm sóc toàn diện người cao tuổi đa bệnh lý, phòng ngừa té ngã, suy dinh dưỡng và tương tác thuốc.'),
  ('30000000-0000-0000-0000-000000000005', null, 'THS', 'Cơ xương khớp', 'Khoa Cơ xương khớp', 'Phòng 118',
   '005389/HNO-CCHN', 7, 'Thứ 3, Thứ 5: 7:30 – 16:30; Thứ 7: 7:30 – 11:30',
   'Thạc sĩ Nội khoa, chuyên sâu Cơ xương khớp. Điều trị thoái hóa khớp, loãng xương, gút và đau cột sống ở người cao tuổi.'),
  ('30000000-0000-0000-0000-000000000006', null, 'BS', 'Thần kinh', 'Khoa Thần kinh', 'Phòng 402',
   '006017/HNO-CCHN', 5, 'Thứ 2 – Thứ 6: 13:30 – 16:30',
   'Bác sĩ Thần kinh. Theo dõi sau đột quỵ, sa sút trí tuệ, Parkinson và rối loạn giấc ngủ ở người cao tuổi.')
on conflict (user_id) do update set
  academic_title = excluded.academic_title, degree = excluded.degree, specialty = excluded.specialty,
  department = excluded.department, room = excluded.room, license_number = excluded.license_number,
  years_experience = excluded.years_experience, working_hours = excluded.working_hours, bio = excluded.bio;

-- ------------------------------------------------------------
-- 4. Phân công thêm (một người cao tuổi có thể có nhiều bác sĩ theo từng chuyên khoa)
-- ------------------------------------------------------------
insert into public.staff_assignments (staff_id, elderly_id)
values
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'), -- Tim mạch → Nguyễn Văn Hùng
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004'), -- Tim mạch → Lê Văn Sơn
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'), -- Nội tiết → Trần Thị Tám
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003'), -- Lão khoa → Phạm Thị Mai
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005'), -- Lão khoa → Hoàng Thị Cúc
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005')  -- Cơ xương khớp → Hoàng Thị Cúc
on conflict (staff_id, elderly_id) do nothing;
