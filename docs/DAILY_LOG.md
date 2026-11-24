# Daily Work Log

Nhật ký công việc hàng ngày của dự án CareAge. Mỗi ngày thêm một mục mới ở đầu file (mới nhất lên trên).

Mỗi mục ngày dùng thẻ `<details>/<summary>` để có nút đóng/mở (thu gọn/mở rộng). Bấm vào dòng ngày để đóng/mở nội dung.

Format:

```md
<details open>
<summary><strong>YYYY-MM-DD</strong></summary>

### Đã làm
- ...

### Đang làm / Chưa xong
- ...

### Vấn đề gặp phải
- ...

### Kế hoạch tiếp theo
- ...

</details>
```

> Ghi chú: `<details open>` = mặc định mở khi mới thêm. Khi qua ngày mới, đổi `<details open>` của mục cũ thành `<details>` (đóng lại) để log gọn hơn.

---

<details open>
<summary><strong>2026-09-29</strong></summary>

### Đã làm
- Tích hợp Supabase: client, schema + RLS, Supabase Auth, chuyển toàn bộ service khỏi mock, seed 11 tài khoản test và dữ liệu y tế mẫu; đã `db push` lên project thật.
- Phần 1: Trang chủ dùng dữ liệu thật (thuốc tiếp theo + nút "Đã uống", tỉ lệ uống thuốc, chỉ số, lịch khám).
- Phần 2: nhắc uống thuốc / lịch khám bằng local notification; cron đánh dấu liều bỏ lỡ.
- Phần 3: cảnh báo sức khỏe sinh ở Backend theo ngưỡng; màn Cảnh báo; chuông có badge.
- Phần 4: biểu đồ lịch sử chỉ số (7 ngày → 1 năm) với khoảng tham chiếu.
- Phần 5: SOS gọi 115 + SMS kèm vị trí cho người thân.
- Đổi tên cơ sở y tế trong dữ liệu thành "Phenikaamec".

### Đang làm / Chưa xong
- Chưa test trên thiết bị thật (thông báo, SMS, vị trí).

### Vấn đề gặp phải
- Nút SOS cũ báo "đã gửi thông báo" nhưng không gửi gì — đã thay bằng luồng SMS thật.

### Kế hoạch tiếp theo
- Test trên điện thoại; push notification từ server cho người thân; Home cho CAREGIVER / MEDICAL_STAFF.

</details>

<details>
<summary><strong>2026-09-22</strong></summary>

### Đã làm
- Thiết kế lại giao diện Auth (Login/Register/Forgot Password) theo phong cách hero + card nổi, đồng bộ 3 màn hình:
  - `src/screens/auth/LoginScreen.tsx`: hero jade, card đổ bóng, toggle hiện/ẩn mật khẩu bằng icon, link "Quên mật khẩu?", nút "Đăng nhập với Google" (UI placeholder, chưa nối OAuth thật).
  - `src/screens/auth/RegisterScreen.tsx`: đổi chip chọn role thành dropdown (Modal + Select), đồng bộ style hero/card với Login.
  - `src/screens/auth/ForgotPasswordScreen.tsx` (mới): form nhập email + trạng thái "đã gửi" (mock, chưa có API reset password thật).
  - `src/navigation/AuthNavigator.tsx`: thêm route `ForgotPassword`.
  - Thêm `assets/logo.png` (logo CareAge) và dùng trên cả 3 màn hình auth.
  - Cài `@expo/vector-icons` để dùng icon (eye, chevron, arrow-back, logo-google...).
- Role & Permission + Navigation theo role (mục 6 skill `elderly-health-mobile-app`):
  - `src/constants/roles.ts` (mới): tập trung cấu hình bộ tab theo từng role thay vì hard-code trong `RootNavigator`.
  - `src/screens/caregiver/ElderlyListScreen.tsx` (mới): màn hình khung "Người cao tuổi được liên kết" cho CAREGIVER.
  - `src/screens/medical-staff/PatientsScreen.tsx` (mới): màn hình khung "Người cao tuổi được phân công" cho MEDICAL_STAFF.
  - `src/screens/shared/AdminUnsupportedScreen.tsx` (mới): thông báo ADMIN dùng Website Admin thay vì mobile.
  - `src/navigation/RootNavigator.tsx`: chọn bộ tab (`ROLE_TABS`) theo `currentUser.role`, thêm icon cho từng tab bằng `Ionicons`.
