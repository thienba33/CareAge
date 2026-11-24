# Kế hoạch phát triển — Chức năng cho Người cao tuổi (ELDERLY)

Ngày lập: 2026-09-29

Làm lần lượt từng phần. Mỗi phần phải được xác nhận trước khi code, và sau khi xong thì cập nhật `docs/TASKS.md` và `docs/DAILY_LOG.md`.

## Tổng quan

| # | Phần việc | Trạng thái | Dependency mới |
|---|-----------|------------|----------------|
| 0 | Tích hợp Supabase (Backend) | ✅ DONE | `@supabase/supabase-js`, `expo-sqlite` |
| 1 | Trang chủ dùng dữ liệu thật | ✅ DONE (chờ test trên máy) | Không |
| 2 | Nhắc uống thuốc & lịch khám bằng thông báo | ✅ DONE (chờ test trên máy) | `expo-notifications` |
| 3 | Cảnh báo sức khỏe (Health Alerts) | ✅ DONE (chờ test trên máy) | Không |
| 4 | Biểu đồ chỉ số sức khỏe | ✅ DONE (chờ test trên máy) | `react-native-svg` |
| 5 | SOS kèm vị trí gửi cho người thân | ✅ DONE (chờ test trên máy) | `expo-location`, `expo-sms` |
| 6 | Trang chủ v2: dữ liệu đồng bộ, dễ dùng hơn | ✅ 6A–6E DONE (chờ test trên máy) · 6F bỏ qua | `@tanstack/react-query` (mục 6A) |
| 7 | Trang cho người thân (CAREGIVER) | ✅ 7A–7E DONE (chờ test trên máy) | Không |

Trạng thái: ⬜ TODO · 🟡 IN PROGRESS · ✅ DONE

### Nguyên tắc chung (theo skill `elderly-health-mobile-app`)

- Luồng dữ liệu: `Screen → Hook → Service (mock, sau này thay bằng REST) → Mock data`. Không gọi service trực tiếp trong UI.
- Logic chọn và tính toán (liều sắp tới, chỉ số mới nhất...) đặt trong `src/utils/`, không viết trong component.
- Mỗi màn hình phải có đủ các trạng thái Loading, Empty và Error.
- Không tự đưa ra chẩn đoán. Ngưỡng cảnh báo là **cấu hình của Backend** (ở Mobile tạm thời là mock service), không hard-code trong UI.
- Màu sắc theo skill `color-theme`. Không chỉ dùng màu để thể hiện trạng thái mà luôn kèm icon hoặc chữ.
- Trước khi dùng API của Expo, đọc tài liệu đúng phiên bản: https://docs.expo.dev/versions/v57.0.0/

---

## Phần 0 — Tích hợp Supabase

### Mục tiêu

Thay mock data bằng Supabase (Postgres + Auth + RLS). Chỉ viết lại **bên trong** `src/services/*`; hook và màn hình giữ nguyên.

### Các bước

- ✅ **0a — Client:** cài `@supabase/supabase-js` và `expo-sqlite`, tạo `src/config/supabase.ts`, `.env.local` (đã gitignore) và `.env.example`.
- ✅ **0b — Schema và RLS:** đã viết [supabase/migrations/20260929022401_init_schema.sql](../supabase/migrations/20260929022401_init_schema.sql) cho các bảng `profiles`, `caregiver_links`, `staff_assignments`, `health_profiles`, `medical_conditions`, `emergency_contacts`, `medications`, `medication_doses`, `appointments`, `health_metrics`, và bật RLS cho mọi bảng. Đã chạy và kiểm tra RLS theo từng role trên DB cục bộ. Đã `db push` lên project thật ngày 2026-09-29.
- ✅ **0c — Auth:** `auth.service` dùng Supabase Auth và bảng `profiles`; `AuthContext` khôi phục session khi mở app (có màn chờ) và tự đăng xuất khi phiên hết hạn. `supabaseError.ts` chuyển lỗi thành thông báo tiếng Việt. Đã xóa `mockUsers.ts`. Đã test trên Supabase cục bộ. Đăng nhập thật cần chạy `db push` (0b) trước.
- ✅ **0d — Services:** 6 service (healthProfile, medicalCondition, emergencyContact, medication, appointment, health) đã dùng Supabase, và toàn bộ `src/mock/` đã bị xóa. Các hook có trạng thái `error`. Màn hình có `ErrorState` với nút "Thử lại". Lưu, xóa hoặc đánh dấu thất bại thì hiện Alert.
- ✅ **0e — Seed:** [supabase/seed.sql](../supabase/seed.sql) gồm 11 tài khoản và dữ liệu y tế mẫu cho 5 người cao tuổi: bệnh nền, liên hệ khẩn cấp, thuốc, lịch khám (1 sắp tới, 2 đã khám), chỉ số đo tại viện và đo tại nhà trong 30 ngày. Đã test cục bộ. Đã seed lên project thật.

### Quy tắc

