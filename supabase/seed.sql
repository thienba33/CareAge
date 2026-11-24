-- CareAge — dữ liệu test (Phần 0e).
-- 5 người cao tuổi, mỗi người 1 người thân được liên kết, 1 bác sĩ phụ trách cả 5 người.
-- Mật khẩu chung cho mọi tài khoản test: Careage@2026
--
-- Chạy:
--   Local : npx supabase db reset
--   Remote: npx supabase db push --include-seed   (chỉ dùng cho project dev/test, KHÔNG dùng cho production)
--
-- Profile, mã người dùng (ELD001, CG001, STA001...) và health_profiles do trigger handle_new_user tạo.
-- Chạy lại nhiều lần không tạo trùng (on conflict do nothing).

-- ============================================================
-- 1. Tài khoản (auth.users + auth.identities)
-- ============================================================

with seed_users (id, email, name, phone, role) as (
  values
    -- Thứ tự insert quyết định mã người dùng trên DB mới: ELD001..ELD005, CG001..CG005, STA001.
    ('10000000-0000-0000-0000-000000000001'::uuid, 'eld001@careage.vn', 'Trần Thị Tám',    '0901000001', 'ELDERLY'),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'eld002@careage.vn', 'Nguyễn Văn Hùng', '0901000002', 'ELDERLY'),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'eld003@careage.vn', 'Phạm Thị Mai',    '0901000003', 'ELDERLY'),
    ('10000000-0000-0000-0000-000000000004'::uuid, 'eld004@careage.vn', 'Lê Văn Sơn',      '0901000004', 'ELDERLY'),
    ('10000000-0000-0000-0000-000000000005'::uuid, 'eld005@careage.vn', 'Hoàng Thị Cúc',   '0901000005', 'ELDERLY'),
    ('20000000-0000-0000-0000-000000000001'::uuid, 'cg001@careage.vn',  'Lê Văn Bình',     '0902000001', 'CAREGIVER'),
    ('20000000-0000-0000-0000-000000000002'::uuid, 'cg002@careage.vn',  'Nguyễn Thị Lan',  '0902000002', 'CAREGIVER'),
    ('20000000-0000-0000-0000-000000000003'::uuid, 'cg003@careage.vn',  'Phạm Minh Tuấn',  '0902000003', 'CAREGIVER'),
    ('20000000-0000-0000-0000-000000000004'::uuid, 'cg004@careage.vn',  'Lê Thị Hoa',      '0902000004', 'CAREGIVER'),
    ('20000000-0000-0000-0000-000000000005'::uuid, 'cg005@careage.vn',  'Hoàng Văn Nam',   '0902000005', 'CAREGIVER'),
    ('30000000-0000-0000-0000-000000000001'::uuid, 'sta001@careage.vn', 'BS. Phạm Thị Hoa','0903000001', 'MEDICAL_STAFF')
),
inserted as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    -- GoTrue lỗi khi đăng nhập nếu các cột token là NULL, nên đặt chuỗi rỗng.
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
    extensions.crypt('Careage@2026', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', u.name, 'phone', u.phone, 'role', u.role),
    now(), now(),
    '', '', '', ''
  from seed_users u
  order by u.id
  on conflict (id) do nothing
  returning id, email
)
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), i.id, i.id::text, 'email',
  jsonb_build_object('sub', i.id::text, 'email', i.email, 'email_verified', true),
  now(), now(), now()
from inserted i;

-- ============================================================
-- 2. Liên kết người thân và phân công bác sĩ
-- ============================================================

insert into public.caregiver_links (caregiver_id, elderly_id, relationship)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CHILD'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CHILD'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'GRANDCHILD'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'SPOUSE'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'RELATIVE')
on conflict (caregiver_id, elderly_id) do nothing;

insert into public.staff_assignments (staff_id, elderly_id)
select '30000000-0000-0000-0000-000000000001', e.id
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000003'::uuid),
  ('10000000-0000-0000-0000-000000000004'::uuid),
  ('10000000-0000-0000-0000-000000000005'::uuid)
) as e(id)
on conflict (staff_id, elderly_id) do nothing;