- Redesign `src/screens/HomeScreen.tsx` (dashboard ELDERLY) theo phong cách hero + card của nhóm Auth: lời chào theo tên/ngày, nút thông báo (placeholder), quick actions (Thuốc/Chỉ số/Liên hệ/Hồ sơ), nút "Gọi khẩn cấp" gọi thật tới `tel:115` qua `Linking` (có `Alert` xác nhận trước), hàng chỉ số nhanh (Huyết áp/Nhịp tim/SpO2, đang rỗng), thẻ tuân thủ uống thuốc (progress bar), và các card Thuốc sắp uống/Chỉ số gần nhất/Lịch khám/Cảnh báo.
- Xây module Medications thật (mock), thay `MedicationScreen` khung tĩnh:
  - `src/types/medication.ts` (mới): model `Medication` + `MedicationDose` theo skill mục 10–11.
  - `src/mock/mockMedications.ts` (mới): dữ liệu mẫu gắn với `elderly-1` (2 thuốc, liều hôm nay).
  - `src/services/medication.service.ts` (mới): mock service `getMedications`, `getTodayDoses`, `markDoseTaken`, `markDoseSkipped`.
  - `src/hooks/useMedications.ts` (mới): hook load theo `currentUser`, expose actions đánh dấu đã uống/bỏ qua.
  - `src/screens/MedicationScreen.tsx`: redesign hero/card, danh sách "Liều hôm nay" (có nút đánh dấu cho ELDERLY, chỉ xem cho role khác) + "Danh sách thuốc".
  - `src/types/index.ts`: bỏ type `Medication` cũ (không còn ai dùng, đã thay bằng `types/medication.ts`).
- Hiện đại hoá `MedicationScreen` + thêm xem lịch uống thuốc theo tuần:
  - `src/utils/date.ts` (mới): helper `startOfWeek`, `addDays`, `isSameDay`, `toDateKey` (tuần bắt đầu Thứ Hai theo chuẩn VN).
  - `src/components/medication/WeeklySchedule.tsx` (mới): dải 7 ngày (chip ngày, chấm đánh dấu hôm nay), điều hướng tuần trước/sau, danh sách lịch uống theo ngày được chọn — tính từ `medication.times`/`startDate`/`endDate` (không phải lịch sử thật, vì mock chưa lưu dose theo từng ngày quá khứ). Ngày hôm nay hiển thị trạng thái + nút đánh dấu thật (nối `todayDoses`); ngày khác chỉ hiển thị badge "Dự kiến".
  - `src/screens/MedicationScreen.tsx`: thêm tab pill "Hôm nay" / "Xem theo tuần" nổi trên hero (cùng phong cách tabsCard như Auth/Home); card liều hôm nay đổi sang shadow + status pill badge thay vì border phẳng, hiện đại hơn.
- Tinh chỉnh thẻ liều thuốc theo phản hồi UI + quy tắc màu nghiệp vụ:
  - Đổi cách hiển thị giờ uống từ ô màu trong card sang **tag ghim nổi ở góc trên** (icon `pin`, xoay nhẹ, đổ bóng riêng) để bớt cảm giác rập khuôn.
  - `src/constants/doseStatus.ts` (mới): tập trung `DOSE_STATUS_LABEL/COLOR/ICON`, dùng chung cho `MedicationScreen` và `WeeklySchedule` (trước đó bị duplicate). Quy ước màu: **xanh lá = đã uống, vàng = trong ngày chưa uống, đỏ = quá giờ uống hơn 5 phút**.
  - `src/utils/medicationStatus.ts` (mới): `getEffectiveDoseStatus(dose)` — tính trạng thái hiển thị theo thời gian thực (PENDING quá giờ hẹn >5 phút thì hiển thị đỏ như MISSED), không đổi trạng thái lưu trữ (người dùng vẫn đánh dấu "đã uống" trễ được bình thường).