- Role lưu trong bảng `profiles`, chỉ trigger hoặc Admin được ghi. **Không** lấy role từ `user_metadata`, vì client sửa được.
- Trong app chỉ dùng publishable (anon) key. Không đưa `service_role`/secret key vào app.
- Quyền truy cập do RLS quyết định: ELDERLY chỉ xem dữ liệu của mình; CAREGIVER xem qua `caregiver_links`; MEDICAL_STAFF xem qua `staff_assignments`.
- Chỉ import `supabase` trong tầng services, không import trong Screen/Component.
- Lỗi từ Supabase phải được chuyển thành thông báo thân thiện (skill mục 22), không hiển thị lỗi thô.

### Quyết định trong schema

- Tự đăng ký chỉ được chọn ELDERLY, CAREGIVER hoặc MEDICAL_STAFF. Metadata ghi `ADMIN` sẽ bị hạ thành ELDERLY. MEDICAL_STAFF tự đăng ký không xem được ai cho đến khi ADMIN tạo `staff_assignments`.
- `caregiver_links` và `staff_assignments` chỉ ADMIN được ghi. Trigger kiểm tra role của hai bên liên kết.
- Thuốc, lịch khám và chỉ số nguồn HOSPITAL chỉ nhân viên y tế được phân công hoặc ADMIN được ghi. Người cao tuổi chỉ thêm được chỉ số nguồn DEVICE.
- Liều thuốc được sinh bằng RPC `ensure_doses_for_date(user_id, date)`. Client truyền **ngày theo giờ địa phương**, vì giờ server là UTC. Client chỉ được đổi `status`, còn `taken_at` do trigger ghi.
- Ở `profiles`, client chỉ được sửa `name` và `phone`.
- Tên cột khác với type ở Mobile: `appointment_date`/`appointment_time` (Mobile là `date`/`time`), `times` và `scheduled_time` là kiểu `time` (trả về dạng `"08:00:00"`). Service sẽ chuyển đổi ở bước 0d.

### Vấn đề đã ghi nhận

- Session đang lưu bằng `expo-sqlite/localStorage` theo tài liệu Expo và **chưa mã hóa**. Skill yêu cầu Secure Storage, nên sau này cân nhắc mã hóa session bằng khóa lưu trong `expo-secure-store`.
- `profiles.email` được sao chép từ `auth.users` lúc đăng ký. Nếu sau này cho đổi email thì cần thêm trigger đồng bộ.
- Màn Quên mật khẩu vẫn là mock. Để nối `resetPasswordForEmail`, cần deep link đưa người dùng về app và thêm màn đặt mật khẩu mới.
- Khi project bật Confirm email, Supabase không báo lỗi "email đã tồn tại" lúc đăng ký (để tránh lộ email nào đã đăng ký), mà chỉ báo đã gửi email xác nhận.
- ✅ Đã có cron `mark-missed-doses` (00:05 giờ VN) chuyển liều PENDING của ngày trước sang `MISSED` (Phần 2).

---

## Phần 1 — Trang chủ dùng dữ liệu thật

### Mục tiêu

Hiện tại [HomeScreen.tsx](../src/screens/HomeScreen.tsx) chỉ hiển thị dữ liệu cố định (`0/0`, `--`, "Chưa có..."). Phần này nối Trang chủ với dữ liệu thuốc, chỉ số và lịch khám đã có sẵn.

### Hiển thị

- **Tuân thủ uống thuốc hôm nay:** `số liều đã uống / tổng số liều`, kèm thanh tiến độ.
- **Thuốc sắp uống:** liều `PENDING` gần nhất tính từ bây giờ (tên thuốc, liều lượng, giờ uống), có nút "Đã uống" gọi `markTaken`.
- **Chỉ số nhanh:** giá trị mới nhất của Huyết áp, Nhịp tim và SpO2.
- **Chỉ số sức khỏe gần nhất:** loại chỉ số, giá trị và thời điểm đo.
- **Lịch khám gần nhất:** lịch `UPCOMING` gần nhất (ngày, giờ, cơ sở y tế).
- **Cảnh báo:** giữ placeholder, sẽ nối ở Phần 3.

### File tạo mới

- `src/utils/dashboard.ts`: các hàm thuần (pure function):
  - `getDoseCompliance(doses)` → `{ taken, total }`
  - `getNextPendingDose(doses, medications, now)` → liều kèm thông tin thuốc, hoặc `null`
  - `getLatestMetricByType(metrics, type)` → `HealthMetric | null`
  - `getLatestMetric(metrics)` → `HealthMetric | null`
  - `getNextAppointment(appointments, now)` → `Appointment | null`
- `src/utils/healthMetric.ts` (nếu chưa có hàm tương tự): `formatMetricValue(metric)`, ví dụ "130/80", "72". Cần kiểm tra `VitalsScreen` để dùng lại, tránh viết trùng.
- `src/components/home/`: tách Trang chủ (hiện 358 dòng) thành các component nhỏ:
  - `ComplianceCard.tsx`, `NextDoseCard.tsx`, `QuickStats.tsx`, `LatestMetricCard.tsx`, `NextAppointmentCard.tsx`

### File cần sửa

