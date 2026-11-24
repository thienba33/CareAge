-- CareAge — Lịch khám demo cho bác sĩ sta001 (BS. Phạm Thị Hoa), để xem web / app bác sĩ khi có đủ dữ liệu:
-- Tổng quan (lịch hôm nay, biểu đồ 14 ngày tới, lượt khám tháng này so với tháng trước), Lịch khám, Bệnh nhân.
--
-- Ngày tính theo giờ Việt Nam tại lúc chạy. Chạy lại được: id cố định, chạy lại thì dời ngày về quanh hôm nay
-- và đặt lại trạng thái như dưới (kể cả các yêu cầu đã duyệt thử trên web).
-- Chạy trong Supabase Dashboard → SQL Editor (hoặc psql). Cần đã áp các migration đến 20261007070000_appointment_staff_note.
--
-- Gồm (5 bệnh nhân của sta001):
--   • 7 yêu cầu "Chờ xác nhận" (REQUESTED) trong 14 ngày tới — có / không ghi chú, người già hoặc người thân gửi
--   • 9 lịch đã xác nhận (UPCOMING): 2 hôm nay, còn lại rải trong 14 ngày tới; vài lịch có lời dặn của bác sĩ
--   • 6 lịch đã khám (COMPLETED) đầu tháng này + 4 lịch tháng trước — để ô "Lượt khám tháng này" có so sánh

with today as (
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date as d
)
insert into public.appointments
  (id, user_id, appointment_date, appointment_time, facility, facility_phone, doctor, staff_id,
   reason, note, staff_note, status, requested_by)
select
  md5('demo-sta001-' || r.key)::uuid,
  r.elderly_id,
  case
    when r.day_offset is not null then t.d + r.day_offset
    -- Đã khám tháng này: ngày r.month_day của tháng này, không vượt quá hôm qua (đầu tháng thì lùi về hôm nay - 1).
    when r.month_offset = 0 then least(date_trunc('month', t.d)::date + r.month_day - 1, t.d - 1)
    else (date_trunc('month', t.d) - interval '1 month')::date + r.month_day - 1
  end,
  r.at_time,
  'Phenikaamec', '1900 1000', 'BS. Phạm Thị Hoa',
  '30000000-0000-0000-0000-000000000001'::uuid,
  r.reason, r.note, r.staff_note, r.status, r.requested_by