-- Nơi làm việc của bác sĩ — cơ sở y tế khi người cao tuổi / người thân đặt lịch.
update public.profiles
set workplace = 'Phenikaamec', workplace_phone = '1900 1000'
where id = '30000000-0000-0000-0000-000000000001';

-- ============================================================
-- 3. Hồ sơ sức khỏe cơ bản của người cao tuổi
-- ============================================================

update public.health_profiles hp
set date_of_birth = v.dob, gender = v.gender, height_cm = v.height, weight_kg = v.weight, blood_type = v.blood, address = v.address
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, '1948-03-12'::date, 'FEMALE', 152.0, 50.5, 'O',  'Đống Đa, Hà Nội'),
  ('10000000-0000-0000-0000-000000000002'::uuid, '1945-07-25'::date, 'MALE',   165.0, 62.0, 'A',  'Cầu Giấy, Hà Nội'),
  ('10000000-0000-0000-0000-000000000003'::uuid, '1950-11-02'::date, 'FEMALE', 150.0, 48.0, 'B',  'Hà Đông, Hà Nội'),
  ('10000000-0000-0000-0000-000000000004'::uuid, '1942-01-18'::date, 'MALE',   160.0, 58.5, 'AB', 'Thanh Xuân, Hà Nội'),
  ('10000000-0000-0000-0000-000000000005'::uuid, '1952-09-30'::date, 'FEMALE', 155.0, 53.0, 'O',  'Long Biên, Hà Nội')
) as v(id, dob, gender, height, weight, blood, address)
where hp.user_id = v.id
  and hp.date_of_birth is null; -- không ghi đè nếu đã được sửa trong app

-- ============================================================
-- 4. Dữ liệu y tế mẫu cho 5 người cao tuổi
-- Ngày tháng tính theo current_date lúc chạy seed để lịch khám "sắp tới" luôn nằm ở tương lai.
-- id cố định (hoặc sinh từ md5) để chạy lại không tạo trùng.
-- ============================================================