- `src/screens/HomeScreen.tsx`: dùng `useMedications`, `useHealthMetrics`, `useAppointments` và render các component trên.
- Tải lại dữ liệu khi quay về tab (`useFocusEffect` gọi `reload`), vì mỗi hook giữ state riêng. Nếu không, đánh dấu uống thuốc ở tab Thuốc thì Trang chủ vẫn hiện dữ liệu cũ.
- Thêm kéo xuống để làm mới (`RefreshControl`).

### API / Role / Permission

- API: dùng lại các service hiện có, không thêm API mới.
- Role: chỉ ELDERLY (Trang chủ của CAREGIVER và MEDICAL_STAFF là màn hình riêng, không bị ảnh hưởng).

### Rủi ro

- Ba hook cùng tải dữ liệu nên có thể hiện loading hơi lâu. Mỗi card sẽ có skeleton riêng thay vì chặn cả màn hình.
- Mock data có thể không có liều nào của hôm nay. Khi đó hiện Empty state.

### Kiểm thử

- `npx tsc --noEmit` chạy không lỗi.
- Đăng nhập tài khoản ELDERLY có dữ liệu mock: số liệu khớp với tab Thuốc, Chỉ số và lịch khám.
- Bấm "Đã uống" ở Trang chủ thì tab Thuốc cập nhật, và ngược lại.
- Tài khoản không có dữ liệu: các Empty state hiển thị đúng.

---

## Phần 2 — Nhắc uống thuốc & lịch khám bằng thông báo

### Mục tiêu

Đến giờ uống thuốc, điện thoại hiện thông báo. Trước giờ khám 1 ngày và 2 giờ cũng có thông báo nhắc.

### File tạo mới

- `src/services/notification.service.ts`: bọc `expo-notifications` để UI không gọi trực tiếp thư viện:
  - `requestPermission()`, `configureHandler()`, `setupAndroidChannel()`
  - `scheduleMedicationReminders(medications)`: lịch lặp hằng ngày theo `times`, trong khoảng `startDate` đến `endDate`
  - `scheduleAppointmentReminders(appointments)`
  - `cancelAll()` / `cancelByType(type)`
- `src/constants/notification.ts`: `NotificationType` (`MEDICATION_REMINDER`, `APPOINTMENT_REMINDER`, `HEALTH_ALERT`, `SYSTEM`), id của Android channel, thời điểm nhắc trước giờ khám.
- `src/hooks/useReminderSync.ts`: khi đăng nhập hoặc khi danh sách thuốc/lịch khám thay đổi thì hủy lịch cũ và đặt lại. Khi đăng xuất thì hủy toàn bộ.

### File cần sửa

- `App.tsx` hoặc `RootNavigator.tsx`: gắn `useReminderSync` cho role ELDERLY.
- Xử lý khi người dùng bấm vào thông báo: mở tab Thuốc hoặc chi tiết lịch khám (deep link qua `data.type`).
- `app.json`: thêm plugin `expo-notifications`.

### Lưu ý

- Thông báo **không phải** nguồn dữ liệu (theo skill mục 11). Trạng thái uống thuốc vẫn lưu qua service.
- Web không hỗ trợ thông báo, nên dùng `Platform.OS` để bỏ qua trên web.
- Expo Go hỗ trợ local notification. Push từ server là việc của giai đoạn sau (cần development build).
- iOS giới hạn 64 thông báo đang chờ, vì vậy dùng trigger lặp hằng ngày (`DAILY`) thay vì đặt từng ngày một.

### Kiểm thử

- Tạo liều thuốc cách hiện tại 1–2 phút và kiểm tra thông báo hiện ra.
- Bấm vào thông báo thì mở đúng màn hình.
- Từ chối quyền thông báo thì app không bị crash, và có hướng dẫn bật lại.
- Đăng xuất thì không còn thông báo nào.

---

## Phần 3 — Cảnh báo sức khỏe (Health Alerts)

### Mục tiêu

Khi chỉ số nằm ngoài ngưỡng theo dõi, hệ thống tạo cảnh báo. Người cao tuổi xem được danh sách cảnh báo và đánh dấu đã đọc.

### Kiến trúc

- Ngưỡng là **cấu hình của Backend**. Ở Mobile, `alert.service.ts` (mock) đóng vai Backend: khi có chỉ số mới, service so sánh với `mockAlertThresholds` và sinh cảnh báo.
- UI chỉ hiển thị cảnh báo mà service trả về, không tự đánh giá chỉ số.
- Nội dung cảnh báo trung tính, ví dụ: "Chỉ số nằm ngoài khoảng theo dõi được cấu hình. Bạn nên đo lại hoặc liên hệ nhân viên y tế."

### File tạo mới

