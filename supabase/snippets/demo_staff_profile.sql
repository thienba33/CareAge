-- CareAge — Hồ sơ chuyên môn mẫu cho sta001 (BS. Phạm Thị Hoa). Cần migration 20261007080000_staff_profiles.
-- Chạy lại nhiều lần không tạo trùng (cập nhật nếu đã có).
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