- Thêm xem chi tiết thuốc khi giữ (long press) vào thẻ thuốc:
  - `src/components/medication/MedicationDetailModal.tsx` (mới): bottom sheet hiện tên, liều lượng, giờ uống (dạng chip), số lần/ngày, hướng dẫn sử dụng, thời gian dùng (startDate/endDate), trạng thái thuốc.
  - Thêm `onLongPress` (delay 350ms) cho `DoseCard`, `MedicationCard` (`MedicationScreen.tsx`) và card lịch tuần (`WeeklySchedule.tsx`) — tất cả đều mở chung 1 modal chi tiết.
- Redesign card trong "Danh sách thuốc" cho hài hoà với phần còn lại của trang:
  - `src/constants/medicationStatus.ts` (mới): tập trung `MEDICATION_STATUS_LABEL/COLOR`, dùng chung cho `MedicationScreen` và `MedicationDetailModal` (trước đó modal tự định nghĩa riêng).
  - Đổi từ border phẳng + 1 dòng text dài sang: icon có chấm trạng thái nhỏ ở góc, liều lượng + từng giờ uống hiển thị dạng chip riêng biệt (đồng bộ ngôn ngữ chip đã dùng ở modal chi tiết và card liều hôm nay), thêm chevron gợi ý có thể bấm/giữ.
  - Sau đó rút gọn lại theo yêu cầu: "Danh sách thuốc" chỉ còn liệt kê tên + liều lượng (bỏ chip giờ uống — phần đó thuộc lịch uống, không phải thông tin chung của thuốc), đổi tương tác từ giữ (long-press) sang **bấm (tap)** để mở `MedicationDetailModal` xem đầy đủ giờ giấc/hướng dẫn.
  - Sửa tiếp lần 2: đổi hẳn từ dạng card khối sang **liệt kê phẳng** (1 khung danh sách, mỗi dòng cách nhau bằng đường kẻ mỏng, chấm trạng thái nhỏ + tên + liều + chevron — không còn icon box/shadow riêng từng dòng).
  - `src/types/medication.ts`: thêm field `activeIngredient`, `indication`, `description` (thông tin giới thiệu thuốc, khác với lịch uống).
  - `src/mock/mockMedications.ts`: bổ sung dữ liệu giới thiệu mẫu cho Amlodipine/Metformin.
  - `src/components/medication/MedicineInfoModal.tsx` (mới): bottom sheet **giới thiệu thuốc** (thành phần, công dụng/điều trị bệnh gì, mô tả) — tách riêng khỏi `MedicationDetailModal` (vốn là modal lịch uống/hướng dẫn sử dụng). Bấm vào dòng trong "Danh sách thuốc" mở modal này thay vì modal lịch uống.