from today t
cross join (values
  -- key, người cao tuổi, +ngày (lịch tới), tháng (0 = này, -1 = trước), ngày trong tháng, giờ, nội dung, ghi chú, lời dặn, trạng thái, người gửi

  -- Chờ xác nhận
  ('req-1', '10000000-0000-0000-0000-000000000001'::uuid, 1, null, null, time '08:30', 'Tái khám huyết áp',
   'Mấy hôm nay hay chóng mặt buổi sáng.', null, 'REQUESTED', '10000000-0000-0000-0000-000000000001'::uuid),
  ('req-2', '10000000-0000-0000-0000-000000000002'::uuid, 2, null, null, time '09:00', 'Khám tiểu đường',
   'Bố tôi đi lại khó, mong khám buổi sáng sớm.', null, 'REQUESTED', '20000000-0000-0000-0000-000000000002'::uuid),
  ('req-3', '10000000-0000-0000-0000-000000000003'::uuid, 2, null, null, time '14:00', 'Lấy thuốc',
   null, null, 'REQUESTED', '10000000-0000-0000-0000-000000000003'::uuid),
  ('req-4', '10000000-0000-0000-0000-000000000004'::uuid, 4, null, null, time '10:30', 'Tái khám định kỳ',
   'Đã hết thuốc huyết áp từ 2 hôm trước.', null, 'REQUESTED', '20000000-0000-0000-0000-000000000004'::uuid),
  ('req-5', '10000000-0000-0000-0000-000000000005'::uuid, 6, null, null, time '15:30', 'Khám tổng quát',
   null, null, 'REQUESTED', '20000000-0000-0000-0000-000000000005'::uuid),
  ('req-6', '10000000-0000-0000-0000-000000000001'::uuid, 9, null, null, time '07:30', 'Khám mắt',
   'Nhìn mờ khi đọc sách.', null, 'REQUESTED', '20000000-0000-0000-0000-000000000001'::uuid),
  ('req-7', '10000000-0000-0000-0000-000000000003'::uuid, 12, null, null, time '09:30', 'Đo mật độ xương',
   'Hay đau lưng khi trời lạnh.', null, 'REQUESTED', '10000000-0000-0000-0000-000000000003'::uuid),

  -- Đã xác nhận
  ('up-1', '10000000-0000-0000-0000-000000000002'::uuid, 0, null, null, time '09:00', 'Tái khám định kỳ',
   null, 'Mang theo sổ theo dõi đường huyết.', 'UPCOMING', null),
  ('up-2', '10000000-0000-0000-0000-000000000004'::uuid, 0, null, null, time '15:00', 'Khám huyết áp',
   'Huyết áp buổi tối hay cao.', 'Không uống cà phê trước khi khám.', 'UPCOMING', null),
  ('up-3', '10000000-0000-0000-0000-000000000005'::uuid, 1, null, null, time '09:30', 'Lấy thuốc',
   null, null, 'UPCOMING', null),
  ('up-4', '10000000-0000-0000-0000-000000000001'::uuid, 3, null, null, time '08:00', 'Xét nghiệm máu',
   null, 'Nhịn ăn sáng trước khi lấy máu.', 'UPCOMING', null),
  ('up-5', '10000000-0000-0000-0000-000000000003'::uuid, 5, null, null, time '10:00', 'Khám tuyến giáp',
   null, null, 'UPCOMING', null),
  ('up-6', '10000000-0000-0000-0000-000000000002'::uuid, 7, null, null, time '14:30', 'Khám bàn chân tiểu đường',
   null, null, 'UPCOMING', null),
  ('up-7', '10000000-0000-0000-0000-000000000004'::uuid, 8, null, null, time '08:30', 'Điện tâm đồ',
   null, null, 'UPCOMING', null),
  ('up-8', '10000000-0000-0000-0000-000000000005'::uuid, 11, null, null, time '16:00', 'Tái khám tiểu đường',
   null, null, 'UPCOMING', null),
  ('up-9', '10000000-0000-0000-0000-000000000001'::uuid, 13, null, null, time '09:00', 'Tái khám huyết áp',
   null, null, 'UPCOMING', null),

  -- Đã khám tháng này
  ('done-1', '10000000-0000-0000-0000-000000000001'::uuid, null, 0, 2, time '08:30', 'Tái khám huyết áp', null, null, 'COMPLETED', null),
  ('done-2', '10000000-0000-0000-0000-000000000002'::uuid, null, 0, 3, time '09:00', 'Khám tiểu đường', null, null, 'COMPLETED', null),
  ('done-3', '10000000-0000-0000-0000-000000000003'::uuid, null, 0, 6, time '10:00', 'Khám tổng quát', null, null, 'COMPLETED', null),
  ('done-4', '10000000-0000-0000-0000-000000000004'::uuid, null, 0, 8, time '14:00', 'Lấy thuốc', null, null, 'COMPLETED', null),
  ('done-5', '10000000-0000-0000-0000-000000000005'::uuid, null, 0, 10, time '08:00', 'Tái khám định kỳ', null, null, 'COMPLETED', null),
  ('done-6', '10000000-0000-0000-0000-000000000002'::uuid, null, 0, 13, time '15:30', 'Tái khám định kỳ', null, null, 'COMPLETED', null),
  -- Đã khám tháng trước
  ('prev-1', '10000000-0000-0000-0000-000000000001'::uuid, null, -1, 3, time '08:30', 'Khám tổng quát', null, null, 'COMPLETED', null),
  ('prev-2', '10000000-0000-0000-0000-000000000003'::uuid, null, -1, 7, time '09:30', 'Lấy thuốc', null, null, 'COMPLETED', null),
  ('prev-3', '10000000-0000-0000-0000-000000000004'::uuid, null, -1, 12, time '10:00', 'Khám huyết áp', null, null, 'COMPLETED', null),
  ('prev-4', '10000000-0000-0000-0000-000000000005'::uuid, null, -1, 16, time '14:00', 'Khám tiểu đường', null, null, 'COMPLETED', null)
) as r(key, elderly_id, day_offset, month_offset, month_day, at_time, reason, note, staff_note, status, requested_by)
on conflict (id) do update set
  appointment_date = excluded.appointment_date,
  appointment_time = excluded.appointment_time,
  reason           = excluded.reason,
  note             = excluded.note,
  staff_note       = excluded.staff_note,
  status           = excluded.status,
  reject_reason    = null;

-- Kiểm tra nhanh: số lịch theo trạng thái của sta001 từ đầu tháng trước.
select status, count(*)
from public.appointments
where staff_id = '30000000-0000-0000-0000-000000000001'
  and appointment_date >= date_trunc('month', (now() at time zone 'Asia/Ho_Chi_Minh')::date - interval '1 month')
group by status
order by status;
