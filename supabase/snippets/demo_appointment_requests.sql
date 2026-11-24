-- CareAge — Dữ liệu demo cho chức năng duyệt yêu cầu đặt lịch của bác sĩ (sta001 · BS. Phạm Thị Hoa).
-- Cần đã áp migration 20261007030000_appointment_linked_doctor và 20261007050000_staff_portal.
-- Chạy lại nhiều lần không tạo trùng (id cố định, on conflict do nothing). Ngày tính theo ngày chạy.
--
-- Gồm:
--   • 6 yêu cầu "Chờ xác nhận" (REQUESTED) gửi tới sta001 — người cao tuổi hoặc người thân gửi, có / không ghi chú
--   • 3 lịch đã xác nhận (UPCOMING) hôm nay / ngày mai — để xem "Lịch khám gần nhất", "Khám hôm nay"

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