- Đồng bộ `WeeklySchedule.tsx` (Xem theo tuần) theo cùng ngôn ngữ thiết kế vừa áp cho "Liều hôm nay": đổi ô giờ vuông sang **tag ghim** xoay nhẹ (giống `DoseCard`), trạng thái hiển thị bằng **icon màu** thay vì text pill (icon dùng chung `DOSE_STATUS_ICON`), kích thước nút đánh dấu đã uống/bỏ qua tăng lên 36px khớp với "Liều hôm nay".
- Gộp Lịch tái khám (Appointments — module #12 skill) vào cùng tab với Thuốc, đổi tên tab thành **"Chăm sóc"** (theo quyết định của người dùng, chấp nhận đánh đổi so với roadmap tách tab riêng):
  - `src/types/appointment.ts`, `src/mock/mockAppointments.ts`, `src/services/appointment.service.ts`, `src/hooks/useAppointments.ts` (mới) — cùng pattern mock Screen→Hook→Service như Medications.
  - `src/constants/appointmentStatus.ts` (mới): `APPOINTMENT_STATUS_LABEL/COLOR` (UPCOMING/COMPLETED/CANCELLED/MISSED).
  - `src/components/appointment/AppointmentDetailModal.tsx` (mới): bottom sheet chi tiết lịch khám (cơ sở y tế, bác sĩ, nội dung khám, trạng thái).
  - `src/constants/roles.ts`: đổi `label: "Thuốc"` → `"Chăm sóc"` cho tab `Medications` (ELDERLY + CAREGIVER).
  - `src/screens/MedicationScreen.tsx`: đổi tiêu đề hero thành "Chăm sóc sức khỏe", thêm section "Lịch tái khám" (liệt kê phẳng, cùng kiểu "Danh sách thuốc") bên dưới.
  - Chỉ xem danh sách — đặt lịch mới/huỷ/dời lịch chưa làm (ngoài scope theo PLAN đã xác nhận).
  - Đổi thứ tự hiển thị: "Lịch tái khám" lên trên "Danh sách thuốc" theo yêu cầu.
- Xây module Health Metrics thật (mock), thay `VitalsScreen` khung tĩnh (skill mục 13):
  - `src/types/health.ts` (mới): model `HealthMetric` với 6 loại (`BLOOD_PRESSURE, HEART_RATE, BLOOD_GLUCOSE, SPO2, TEMPERATURE, WEIGHT`); huyết áp có `value: {systolic, diastolic}`, còn lại là số đơn.
  - `src/constants/healthMetric.ts` (mới): nhãn, đơn vị mặc định, icon cho từng loại — dùng 1 màu trung tính cho icon, KHÔNG tự tô đỏ/vàng theo giá trị vì chưa có khoảng tham chiếu từ Backend (đúng nguyên tắc Medical Safety mục 26 skill, tránh tự ý "chẩn đoán").
  - `src/mock/mockHealthMetrics.ts`, `src/services/health.service.ts`, `src/hooks/useHealthMetrics.ts` (mới) — cùng pattern mock Screen→Hook→Service như Medications/Appointments (chỉ đọc, chưa có ghi).
  - `src/screens/VitalsScreen.tsx`: redesign hero/card — lưới "Chỉ số gần nhất" (6 ô, kèm mũi tên xu hướng tăng/giảm/không đổi so với lần đo trước, chỉ mang tính tham khảo), "Lịch sử đo" liệt kê phẳng bên dưới.
  - `src/types/index.ts`: bỏ type `VitalReading` cũ (không còn ai dùng, đã thay bằng `types/health.ts`).
  - Chưa làm: biểu đồ đường (Health Charts #14), khoảng tham chiếu bất thường/cảnh báo tự động (Health Alerts #15) — ngoài scope theo PLAN đã xác nhận.
- **Đổi hướng Health Metrics theo phản hồi**: ban đầu làm form "Thêm chỉ số" cho ELDERLY tự nhập, nhưng người dùng chỉ ra tự đo cần thiết bị thật (ví dụ đồng hồ thông minh) — hiện tại **chưa có** nên tạm thời bỏ hẳn luồng tự nhập, chỉ số **chỉ đến từ kết quả tái khám tại bệnh viện**:
  - `src/types/health.ts`: thêm `source: "HOSPITAL" | "DEVICE"` (để sẵn cho giai đoạn tích hợp thiết bị đeo sau này) và `appointmentId?` (gắn kết quả với lịch tái khám đã sinh ra nó).
  - `src/mock/mockAppointments.ts`: thêm lịch khám đã hoàn thành thứ 2 (`appt-2`, "Tái khám huyết áp" 2026-09-15) để có 2 điểm huyết áp thấy được xu hướng.
  - `src/mock/mockHealthMetrics.ts`: viết lại toàn bộ, mỗi chỉ số gắn `appointmentId` trỏ về lịch khám đã hoàn thành tương ứng, ngày ghi nhận trùng ngày khám.
  - Bỏ hẳn: `src/components/health/AddMetricModal.tsx` (xoá file, không còn nơi gọi), `addMetric`/`isSaving` trong `useHealthMetrics`/`health.service.ts`, nút "Thêm chỉ số" trong `VitalsScreen.tsx`. Đổi subtitle/empty-state sang đúng ngữ cảnh "kết quả tái khám".
  - Dùng lại `METRIC_UNIT` (constants/healthMetric.ts) để hiện đơn vị mặc định cho ô chỉ số chưa có dữ liệu (trước đó bị bỏ trống rỗng do không còn form nhập).
- Thêm hiển thị nguồn đo + nút kết nối thiết bị ngoài cho "Lịch sử đo":
  - `src/types/health.ts`: thêm `deviceName?` (khi `source = "DEVICE"`).
  - `src/constants/devices.ts` (mới): danh sách thiết bị mock (Đồng hồ thông minh, Máy đo huyết áp tại nhà, Máy đo SpO2 kẹp ngón tay) — mỗi thiết bị gắn 1 loại chỉ số nó đo được.
  - `src/services/health.service.ts`: thêm `syncFromDevice(userId, deviceName, type)` — sinh giá trị mô phỏng hợp lý theo từng loại chỉ số (mock, chưa có Bluetooth/HealthKit thật).
  - `src/hooks/useHealthMetrics.ts`: thêm `connectDevice(deviceName, type)` + `isSyncing`.
  - `src/components/health/ConnectDeviceModal.tsx` (mới): bottom sheet chọn thiết bị, có ghi chú rõ "bản demo — chưa hỗ trợ kết nối Bluetooth thật" để không gây hiểu nhầm là tính năng thật.
  - `src/screens/VitalsScreen.tsx`: thêm nút "Kết nối thiết bị ngoài" dưới hero; mỗi dòng trong "Lịch sử đo" giờ hiện thêm **nguồn đo** (tên bệnh viện — lấy qua `useAppointments` join theo `appointmentId`, hoặc tên thiết bị nếu `source = DEVICE`) bên cạnh tên chỉ số và thời gian.
  - Sửa tiếp: đổi nút "Kết nối thiết bị ngoài" từ nút nằm trong luồng nội dung sang **FAB (nút tròn nổi)** ở góc dưới-phải màn hình, `position: absolute`, dùng màu `colors.secondary` (cam) thay vì primary/danger — tách biệt rõ khỏi các nút hành động jade còn lại, đồng thời không lạm dụng màu `danger` (vốn dành riêng cho hành động nguy hiểm theo `color-theme`) cho một tính năng trung tính.
- Xây trang Khẩn cấp thật (thay `EmergencyScreen` cũ: SOS button không hoạt động + danh bạ rỗng, không thêm được):
  - `src/types/index.ts`: thêm `userId` vào `EmergencyContact` (trước đó thiếu, không lọc được theo user).
  - `src/mock/mockEmergencyContacts.ts`, `src/services/emergencyContact.service.ts` (đủ CRUD: get/add/update/delete), `src/hooks/useEmergencyContacts.ts` (mới) — cùng pattern mock Screen→Hook→Service.
  - `src/components/emergency/ContactFormModal.tsx` (mới): form thêm/sửa liên hệ (tên, mối quan hệ, số điện thoại), dùng chung 1 modal cho cả 2 thao tác.
  - `src/screens/EmergencyScreen.tsx`: redesign hero + nút "GỌI CẤP CỨU 115" to màu `danger`, có `Alert` xác nhận trước khi gọi thật qua `Linking` (giống pattern ở Home); danh sách "Liên hệ khẩn cấp" liệt kê phẳng — mỗi dòng có nút gọi nhanh (`tel:` tới số của liên hệ, gọi thẳng không cần xác nhận vì không phải số cấp cứu), nút sửa, nút xoá (có `Alert` xác nhận trước khi xoá); nút "+" ở đầu section để thêm liên hệ mới.
  - Chưa làm (ngoài scope theo PLAN): chia sẻ vị trí GPS, gửi SMS tự động, thông tin y tế nhanh (nhóm máu/dị ứng — thuộc Health Profile, chưa xây module này).
- Sửa lại logic nút khẩn cấp theo đúng nghiệp vụ thật + gọn giao diện:
  - `src/types/appointment.ts`: thêm `facilityPhone?` (hotline cơ sở y tế); `src/mock/mockAppointments.ts` gán hotline mẫu "1900 1000" cho cả 3 lịch khám.
  - `src/screens/EmergencyScreen.tsx`: nút SOS giờ **gọi thẳng tới bệnh viện** (lấy `facilityPhone` từ `useAppointments`, fallback về 115 nếu người dùng chưa có lịch khám nào), đồng thời **mô phỏng gửi thông báo khẩn cấp** tới toàn bộ danh bạ (người thân/bác sĩ) qua `Alert` liệt kê tên sau khi xác nhận gọi — đúng ý "gọi bệnh viện, người nhà/bác sĩ nhận thông báo" thay vì phải gọi lần lượt từng người.
  - Đổi tên mục "Liên hệ khẩn cấp" → **"Người nhận thông báo"** kèm mô tả nhỏ, đúng vai trò mới của danh bạ (nơi nhận thông báo, không phải nơi gọi trực tiếp).
  - Gộp 3 nút (gọi/sửa/xoá) trên mỗi dòng liên hệ thành **1 hành động chạm** mở `Alert` dạng menu (Gọi / Sửa / Xoá / Huỷ) — gọn hơn nhiều, đỡ rối mắt trên màn hình nhỏ.
  - Lưu ý: gửi thông báo hiện chỉ là mô phỏng (`Alert`), vì module Notifications (#16 skill) và cơ chế gửi thật (push/SMS) chưa được xây.
- Xây trang Hồ sơ đầy đủ (User Profile + Health Profile — skill mục 5, 8), thay `ProfileScreen` cũ (chỉ hiển thị tĩnh + đăng xuất):
  - `src/services/auth.service.ts` + `src/context/AuthContext.tsx`: thêm `updateProfile(payload)` — sửa tên/SĐT của `currentUser` (mock, ghi thẳng vào `mockUsers`).
  - `src/types/healthProfile.ts`, `src/mock/mockHealthProfiles.ts`, `src/services/healthProfile.service.ts`, `src/hooks/useHealthProfile.ts` (mới) — hồ sơ sức khỏe: ngày sinh, giới tính, chiều cao, cân nặng, nhóm máu, địa chỉ (đúng field skill mục 8).
  - `src/constants/healthProfile.ts` (mới): nhãn giới tính/nhóm máu.
  - `src/components/profile/EditProfileModal.tsx`, `src/components/profile/EditHealthProfileModal.tsx` (mới): form sửa thông tin cơ bản và hồ sơ sức khỏe (giới tính/nhóm máu chọn bằng chip).
  - `src/screens/ProfileScreen.tsx`: redesign hero (avatar chữ cái đầu, tên, mã, badge role, nút sửa) + card liên hệ (email/SĐT) + **"Hồ sơ sức khỏe" chỉ hiện với ELDERLY** (lưới 5 ô: tuổi tính từ ngày sinh/giới tính/chiều cao/cân nặng/nhóm máu, card địa chỉ) + card "Người nhận thông báo khẩn cấp" (tóm tắt từ `useEmergencyContacts`, bấm vào điều hướng sang tab Khẩn cấp) + nút đăng xuất.
  - Không thuộc scope lần này (đã nêu trong PLAN): Medical Conditions (bệnh nền/tiền sử/dị ứng), avatar ảnh thật.
- Xây module Medical Conditions (bệnh nền/tiền sử/dị ứng — skill mục 9), gắn vào Hồ sơ sức khỏe của ELDERLY:
  - `src/types/medicalCondition.ts` (mới): model theo skill (`name, diagnosedAt?, status: ACTIVE/INACTIVE/RESOLVED, note?`) + thêm `category` (`CHRONIC` bệnh nền / `HISTORY` tiền sử / `ALLERGY` dị ứng) để nhóm hiển thị.
  - `src/constants/medicalCondition.ts` (mới): nhãn category/status, màu status (ACTIVE=warning, RESOLVED=success, INACTIVE=muted).
  - `src/mock/mockMedicalConditions.ts`, `src/services/medicalCondition.service.ts` (CRUD đủ), `src/hooks/useMedicalConditions.ts` (mới) — cùng pattern mock Screen→Hook→Service.
  - `src/components/profile/ConditionFormModal.tsx` (mới): form thêm/sửa/xoá dùng chung — chọn nhóm + trạng thái bằng chip, có ô ghi chú nhiều dòng.
  - `src/screens/ProfileScreen.tsx`: thêm section "Bệnh nền & Tiền sử" — 3 nhóm liệt kê phẳng riêng biệt, mỗi mục có pill trạng thái màu, nút "+" thêm theo từng nhóm, bấm vào mục để sửa/xoá.
  - Chưa làm: CAREGIVER/MEDICAL_STAFF xem hồ sơ bệnh nền của người họ chăm sóc (cần màn hình "chi tiết người cao tuổi" riêng, chưa xây — ngoài scope PLAN).

### Đang làm / Chưa xong
- Chưa lưu session bằng Secure Storage (đang là mock, mất state khi reload).
- Đăng nhập Google mới là UI placeholder (alert "Sắp ra mắt"), chưa có `expo-auth-session` + OAuth client thật.
- Chưa có Appointments/Health Alerts nên tab CAREGIVER/MEDICAL_STAFF tạm thời chỉ dùng lại các màn hình đã có (Home/Vitals/Profile) + 1 màn hình khung riêng.
- Card "Thuốc sắp uống"/thanh tuân thủ ở Home vẫn đang là dữ liệu tĩnh — chưa nối với `useMedications` (sẽ làm ở bước sau).
- `mockDoses` sinh 1 lần khi app khởi động, không tự reset theo ngày thật (đủ dùng cho demo/mock, cần backend thật khi lên production).

### Vấn đề gặp phải
- Không có.

### Kế hoạch tiếp theo
- Nối Home dashboard với `useMedications`/`useHealthMetrics` (dữ liệu thật thay vì tĩnh cho card "Thuốc sắp uống"/"Chỉ số sức khỏe gần nhất").
- Theo Development Priority (mục 34): Health Charts, sau đó Health Alerts.
- Nghiên cứu tích hợp thiết bị đeo thật (Bluetooth/HealthKit/Health Connect) — hiện `ConnectDeviceModal` mới là mock UI mô phỏng luồng kết nối + sinh dữ liệu ngẫu nhiên, chưa nói chuyện với thiết bị thật nào.

</details>

<details>
<summary><strong>2026-09-18</strong></summary>

### Đã làm
- Tạo skill `elderly-health-mobile-app` (`.claude/skills/elderly-health-mobile-app/SKILL.md`) mô tả kiến trúc, role/permission, quy trình làm việc cho dự án.
- Tạo skill `color-theme` (`.claude/skills/color-theme/SKILL.md`) định nghĩa bảng màu chủ đạo xanh ngọc (jade/teal) và quy tắc sử dụng màu.
- Tạo file nhật ký công việc hàng ngày (`docs/DAILY_LOG.md`) với nút đóng/mở cho từng ngày.
- Xây dựng chức năng Đăng ký / Đăng nhập (mock, đủ 4 role):
  - `src/types/auth.ts`, `src/mock/mockUsers.ts` (4 tài khoản mẫu: admin/elderly/caregiver/staff, mật khẩu `123456`).
  - `src/services/auth.service.ts` (mock login/register, giả lập độ trễ + lỗi).
  - `src/context/AuthContext.tsx` + `src/hooks/useAuth.ts`.
  - `src/screens/auth/LoginScreen.tsx`, `src/screens/auth/RegisterScreen.tsx`, `src/navigation/AuthNavigator.tsx`.
  - Cập nhật `RootNavigator.tsx` (chuyển Auth stack ↔ Tab chính theo trạng thái đăng nhập), `App.tsx` (bọc `AuthProvider`), `ProfileScreen.tsx` (hiện thông tin user + nút đăng xuất).
  - Cập nhật `theme/colors.ts` sang jade `#0FAE94` theo skill `color-theme`.
  - Cài thêm `react-dom`, `react-native-web` để build/test trên web.

### Đang làm / Chưa xong
- Chưa lưu session bằng Secure Storage (đang là mock, mất state khi reload).
- Chưa nối role sau đăng nhập với navigation riêng theo role (mục 6 skill `elderly-health-mobile-app`).

### Vấn đề gặp phải
- Thiếu dependency `react-dom`/`react-native-web` khi chạy `expo start --web` lần đầu — đã cài bổ sung.

### Kế hoạch tiếp theo
- Theo Development Priority (mục 34): tiếp tục Role & Permission + Navigation theo role, sau đó User Profile / Health Profile.

</details>