-- Bệnh nền / tiền sử / dị ứng
insert into public.medical_conditions (id, user_id, category, name, diagnosed_at, status, note)
values
  ('c1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CHRONIC', 'Tăng huyết áp',          '2023-05-10', 'ACTIVE',   'Kiểm soát bằng Amlodipine, tái khám định kỳ mỗi tháng.'),
  ('c1000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'CHRONIC', 'Đái tháo đường type 2',  '2024-02-20', 'ACTIVE',   'Kiểm soát bằng Metformin, theo dõi đường huyết hằng ngày.'),
  ('c1000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'HISTORY', 'Gãy cổ tay trái',        '2019-11-03', 'RESOLVED', 'Đã phẫu thuật và hồi phục hoàn toàn.'),
  ('c1000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'ALLERGY', 'Penicillin',             null,         'ACTIVE',   'Nổi mẩn đỏ, khó thở nhẹ khi dùng.'),
  ('c2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'CHRONIC', 'Tăng huyết áp',          '2020-08-15', 'ACTIVE',   'Theo dõi huyết áp buổi sáng.'),
  ('c2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CHRONIC', 'Gút',                    '2021-03-02', 'ACTIVE',   'Hạn chế thịt đỏ, hải sản và rượu bia.'),
  ('c2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'HISTORY', 'Mổ ruột thừa',           '1985-06-20', 'RESOLVED', null),
  ('c3000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'CHRONIC', 'Suy giáp',               '2018-09-12', 'ACTIVE',   'Uống thuốc lúc đói, trước ăn sáng 30 phút.'),
  ('c3000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'CHRONIC', 'Loãng xương',            '2022-04-05', 'ACTIVE',   'Bổ sung canxi, tránh té ngã.'),
  ('c3000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'ALLERGY', 'Aspirin',                null,         'ACTIVE',   'Đau dạ dày, nổi mề đay.'),
  ('c4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'CHRONIC', 'Tăng huyết áp',          '2015-01-22', 'ACTIVE',   'Huyết áp dao động, cần đo hằng ngày.'),
  ('c4000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'CHRONIC', 'Rối loạn mỡ máu',        '2019-07-30', 'ACTIVE',   null),
  ('c4000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'HISTORY', 'Viêm phổi',              '2023-12-10', 'RESOLVED', 'Điều trị nội trú 7 ngày.'),
  ('c4000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'ALLERGY', 'Hải sản (tôm, cua)',     null,         'ACTIVE',   'Ngứa, nổi mẩn.'),
  ('c5000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'CHRONIC', 'Đái tháo đường type 2',  '2017-10-18', 'ACTIVE',   'Kiểm soát bằng Metformin.'),
  ('c5000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'CHRONIC', 'Thoái hóa khớp gối',     '2021-05-25', 'ACTIVE',   'Đi lại chậm, dùng gậy khi ra ngoài.')
on conflict (id) do nothing;

-- Liên hệ khẩn cấp: người thân đã liên kết + bác sĩ phụ trách
insert into public.emergency_contacts (id, user_id, name, relationship, phone)
values
  ('e1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lê Văn Bình',      'Con trai',          '0902000001'),
  ('e1000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'BS. Phạm Thị Hoa', 'Bác sĩ phụ trách',  '0903000001'),
  ('e2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Nguyễn Thị Lan',   'Con gái',           '0902000002'),
  ('e2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'BS. Phạm Thị Hoa', 'Bác sĩ phụ trách',  '0903000001'),
  ('e3000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Phạm Minh Tuấn',   'Cháu nội',          '0902000003'),
  ('e3000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'BS. Phạm Thị Hoa', 'Bác sĩ phụ trách',  '0903000001'),
  ('e4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Lê Thị Hoa',       'Vợ',                '0902000004'),
  ('e4000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'BS. Phạm Thị Hoa', 'Bác sĩ phụ trách',  '0903000001'),
  ('e5000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Hoàng Văn Nam',    'Cháu',              '0902000005'),
  ('e5000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'BS. Phạm Thị Hoa', 'Bác sĩ phụ trách',  '0903000001')
on conflict (id) do nothing;

-- Thuốc (bác sĩ kê). Liều mỗi ngày do RPC ensure_doses_for_date sinh khi app mở màn Thuốc.
insert into public.medications (id, user_id, name, dosage, unit, frequency, times, start_date, instructions, active_ingredient, indication, description)
values
  ('a1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Amlodipine',   '5',   'mg',  1, '{08:00}',       current_date - 28, 'Uống sau khi ăn sáng',
    'Amlodipine besylate', 'Điều trị tăng huyết áp, phòng ngừa cơn đau thắt ngực',
    'Thuốc thuộc nhóm chẹn kênh canxi, giúp giãn mạch máu để hạ huyết áp và giảm gánh nặng cho tim.'),
  ('a1000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Metformin',    '500', 'mg',  2, '{08:00,20:00}', current_date - 28, 'Uống cùng bữa ăn',
    'Metformin hydrochloride', 'Điều trị đái tháo đường type 2, hỗ trợ kiểm soát đường huyết',
    'Thuốc giúp giảm lượng đường do gan sản xuất và tăng độ nhạy insulin của cơ thể.'),
  ('a2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Losartan',     '50',  'mg',  1, '{07:00}',       current_date - 60, 'Uống vào buổi sáng, trước hoặc sau ăn đều được',
    'Losartan kali', 'Điều trị tăng huyết áp',
    'Thuốc thuộc nhóm ức chế thụ thể angiotensin II, giúp mạch máu giãn ra để hạ huyết áp.'),
  ('a2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Allopurinol',  '300', 'mg',  1, '{12:00}',       current_date - 60, 'Uống sau bữa trưa, uống nhiều nước trong ngày',
    'Allopurinol', 'Điều trị gút, giảm acid uric máu',
    'Thuốc làm giảm tạo acid uric trong cơ thể, giúp phòng ngừa các cơn gút cấp.'),
  ('a3000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Levothyroxine','50',  'mcg', 1, '{06:00}',       current_date - 90, 'Uống lúc đói, trước ăn sáng 30 phút',
    'Levothyroxine natri', 'Điều trị suy giáp',
    'Hormone tuyến giáp tổng hợp, bù lượng hormone mà tuyến giáp không sản xuất đủ.'),
  ('a3000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Canxi + D3',   '1',   'viên',1, '{12:00}',       current_date - 90, 'Uống sau bữa trưa',
    'Calci carbonat, Vitamin D3', 'Bổ sung canxi, hỗ trợ điều trị loãng xương',
    'Bổ sung canxi và vitamin D3 giúp xương chắc khỏe, giảm nguy cơ gãy xương.'),
  ('a4000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Amlodipine',   '10',  'mg',  1, '{08:00}',       current_date - 45, 'Uống sau khi ăn sáng',
    'Amlodipine besylate', 'Điều trị tăng huyết áp, phòng ngừa cơn đau thắt ngực',
    'Thuốc thuộc nhóm chẹn kênh canxi, giúp giãn mạch máu để hạ huyết áp và giảm gánh nặng cho tim.'),
  ('a4000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Atorvastatin', '20',  'mg',  1, '{21:00}',       current_date - 45, 'Uống buổi tối trước khi ngủ',
    'Atorvastatin calci', 'Điều trị rối loạn mỡ máu',
    'Thuốc nhóm statin, giúp giảm cholesterol xấu (LDL) trong máu.'),
  ('a5000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Metformin',    '850', 'mg',  2, '{07:30,19:30}', current_date - 30, 'Uống cùng bữa ăn',
    'Metformin hydrochloride', 'Điều trị đái tháo đường type 2, hỗ trợ kiểm soát đường huyết',
    'Thuốc giúp giảm lượng đường do gan sản xuất và tăng độ nhạy insulin của cơ thể.'),
  ('a5000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'Glucosamine',  '1500','mg',  1, '{08:00}',       current_date - 30, 'Uống sau ăn sáng',
    'Glucosamine sulfat', 'Hỗ trợ giảm triệu chứng thoái hóa khớp',
    'Hỗ trợ bảo vệ sụn khớp, giảm đau và cứng khớp ở người thoái hóa khớp.')
on conflict (id) do nothing;

-- Lịch khám: mỗi người 1 lịch sắp tới + 2 lịch đã hoàn thành
with elderly (n, id) as (
  select n, ('10000000-0000-0000-0000-00000000000' || n)::uuid from generate_series(1, 5) as n
)
insert into public.appointments (id, user_id, appointment_date, appointment_time, facility, facility_phone, doctor, reason, status)
select
  md5('appt-' || e.n || '-' || a.kind)::uuid,
  e.id,
  current_date + a.day_offset + e.n * a.spread,
  a.at_time,
  'Phenikaamec', '1900 1000', 'BS. Phạm Thị Hoa',
  a.reason, a.status
from elderly e
cross join (values
  ('upcoming', 3,   2, time '09:00', 'Tái khám định kỳ',  'UPCOMING'),
  ('recent',   -14, -1, time '08:30', 'Tái khám',          'COMPLETED'),
  ('general',  -40, -1, time '14:00', 'Khám tổng quát',    'COMPLETED')
) as a(kind, day_offset, spread, at_time, reason, status)
on conflict (id) do nothing;

-- Chỉ số: kết quả đo tại 2 lần khám đã hoàn thành (HOSPITAL) + đo tại nhà 30 ngày gần nhất (DEVICE).
with base (n, sys, dia, hr, spo2, weight, glucose) as (
  values
    (1, 132, 84, 76, 97, 50.5, 130),
    (2, 138, 86, 72, 96, 62.0, null),
    (3, 124, 78, 80, 97, 48.0, null),
    (4, 142, 88, 70, 95, 58.5, null),
    (5, 128, 80, 78, 97, 53.0, 140)
),
elderly as (
  select b.*, ('10000000-0000-0000-0000-00000000000' || b.n)::uuid as user_id from base b
),
visits as (
  select e.*, ap.id as appointment_id, (ap.appointment_date + ap.appointment_time) at time zone 'Asia/Ho_Chi_Minh' as at
  from elderly e
  join public.appointments ap on ap.user_id = e.user_id and ap.status = 'COMPLETED'
),
days as (
  select e.*, d, ((current_date - d) + time '07:00') at time zone 'Asia/Ho_Chi_Minh' as at
  from elderly e cross join generate_series(0, 29) as d
),
rows (id, user_id, type, value, unit, recorded_at, source, appointment_id, device_name) as (
  -- HOSPITAL
  select md5('m-h-bp-' || v.appointment_id)::uuid, v.user_id, 'BLOOD_PRESSURE',
         jsonb_build_object('systolic', v.sys + 2, 'diastolic', v.dia + 1), 'mmHg', v.at, 'HOSPITAL', v.appointment_id, null
  from visits v
  union all
  select md5('m-h-hr-' || v.appointment_id)::uuid, v.user_id, 'HEART_RATE', to_jsonb(v.hr), 'bpm', v.at + interval '1 minute', 'HOSPITAL', v.appointment_id, null
  from visits v
  union all
  select md5('m-h-spo2-' || v.appointment_id)::uuid, v.user_id, 'SPO2', to_jsonb(v.spo2), '%', v.at + interval '2 minutes', 'HOSPITAL', v.appointment_id, null
  from visits v
  union all
  select md5('m-h-w-' || v.appointment_id)::uuid, v.user_id, 'WEIGHT', to_jsonb(v.weight), 'kg', v.at + interval '3 minutes', 'HOSPITAL', v.appointment_id, null
  from visits v
  union all
  -- DEVICE: dao động quanh giá trị nền (sin để dữ liệu ổn định giữa các lần chạy).
  -- Người số 4 có 1 lần huyết áp cao hẳn (2 ngày trước) để sau này test cảnh báo.
  select md5('m-d-bp-' || x.n || '-' || x.d)::uuid, x.user_id, 'BLOOD_PRESSURE',
         jsonb_build_object(
           'systolic',  x.sys + round(6 * sin(x.d * 0.7 + x.n))::int + case when x.n = 4 and x.d = 2 then 30 else 0 end,
           'diastolic', x.dia + round(4 * sin(x.d * 0.9 + x.n))::int + case when x.n = 4 and x.d = 2 then 16 else 0 end),
         'mmHg', x.at, 'DEVICE', null, 'Máy đo huyết áp tại nhà'
  from days x
  union all
  select md5('m-d-hr-' || x.n || '-' || x.d)::uuid, x.user_id, 'HEART_RATE',
         to_jsonb(x.hr + round(5 * sin(x.d * 1.3 + x.n))::int), 'bpm', x.at + interval '1 minute', 'DEVICE', null, 'Đồng hồ thông minh'
  from days x
  union all
  select md5('m-d-spo2-' || x.n || '-' || x.d)::uuid, x.user_id, 'SPO2',
         to_jsonb(x.spo2 + case when sin(x.d * 1.1 + x.n) > 0.6 then 1 when sin(x.d * 1.1 + x.n) < -0.7 then -1 else 0 end),
         '%', x.at + interval '2 minutes', 'DEVICE', null, 'Máy đo SpO2 kẹp ngón tay'
  from days x
  union all
  select md5('m-d-glu-' || x.n || '-' || x.d)::uuid, x.user_id, 'BLOOD_GLUCOSE',
         to_jsonb(x.glucose + round(15 * sin(x.d * 0.8 + x.n))::int), 'mg/dL', x.at - interval '30 minutes', 'DEVICE', null, 'Máy đo đường huyết'
  from days x
  where x.glucose is not null
)
insert into public.health_metrics (id, user_id, type, value, unit, recorded_at, source, appointment_id, device_name)
select * from rows
on conflict (id) do nothing;
-- ============================================================
-- 5. Demo duyệt yêu cầu đặt lịch của bác sĩ (bản chạy riêng: supabase/snippets/demo_appointment_requests.sql)
-- ============================================================

insert into public.appointments
  (id, user_id, appointment_date, appointment_time, facility, facility_phone, doctor, staff_id,
   reason, note, status, requested_by)
select
  md5('demo-request-' || r.key)::uuid,
  r.elderly_id,
  current_date + r.day_offset,
  r.at_time,
  'Phenikaamec', '1900 1000', 'BS. Phạm Thị Hoa',
  '30000000-0000-0000-0000-000000000001'::uuid,
  r.reason, r.note, r.status, r.requested_by
from (values
  -- key, người cao tuổi, +ngày, giờ, nội dung, ghi chú, trạng thái, người gửi
  ('req-1', '10000000-0000-0000-0000-000000000001'::uuid, 2, time '08:30', 'Tái khám huyết áp',
   'Mấy hôm nay hay chóng mặt buổi sáng.', 'REQUESTED', '10000000-0000-0000-0000-000000000001'::uuid),
  ('req-2', '10000000-0000-0000-0000-000000000002'::uuid, 3, time '09:00', 'Khám tiểu đường',
   'Bố tôi đi lại khó, mong khám buổi sáng sớm.', 'REQUESTED', '20000000-0000-0000-0000-000000000002'::uuid),
  ('req-3', '10000000-0000-0000-0000-000000000003'::uuid, 1, time '14:00', 'Lấy thuốc',
   null, 'REQUESTED', '10000000-0000-0000-0000-000000000003'::uuid),
  ('req-4', '10000000-0000-0000-0000-000000000004'::uuid, 5, time '10:30', 'Tái khám định kỳ',
   'Đã hết thuốc huyết áp từ 2 hôm trước.', 'REQUESTED', '20000000-0000-0000-0000-000000000004'::uuid),
  ('req-5', '10000000-0000-0000-0000-000000000005'::uuid, 7, time '15:30', 'Khám tổng quát',
   null, 'REQUESTED', '20000000-0000-0000-0000-000000000005'::uuid),
  ('req-6', '10000000-0000-0000-0000-000000000001'::uuid, 10, time '07:30', 'Khám mắt',
   'Nhìn mờ khi đọc sách.', 'REQUESTED', '20000000-0000-0000-0000-000000000001'::uuid),
  -- Lịch đã xác nhận gần nhất
  ('up-1', '10000000-0000-0000-0000-000000000002'::uuid, 0, time '16:00', 'Tái khám định kỳ',
   null, 'UPCOMING', null),
  ('up-2', '10000000-0000-0000-0000-000000000004'::uuid, 1, time '08:00', 'Khám huyết áp',
   null, 'UPCOMING', null),
  ('up-3', '10000000-0000-0000-0000-000000000005'::uuid, 1, time '09:30', 'Lấy thuốc',
   null, 'UPCOMING', null)
) as r(key, elderly_id, day_offset, at_time, reason, note, status, requested_by)
on conflict (id) do nothing;

-- ============================================================
-- 6. Hồ sơ chuyên môn bác sĩ (bản chạy riêng: supabase/snippets/demo_staff_profile.sql)
-- ============================================================

insert into public.staff_profiles
  (user_id, academic_title, degree, specialty, department, room, license_number, years_experience, working_hours, bio)
values (
  '30000000-0000-0000-0000-000000000001', null, 'THS', 'Nội tổng quát', 'Khoa Khám bệnh', 'Phòng 203',
  '001234/HNO-CCHN', 12, 'Thứ 2 – Thứ 6: 7:30 – 16:30; Thứ 7: 7:30 – 11:30',
  'Bác sĩ nội khoa, nhiều năm theo dõi và điều trị tăng huyết áp, đái tháo đường và các bệnh mạn tính ở người cao tuổi.'
)
on conflict (user_id) do update set
  degree = excluded.degree, specialty = excluded.specialty, department = excluded.department, room = excluded.room,
  license_number = excluded.license_number, years_experience = excluded.years_experience,
  working_hours = excluded.working_hours, bio = excluded.bio;

-- ============================================================
-- 7. Tài khoản quản trị viên web (bản chạy riêng: supabase/snippets/create_admin.sql)
-- ============================================================

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

-- ============================================================
-- 8. Bác sĩ mẫu STA002–STA006 + hồ sơ chuyên môn đầy đủ cho cả 6 bác sĩ (bản chạy riêng: supabase/snippets/demo_doctors.sql)
-- ============================================================

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
