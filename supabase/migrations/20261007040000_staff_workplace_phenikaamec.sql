-- CareAge — Gán nơi làm việc cho toàn bộ nhân viên y tế hiện có: Phenikaamec (cơ sở y tế khi đặt lịch theo bác sĩ).
update public.profiles
set workplace = 'Phenikaamec', workplace_phone = '1900 1000'
where role = 'MEDICAL_STAFF';