- `src/types/alert.ts`: `HealthAlert`, `AlertSeverity` (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`), `AlertType`
- `src/constants/alert.ts`: nhãn, icon và màu theo severity
- `src/mock/mockAlerts.ts`, `src/mock/mockAlertThresholds.ts`
- `src/services/alert.service.ts`: `getAlerts(userId)`, `markAsRead(id)`, `evaluateMetric(metric)` (phần mock thay cho Backend)
- `src/hooks/useAlerts.ts`: `alerts`, `unreadCount`, `markAsRead`, `reload`
- `src/screens/AlertsScreen.tsx` và `src/components/alert/AlertItem.tsx`, `AlertDetailModal.tsx`

### File cần sửa

- `health.service.ts`: sau `syncFromDevice` thì gọi `evaluateMetric` (mô phỏng việc Backend xử lý).
- `HomeScreen`: thay placeholder cảnh báo bằng số cảnh báo chưa đọc và cảnh báo mới nhất.
- Navigation: thêm cách vào màn hình Cảnh báo (icon chuông có badge trên Trang chủ, hoặc thêm tab; sẽ quyết định khi làm).
- Cảnh báo `HIGH` hoặc `CRITICAL`: gửi local notification (dùng lại service của Phần 2).

### Kiểm thử

- Thêm chỉ số vượt ngưỡng thì cảnh báo xuất hiện và số chưa đọc tăng.
- Đánh dấu đã đọc thì badge giảm.
- Severity phân biệt được bằng cả icon và chữ, không chỉ bằng màu.

---

## Phần 4 — Biểu đồ chỉ số sức khỏe

### Mục tiêu

Xem xu hướng của từng chỉ số theo các khoảng 7 ngày, 30 ngày, 3 tháng, 6 tháng và 1 năm.

### File tạo mới

- `src/components/health/MetricChart.tsx`: biểu đồ đường tự vẽ bằng `react-native-svg`, có trục thời gian, giá trị và đơn vị. Huyết áp vẽ 2 đường (tâm thu và tâm trương). Nếu có khoảng tham chiếu từ service thì vẽ vùng tham chiếu.
- `src/components/health/RangeSelector.tsx`: chọn khoảng thời gian bằng nút lớn.
- `src/utils/chart.ts`: lọc chỉ số theo khoảng thời gian và chuẩn hóa thành các điểm dữ liệu.
- `src/constants/chartRange.ts`
- `src/screens/MetricHistoryScreen.tsx`: biểu đồ và danh sách lịch sử của một loại chỉ số.

### File cần sửa

- `VitalsScreen.tsx`: bấm vào một chỉ số thì mở `MetricHistoryScreen`.
- `mockHealthMetrics.ts`: thêm dữ liệu trải dài vài tháng để biểu đồ có ý nghĩa.

### Lưu ý

- Không kết luận hay chẩn đoán từ biểu đồ.
- Điểm bất thường chỉ đánh dấu khi có cảnh báo tương ứng từ Phần 3.

### Kiểm thử

- Đổi khoảng thời gian thì biểu đồ cập nhật đúng.
- Không có dữ liệu thì hiện Empty state.
- Chữ và nhãn đủ lớn, không bị chồng lên nhau trên màn hình nhỏ.

---

## Phần 5 — SOS kèm vị trí gửi cho người thân

### Mục tiêu

Nút SOS (ở Trang chủ và màn Khẩn cấp) gọi 115, đồng thời mở màn soạn SMS gửi các liên hệ khẩn cấp, kèm link Google Maps chỉ vị trí hiện tại.

### File tạo mới

- `src/services/location.service.ts`: xin quyền vị trí và lấy vị trí hiện tại (có timeout, dùng vị trí gần nhất đã biết nếu không lấy được).
- `src/services/sos.service.ts`: tạo nội dung tin nhắn và gọi `expo-sms` với danh sách số điện thoại lấy từ `emergencyContact.service`.
- `src/hooks/useSOS.ts`
- `src/components/emergency/SOSButton.tsx`: component dùng chung cho Home và Emergency, thay cho phần code SOS đang lặp lại ở hai nơi.

### File cần sửa

- `HomeScreen.tsx`, `EmergencyScreen.tsx`: dùng `SOSButton`.
- `app.json`: thêm plugin `expo-location` kèm câu giải thích quyền bằng tiếng Việt.

### Lưu ý

- Không lấy được vị trí thì vẫn gửi SMS nhưng không kèm vị trí. Việc gọi 115 không được phụ thuộc vào vị trí.
- `expo-sms` chỉ mở màn soạn tin, người dùng vẫn phải bấm Gửi. Muốn gửi tự động thì cần Backend, để giai đoạn sau.
- Dữ liệu vị trí không được ghi vào log.

### Kiểm thử

- Có quyền vị trí: tin nhắn có link Maps đúng.
- Từ chối quyền vị trí: vẫn gửi được tin nhắn không kèm vị trí.
- Chưa có liên hệ khẩn cấp: hướng dẫn người dùng thêm liên hệ.
- Máy không có SIM hoặc là web: hiện thông báo phù hợp, không bị crash.

---

---

## Phần 6 — Trang chủ v2 (đã làm 6A–6E theo xác nhận; 6F không làm)

### Mục tiêu

Trang chủ hiển thị số liệu **luôn khớp** với các tab khác, không tải lại thừa, và dễ thao tác hơn cho người cao tuổi. Không thêm khối thông tin mới, giữ bố cục đã tối giản (SOS giữ nguyên).

### Vấn đề phát hiện khi rà soát

| # | Vấn đề | Ảnh hưởng |
|---|--------|-----------|
| 1 | Mỗi hook (`useMedications`, `useHealthMetrics`...) giữ state riêng. Trang chủ phải tải lại **4 API mỗi lần quay về tab** để khớp với tab Chăm sóc | Tốn mạng, thẻ bị "giật", dễ lệch dữ liệu. Chưa đúng skill mục 20–21 (server state dùng React Query, có cache) |
| 2 | Hai thuốc cùng giờ (vd. 08:00 Amlodipine + Metformin) chỉ hiện một, phải bấm "Đã uống" hai lần | Người già dễ nghĩ đã uống đủ |
| 3 | Bấm nhầm "Đã uống" thì không hoàn tác được ở Trang chủ | Dữ liệu tuân thủ sai, người già lo lắng |
| 4 | 3 ô chỉ số không cho biết **đo lúc nào**. Giá trị từ 30 ngày trước trông như số hôm nay | Hiểu sai tình trạng hiện tại |
| 5 | Trạng thái "quá giờ" chỉ tính lại khi tải dữ liệu. Để app mở lâu thì liều 20:00 vẫn hiện "chưa uống" dù đã quá giờ | Nhắc sai |
| 6 | Khi đang tải, các thẻ hiện chữ "Đang tải...", nhảy bố cục khi có dữ liệu | Skill mục 23 yêu cầu Skeleton |
| 7 | Lời chào "Xin chào, Tám!" chưa có cách xưng hô | Người cao tuổi quen được gọi "bà Tám", "ông Hùng" |

### Giải pháp đề xuất (theo thứ tự ưu tiên)

**6A — Cache dữ liệu dùng chung (React Query)** · giải quyết #1

- Cài `@tanstack/react-query`, bọc `QueryClientProvider` trong `App.tsx`.
- Viết lại **bên trong** 5 hook (`useMedications`, `useHealthMetrics`, `useAppointments`, `useAlerts`, `useHealthProfile`) bằng `useQuery`, **giữ nguyên dữ liệu trả về** (`isLoading`, `error`, `reload`...) để màn hình không phải sửa.
- Sau khi đánh dấu uống thuốc, đồng bộ thiết bị hoặc đọc cảnh báo: cập nhật cache trực tiếp, mọi tab thấy thay đổi ngay.
- Tự tải lại khi app quay lại foreground (`focusManager` + `AppState`), `staleTime` 30 giây.
- Bỏ đoạn tự tải lại khi quay về tab (`useFocusEffect` + `hasFocusedOnce`) ở `HomeScreen`.
- File mới: `src/config/queryClient.ts`, `src/constants/queryKeys.ts`. File sửa: `App.tsx`, 5 hook, `HomeScreen.tsx`, `AuthContext.tsx` (xóa cache khi đăng xuất).

**6B — Thẻ "Thuốc hôm nay" gộp liều cùng giờ + hoàn tác** · giải quyết #2, #3

- `utils/dashboard.ts`: `getNextDoseGroup()` trả về **nhóm** các liều PENDING sớm nhất cùng giờ.
- Thẻ hiện "08:00 · 2 thuốc", liệt kê tên từng thuốc, với nút **"Đã uống cả 2"** (hoặc bấm riêng từng thuốc).
- Sau khi bấm, hiện dải **"Đã ghi nhận · Hoàn tác"** trong 5 giây. Bấm Hoàn tác thì trả liều về `PENDING`.
- Service: thêm `markDosePending(doseId)`. RLS hiện tại đã cho phép, trigger tự xóa `taken_at`, nên **không cần migration**.
- File mới: `components/home/UndoToast.tsx`. File sửa: `MedicationTodayCard.tsx`, `dashboard.ts`, `medication.service.ts`, `useMedications.ts`.

**6C — Ô chỉ số có thời điểm đo** · giải quyết #4

- Dưới mỗi giá trị ghi "Hôm nay" / "Hôm qua" / "3 ngày trước".
- Quá 7 ngày thì chữ mờ đi và ghi "Lâu chưa đo". **Không** đánh giá cao/thấp (skill mục 26).
- File sửa: `QuickStats.tsx`, `utils/date.ts` (`relativeDayText`).

**6D — Tự cập nhật trạng thái theo giờ** · giải quyết #5

- Hook `useNow(60_000)` cập nhật mỗi phút khi màn hình đang hiển thị, để trạng thái "quá giờ" và liều tiếp theo luôn đúng.
- File mới: `hooks/useNow.ts`. File sửa: `HomeScreen.tsx`, `MedicationTodayCard.tsx`, `utils/medicationStatus.ts` (nhận `now`).

**6E — Skeleton khi tải** · giải quyết #6

- `components/common/Skeleton.tsx`: khối xám nhạt đúng kích thước thẻ, không nhảy bố cục.
- File sửa: `HomeSectionCard.tsx`, `QuickStats.tsx`.

**6F — Lời chào có xưng hô** · giải quyết #7 (tùy chọn)

- Lấy giới tính từ hồ sơ sức khỏe: FEMALE → "Chào bà Tám", MALE → "Chào ông Hùng", chưa rõ → "Xin chào, Tám".
- File sửa: `HomeScreen.tsx` (dùng `useHealthProfile`, đã có cache nhờ 6A).

### Role / Permission / API

- Chỉ ảnh hưởng ELDERLY. Nút "Đã uống" và "Hoàn tác" chỉ hiện cho ELDERLY như hiện tại.
- Không thêm API mới, không cần migration. Hoàn tác dùng lại quyền cập nhật `status` của liều thuốc.

### Ngoài phạm vi (ghi nhận, làm sau)

- Trang chủ riêng cho CAREGIVER / MEDICAL_STAFF. Hiện hai role này dùng chung `HomeScreen` và thấy thẻ trống.
- Cache offline (xem dữ liệu khi mất mạng).

### Rủi ro

- 6A thay cơ chế tải dữ liệu của 5 hook. Nếu làm sai, nhiều màn hình bị ảnh hưởng. Cách giảm rủi ro: giữ nguyên dữ liệu hook trả về, làm từng hook một, chạy `tsc` và bundle sau mỗi hook.
- Hoàn tác đúng lúc trigger `mark-missed-doses` chạy (00:05) có thể trả liều của hôm qua về PENDING. Chỉ cho hoàn tác liều của hôm nay.

### Kiểm thử

- `tsc`, `expo export`, unit test `getNextDoseGroup`, `relativeDayText`.
- Đánh dấu uống ở Trang chủ → tab Chăm sóc cập nhật ngay, **không** gọi lại API. Và ngược lại.
- Hai thuốc cùng giờ: "Đã uống cả 2" → tiến độ tăng 2. Hoàn tác → trả về như cũ.
- Để app mở qua giờ uống thuốc: thẻ chuyển sang "quá giờ" trong vòng 1 phút.
- Tắt mạng: banner lỗi + "Thử lại", SOS vẫn bấm được.

---

## Phần 7 — Trang cho người thân (CAREGIVER) (đã xác nhận 2026-10-06)

### Mục tiêu

Người thân **theo dõi từ xa** một hoặc nhiều người cao tuổi: biết hôm nay đã uống thuốc chưa, chỉ số gần nhất, cảnh báo và lịch khám. Có thể **gọi ngay** cho người cao tuổi. Người thân **chỉ xem**, không sửa dữ liệu y tế (skill mục 2.3).

### Hiện trạng

| Phần | Tình trạng |
|------|------------|
| Database + RLS | ✅ Người thân đọc được mọi dữ liệu của người cao tuổi đã liên kết (`can_view_elderly`), không ghi được. Đã test |
| Tài khoản test | ✅ cg001–cg005, mỗi người liên kết với 1 người cao tuổi |
| Tab "Người cao tuổi" | ❌ Danh sách trống, đang dùng mock |
| Trang chủ, Sức khỏe, Chăm sóc | ❌ Dùng chung màn của người cao tuổi nhưng tải dữ liệu **của chính người thân**, nên các thẻ đều trống |
| Liên kết người thân | ❌ Chỉ ADMIN tạo được (`caregiver_links`), chưa có luồng trong app |
| Báo cho người thân khi có cảnh báo | ❌ Chưa có |

### Ý tưởng chính: "người đang được xem"

- Tất cả hook dữ liệu (`useMedications`, `useHealthMetrics`, `useAppointments`, `useAlerts`...) hiện đều lấy `currentUser.id`. Phần này thay bằng **`subjectId`**: với ELDERLY là chính mình, với CAREGIVER là người cao tuổi đang được chọn.
- Cache React Query đã phân theo id, nên đổi người đang xem thì mỗi người có cache riêng, không lẫn dữ liệu.
- **Người cao tuổi không bị ảnh hưởng:** với họ, `subjectId` chính là `currentUser.id` như hiện nay.

### Các bước

**7A — Nền tảng "người đang xem"**

- `src/context/SubjectContext.tsx`: lưu người cao tuổi đang được chọn, nhớ lần chọn gần nhất. Hook `useSubject()` trả `{ subjectId, subject, linkedElderly, select }`.
- `src/services/caregiver.service.ts`: `getLinkedElderly()` đọc `caregiver_links` kèm `profiles` (tên, số điện thoại, quan hệ).
- Sửa 8 hook dữ liệu: dùng `subjectId` thay `currentUser.id`. Nhắc thuốc (`useReminderSync`) và SOS vẫn chỉ chạy với ELDERLY.
- `components/caregiver/ElderlySwitcher.tsx`: chip "Đang xem: Bà Tám ▾" trên đầu các màn Sức khỏe / Chăm sóc / Cảnh báo. Chỉ hiện khi theo dõi từ 2 người trở lên.

**7B — Liên kết người thân bằng mã mời** (cần migration)

- Người cao tuổi vào Hồ sơ, bấm **"Mời người thân"**. App hiện **mã 6 số, hiệu lực 15 phút**.
- Người thân nhập mã và chọn quan hệ (con, vợ/chồng, cháu...). Liên kết tạo xong ngay.
- Người cao tuổi chủ động tạo mã, coi như đã đồng ý, nên không cần bước duyệt sau. Mã ngắn hạn cũng khó đoán hơn mã ELD001.
- Người cao tuổi xem được danh sách người đang theo dõi mình và **gỡ liên kết** được. Người thân cũng tự rời được.
- Migration: bảng `link_invites (code, elderly_id, expires_at, used_at)`, các RPC `create_link_invite()`, `accept_link_invite(code, relationship)`, `revoke_caregiver_link(link_id)`. Tất cả là security definer có kiểm tra role. Nhập sai mã quá 5 lần trong 10 phút thì bị khóa.

**7C — Trang chủ người thân**

- Mỗi người cao tuổi có **một thẻ tổng quan**:
  - tên, quan hệ;
  - thuốc hôm nay `2/3`, **liều quá giờ chưa uống in đậm đỏ**;
  - huyết áp / nhịp tim gần nhất kèm "Hôm nay / 3 ngày trước";
  - số cảnh báo mới;
  - lịch khám tới.
- Thẻ có 2 nút lớn: **Gọi** (số điện thoại trong hồ sơ) và **Xem chi tiết** (chọn người đó rồi mở tab Sức khỏe).
- Nếu chưa liên kết ai: hiện hướng dẫn kèm nút "Nhập mã liên kết".
- Dữ liệu lấy bằng **một RPC** `caregiver_dashboard()`, tổng hợp ở Backend cho mọi người cao tuổi đã liên kết. Không gọi N×4 API.
- File: `screens/caregiver/CaregiverHomeScreen.tsx`, `components/caregiver/ElderlySummaryCard.tsx`, `hooks/useCaregiverDashboard.ts`.

**7D — Các màn xem chi tiết (chỉ xem)**

- **Mục "Người thân bạn theo dõi" trong Hồ sơ** (trước là tab "Người thân", gộp vào Hồ sơ 2026-10-07): danh sách người đang theo dõi, nút "Thêm người thân (nhập mã)". Bấm vào một người thì xem hồ sơ sức khỏe, bệnh nền, dị ứng, liên hệ khẩn cấp ở chế độ chỉ đọc.
- **Sức khỏe:** dùng lại `VitalsScreen` và `MetricHistoryScreen`, ẩn nút "Kết nối thiết bị".
- **Chăm sóc:** dùng lại `MedicationScreen`. Ẩn ✓ / ✕ và thao tác vuốt (đã có điều kiện theo role), hiện rõ liều "Quá giờ uống" và "Bỏ qua". Lịch tái khám xem bình thường.
- **Cảnh báo:** người thân có **trạng thái đã đọc riêng**, không đánh dấu thay người cao tuổi. Migration bảng `alert_reads (alert_id, user_id, read_at)`.
- **Hồ sơ:** thông tin của chính người thân (tên, số điện thoại, đăng xuất) cộng danh sách người đang theo dõi.
- Tab bar CAREGIVER: **Trang chủ · Người thân · Sức khỏe · Chăm sóc · Hồ sơ**, giữ 5 tab. Cảnh báo mở từ nút chuông như bên người cao tuổi.

**7E — Báo cho người thân khi có cảnh báo** (khi app đang mở hoặc chạy nền)

- Dùng **Supabase Realtime** nghe bảng `alerts`. RLS vẫn áp dụng, nên chỉ nhận cảnh báo của người mình theo dõi. Có cảnh báo HIGH / CRITICAL thì hiện **local notification** "Bà Tám: Huyết áp nằm ngoài khoảng theo dõi", và cập nhật cache.
- Migration: `alter publication supabase_realtime add table public.alerts`.
- File: `hooks/useCaregiverAlertWatch.ts`, gắn ở `RootNavigator` cho CAREGIVER.

### Role / Permission

- CAREGIVER: chỉ đọc. RLS hiện tại đã chặn mọi thao tác ghi dữ liệu y tế. App ẩn các nút sửa và đánh dấu.
- ELDERLY: thêm quyền tạo mã mời và gỡ liên kết của chính mình.
- MEDICAL_STAFF: không ảnh hưởng.

### Ngoài phạm vi (giai đoạn sau)

- **Push notification khi app đã tắt hẳn**, ví dụ người thân nhận SOS hoặc cảnh báo lúc không mở app. Việc này cần development build, bảng lưu push token và Edge Function. Đề xuất làm thành **Phần 8**.
- Người thân đánh dấu uống thuốc hộ (cần thêm quyền, phải hỏi bác sĩ hoặc nghiệp vụ).
- Nhắn tin hoặc gọi video trong app.

### Rủi ro

- **7A sửa 8 hook mà người cao tuổi đang dùng.** Cách giảm rủi ro: với ELDERLY `subjectId === currentUser.id`, làm từng hook, test lại luồng của eld001 sau mỗi bước.
- **Mã mời có thể bị dò.** Mã 6 số, hết hạn sau 15 phút, dùng một lần, giới hạn số lần nhập sai.
- **Realtime chỉ chạy khi app còn sống**, nên không thay được push (xem Phần 8).

### Kiểm thử

- `tsc`, `expo export`, migration chạy trên DB cục bộ, test RLS và RPC bằng API cho 3 role.
- cg001 thấy đúng dữ liệu của eld001, không thấy eld002. Thử đánh dấu thuốc hoặc sửa hồ sơ bằng API thì bị chặn.
- eld001 tạo mã, cg002 nhập mã thì liên kết thành công. Mã hết hạn, dùng lại, hoặc sai 5 lần thì bị từ chối.
- Một người thân theo dõi 2 người cao tuổi: chuyển qua lại không lẫn dữ liệu.
- eld004 đo huyết áp cao, cg004 đang mở app nhận được thông báo.
- Đăng nhập lại eld001: mọi chức năng của người cao tuổi vẫn như cũ.

## Phần 8 — Push notification cho người thân (đã xác nhận 2026-10-07)

### Kiến trúc

```
alerts / cron → INSERT notifications → trigger push_after_notification (pg_net)
             → Edge Function send-push → Expo Push API → máy người thân (cả khi app đã tắt)
```

App (CAREGIVER) đăng ký Expo push token qua RPC `register_push_token`, gỡ bằng `unregister_push_token` trước khi đăng xuất. Realtime vẫn dùng để cập nhật hộp thông báo khi app đang mở; local notification chỉ là phương án dự phòng khi máy không có push.

### Cấu hình một lần

1. `npx eas init` → thêm `extra.eas.projectId` vào `app.json`.
2. Firebase: tạo app Android (package trùng `android.package`), tải `google-services.json`, khai báo `android.googleServicesFile`; upload FCM V1 service account key bằng `eas credentials`.
3. Development build: `eas build --profile development --platform android` (hoặc `npx expo run:android`). Expo Go Android không nhận push.
4. Edge Function: `supabase functions deploy send-push --no-verify-jwt`, `supabase secrets set PUSH_WEBHOOK_SECRET=<chuỗi ngẫu nhiên>` (tùy chọn `EXPO_ACCESS_TOKEN`).
5. Vault (SQL Editor của project thật):
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/send-push', 'push_function_url');
   select vault.create_secret('<cùng chuỗi PUSH_WEBHOOK_SECRET>', 'push_webhook_secret');
   ```
   Cục bộ dùng URL `http://supabase_kong_CareAge:8000/functions/v1/send-push`.

### Kiểm thử

- cg004 tắt hẳn app, eld004 nhập huyết áp cao → cg004 nhận push; bấm vào mở đúng màn của eld004.
- App đang mở: chỉ 1 thông báo, không trùng. Đăng xuất: không còn nhận push.

## Ghi chú khi triển khai Phần 2–5

- **Phần 2:** nhắc thuốc dùng trigger `DAILY`, mỗi khung giờ một thông báo, gộp các thuốc cùng giờ. Nhắc lịch khám lúc 19:00 hôm trước và 2 giờ trước giờ khám. Lịch nhắc được đồng bộ lại mỗi lần mở app, và bị hủy khi đăng xuất. Hồ sơ có mục bật lại quyền thông báo. Vì lịch lặp không tự dừng theo `endDate`, thuốc hết hạn chỉ ngừng nhắc sau lần mở app kế tiếp.
- **Phần 3:** bỏ ý tưởng dùng mock `evaluateMetric` trong app. Việc sinh cảnh báo là **trigger ở Backend** (`evaluate_metric`), dùng ngưỡng trong `alert_thresholds` (ngưỡng mặc định, hoặc ngưỡng riêng do bác sĩ đặt). Mặc định không cảnh báo ở mức 140/90, để tránh báo mỗi ngày với người đã được chẩn đoán tăng huyết áp. Sau khi đồng bộ thiết bị, nếu có cảnh báo thì app hiện hộp thoại ngay, thay cho local notification, vì lúc đó người dùng đang ở trong app. Màn Cảnh báo mở từ nút chuông trên Trang chủ; tab bar giữ 5 tab để dễ dùng cho người cao tuổi.
- **Phần 4:** khoảng tham chiếu lấy từ RPC `applicable_alert_thresholds` (Backend quyết định). Điểm đo bị đánh dấu bất thường khi có cảnh báo tương ứng. Hai màu series đã qua script kiểm tra của skill dataviz.
- **Phần 5:** SOS gọi 115 trước, rồi mới mở tin nhắn kèm vị trí khi người dùng quay lại app. Đã bỏ cảnh báo giả "Đã gửi thông báo khẩn cấp" và số hotline giả của bệnh viện trong nút SOS.

### Còn lại / giai đoạn sau

- Push notification từ server, để người thân nhận cảnh báo và SOS mà không cần mở app. Việc này cần development build và Edge Function.
- Home riêng cho CAREGIVER / MEDICAL_STAFF. Màn nhập thuốc và lịch khám cho bác sĩ.
- Quên mật khẩu thật, cần deep link.

## Các phần có thể làm sau

Chỉnh cỡ chữ toàn app, đọc to bằng giọng nói, ảnh viên thuốc, chế độ đơn giản, điểm danh hằng ngày, nhắc thuốc sắp hết, thẻ y tế khẩn cấp.
