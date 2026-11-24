# Task History

## [TASK-029] Web cho bác sĩ (khu /bs)

Status: COMPLETED

Date: 2026-10-19

Implemented:

- Đăng nhập theo vai trò: `signIn` chuyển ADMIN → `/`, MEDICAL_STAFF → `/bs`; `lib/auth.ts` thêm `getSessionUser` (cache), `requireRole`, `requireStaff`, `homeFor`; vào sai khu bị chuyển về khu của mình; người cao tuổi / người thân → "Không dùng được trang web"
- Form đăng nhập: tab Bác sĩ có form thật (trước chỉ hướng dẫn dùng app)
- Khu `/bs` (sidebar thu gọn được, menu riêng): Tổng quan (4 số liệu, lịch khám gần nhất, yêu cầu chờ duyệt có nút Duyệt, cảnh báo 30 ngày), Bệnh nhân (đang theo dõi / cựu bệnh nhân), hồ sơ bệnh nhân (chỉ số mới nhất, biểu đồ 90 ngày theo từng chỉ số có xem dạng bảng, lịch khám, cảnh báo, thông tin cá nhân, bệnh nền, thuốc, người nhà; nút Kết thúc điều trị), Lịch khám (cây dọc, chỉ lịch của bác sĩ), Hồ sơ của tôi (sửa hồ sơ chuyên môn)
- Dùng chung với quản trị: `AppointmentTree` / `ReviewButton` chuyển sang `components/appointments`, `PageError`, `NavLinks area`, `groupByDay` (ngày theo giờ Việt Nam); `reviewRequest` / `saveStaffProfile` cho cả bác sĩ (bác sĩ chỉ sửa hồ sơ của mình); action mới `endMyAssignment` (RPC `end_staff_assignment`)
- Tổng quan bác sĩ làm lại dạng dashboard (`getStaffOverview`, `components/dashboard/StaffCharts.tsx`): 5 ô số liệu (bệnh nhân, lịch hôm nay, chờ duyệt, lượt khám tháng này so với cùng kỳ tháng trước, cảnh báo 30 ngày so với 30 ngày trước đó), Lịch khám gần nhất (có nút Duyệt), Bệnh nhân cần chú ý, biểu đồ lịch khám 14 ngày tới (cột chồng đã xác nhận / chờ duyệt) và cảnh báo theo bệnh nhân
- Trang Bệnh nhân dạng bảng (`PatientsBrowser`, `getPatientRows`): tìm theo tên / mã / SĐT / bệnh nền (bỏ dấu), lọc Đang theo dõi / Cần chú ý / Có lịch sắp tới / Chờ duyệt / Cựu bệnh nhân (giữ trên URL), sắp xếp (cần chú ý trước, lịch gần nhất, tên, tuổi); cột: bệnh nhân (tuổi, giới tính, SĐT), bệnh nền đang theo dõi, lần đo gần nhất, lịch khám tới, tình trạng
- Không cần migration mới: dùng RPC `staff_dashboard`, `get_former_patients`, `end_staff_assignment`, `review_appointment_request` và RLS hiện có

Files:

- `web/src/lib/{auth,actions,data,labels,staffData,appointmentGroups}.ts`
- `web/src/app/bs/**` (mới), `web/src/app/login/LoginForm.tsx`, `web/src/app/khong-co-quyen/page.tsx`, `web/src/app/(admin)/{error.tsx,lich-kham/page.tsx}`
- `web/src/components/{NavLinks,CurrentAdmin,PageError}.tsx`, `web/src/components/appointments/*`

Verification:

- `tsc`, `eslint`, `next build` (thư mục `.next-check`) đạt
- Đăng nhập `sta001` trên project thật bằng trình duyệt headless: vào `/bs`, mở `/` bị chuyển về `/bs`; chụp Tổng quan, Bệnh nhân, hồ sơ bệnh nhân, Lịch khám, Hồ sơ, Cựu bệnh nhân — không lỗi JS; chỉ xem, không thao tác ghi
- Chưa bấm thử Duyệt / Kết thúc điều trị / Lưu hồ sơ trên web (tránh sửa dữ liệu thật)

## [TASK-028] Web quản trị — Lịch khám dạng cây dọc (timeline)

Status: COMPLETED

Date: 2026-10-08

Implemented:

- `AppointmentTree`: trục dọc; mỗi ngày là nút tròn xanh (Hôm nay / Ngày mai / thứ-ngày + số lịch); mỗi lịch là nhánh: chấm màu trạng thái trên trục → gạch nối → thẻ lịch (giờ, bệnh nhân, nội dung, bác sĩ · cơ sở, ghi chú, lời dặn, lý do từ chối, nhãn trạng thái có icon, nút Duyệt)
- Thanh lọc trạng thái giữ nguyên

Files:

- `web/src/app/(admin)/lich-kham/AppointmentTree.tsx` (mới), `web/src/app/(admin)/lich-kham/page.tsx`

Verification:

- `tsc`, lint, build (thư mục `.next-check`, đã xoá) sạch; chụp ảnh trang tạm với dữ liệu mẫu (đã xoá)

## [TASK-027] Web quản trị: đồng bộ giao diện với app mobile ở mức "cân bằng"

Status: COMPLETED

Date: 2026-10-08

Implemented:

- Đầu trang: dải xanh ngọc phẳng, thấp gọn, bo góc dưới (không vòng tròn mờ / gradient)
- Utility `card` / `shadow-card` (globals.css): thẻ bo 16px, viền nhạt, bóng rất nhẹ như thẻ trên app — áp dụng cho bảng, biểu đồ, ô chỉ số, khung bác sĩ
- Avatar chữ cái nền xanh nhạt; nhãn vai trò / trạng thái dạng viên thuốc có icon + màu giống app (khôi phục `lib/statusIcons.ts`)
- Menu trái: mục đang chọn nền xanh nhạt chữ xanh đậm; tab đang chọn chữ xanh đậm
- Ô nhập, nút bấm bo 12px; nút chính đậm hơn
- Giữ nguyên bảng, chữ 14px, bố cục gọn

Verification:

- `tsc`, lint, build (thư mục `.next-check`, đã xoá) sạch; chụp ảnh Tổng quan / Người dùng / Bác sĩ (trang tạm, đã xoá)

## [TASK-026] Dữ liệu mẫu bác sĩ: thêm 5 bác sĩ + hồ sơ chuyên môn đầy đủ cho cả 6 bác sĩ

Status: COMPLETED (chờ chạy `supabase/snippets/demo_doctors.sql` trên project thật)

Date: 2026-10-08

Implemented:

- 5 tài khoản bác sĩ mới (sta002–sta006@careage.vn / Careage@2026): Tim mạch (PGS. TS.), Nội tiết – Đái tháo đường (BSCKII), Lão khoa (BSCKI), Cơ xương khớp (ThS.), Thần kinh (BS.)
- Hồ sơ chuyên môn đầy đủ cho cả 6 bác sĩ (kể cả STA001): học hàm / học vị, chuyên khoa, khoa, phòng, số CCHN, kinh nghiệm, giờ làm việc, giới thiệu; nơi làm việc Phenikaamec · 1900 1000
- Phân công thêm theo chuyên khoa (một người cao tuổi có thể có nhiều bác sĩ)
- Thêm vào `seed.sql` mục 8

Verification:

- Test trên Supabase cục bộ (transaction, rollback, chạy 2 lần): 6 bác sĩ đủ hồ sơ, không tạo trùng; số bệnh nhân mỗi bác sĩ đúng; người cao tuổi thấy bác sĩ mới trong `get_assigned_doctors`

Notes:

- Mã STAxxx do trigger cấp theo sequence của từng database → có thể không trùng số với email (vd. sta002@ có mã STA003).

## [TASK-025] Web quản trị: giao diện tiết chế, bớt "trang trí" (theo góp ý "giống AI quá")

Status: COMPLETED

Date: 2026-10-08

Implemented:

- Bỏ dải xanh gradient + vòng tròn mờ ở đầu mọi trang → đầu trang trắng, tiêu đề + mô tả ngắn
- Thẻ / bảng: viền 1px, bo góc 8–12px, không đổ bóng; chữ dữ liệu 14px, tiêu đề semibold; bỏ chữ in hoa giãn cách
- Thanh chọn mục / lọc vai trò dạng gạch chân; nhãn trạng thái chữ nhật nhỏ màu nhạt, không icon
- Avatar chữ cái trên nền xám trung tính; bỏ icon trang trí ở từng dòng thông tin (chỉ giữ ở menu, nút thao tác)
- Menu trái: mục đang chọn nền xám nhạt + icon xanh ngọc; màu xanh ngọc chỉ còn ở trạng thái chọn và nút chính
- Tổng quan: ô chỉ số không icon màu, ghép thành một dải viền chung; trục tháng "T11" (tooltip "Tháng 11/2025")
- Trang Bác sĩ: hồ sơ dạng "nhãn — giá trị"; Lịch khám: giờ dạng chữ, ghi chú / lời dặn dạng dòng chữ
- Trang đăng nhập giữ nguyên (người dùng đã chọn kiểu chia đôi)

Files:

- `web/src/components/{ui,form,Modal,NavLinks,CurrentAdmin,Logo}.tsx`, `web/src/components/dashboard/{KpiTile,ChartCard,Charts}.tsx`
- `web/src/app/(admin)/{layout,page}.tsx`, `nguoi-dung/*`, `bac-si/*`, `lich-kham/*`, `web/src/lib/roleStyle.ts`; xoá `web/src/lib/statusIcons.ts`

Verification:

- `tsc`, lint, build (thư mục `.next-check`, đã xoá) sạch
- Chụp ảnh có menu trái (trang tạm, đã xoá): Tổng quan, Người dùng, Bác sĩ & phân công

## [TASK-024] Web quản trị: gộp "Phân công bác sĩ" vào trang "Bác sĩ" (chọn bác sĩ → bệnh nhân của bác sĩ đó)

Status: COMPLETED

Date: 2026-10-08

Implemented:

- Trang Bác sĩ 2 cột: trái — danh sách bác sĩ (tìm theo tên / mã / chuyên khoa, số bệnh nhân); phải — hồ sơ bác sĩ đang chọn (Sửa) + "Bệnh nhân đang phụ trách" (Kết thúc từng người kèm lý do, "+ Phân công bệnh nhân" — người chưa có bác sĩ xếp đầu)
- Dải nhắc "N người cao tuổi chưa có bác sĩ"; chọn bác sĩ hiện ngay (dữ liệu tải một lần, giữ `?bs=` trên URL); khung chờ đúng bố cục
- `/phan-cong` chuyển hướng sang `/bac-si`; menu: bỏ "Phân công bác sĩ", đổi "Bác sĩ" → "Bác sĩ & phân công"
- `getStaff()` trả thêm danh sách bệnh nhân đang phụ trách
- `next.config.ts`: `distDir` đọc từ `NEXT_DIST_DIR` (mặc định `.next`) để build kiểm tra không ghi đè thư mục của `npm run dev`

Files:

- `web/src/app/(admin)/bac-si/{page,StaffBrowser,AssignmentActions}.tsx`, `web/src/app/(admin)/phan-cong/page.tsx` (chuyển hướng)
- `web/src/lib/{data,actions}.ts`, `web/src/components/NavLinks.tsx`, `web/src/app/(admin)/nguoi-dung/UserActions.tsx`, `web/next.config.ts`, `web/.gitignore`

Verification:

- `tsc`, lint, build (thư mục riêng `.next-check`, đã xoá) sạch
- Chụp ảnh qua Chrome DevTools (trang tạm, đã xoá): chọn lần lượt 3 bác sĩ — cột phải đổi đúng hồ sơ + bệnh nhân; bác sĩ chưa có hồ sơ / chưa có bệnh nhân hiện thông báo phù hợp

## [TASK-023] Web quản trị — trang Người dùng: menu ⋮ (Xem chi tiết, Sửa, Ngừng điều trị, Khoá / Mở khoá)

Status: COMPLETED (chờ `db push` migration `20261008020000` lên project thật)

Date: 2026-10-08

Implemented:

- Trang Người dùng: một thẻ gồm thanh tìm kiếm + sắp xếp, bộ lọc vai trò (+ "Đã khoá"), bảng thẳng cột; lọc / tìm / sắp xếp ngay trên trình duyệt (tải danh sách một lần), "Xem thêm" 30 dòng; khung chờ đúng bố cục
- Cột Thao tác → nút ⋮: Xem chi tiết (theo vai trò: bác sĩ phụ trách, người thân, lịch khám tới, yêu cầu chờ, cảnh báo 30 ngày / người cao tuổi đang theo dõi / chuyên môn + bệnh nhân), Sửa thông tin, Ngừng điều trị (người cao tuổi có bác sĩ), Khoá / Mở khoá (không có với chính mình); menu tự mở lên trên khi gần mép dưới
- Khoá tài khoản thay cho xoá: migration `20261008020000_admin_user_lock.sql` — `profiles.locked_at`, `locked_reason`; RPC `admin_set_user_locked` (chỉ ADMIN, không tự khoá) đặt `auth.users.banned_until` (mốc +100 năm; không dùng 'infinity' vì GoTrue báo lỗi schema); khoá bác sĩ → kết thúc phân công + từ chối yêu cầu đang chờ; không cắt liên kết người thân
- Đăng nhập bị khoá: web báo "Tài khoản đã bị khoá…" (app đã có sẵn thông báo cho mã `user_banned`)

Files:

- `supabase/migrations/20261008020000_admin_user_lock.sql` (mới)
- `web/src/app/(admin)/nguoi-dung/{UsersBrowser,UserActions,page}.tsx`, xoá `EditUserButton.tsx`
- `web/src/lib/{data,actions,roleStyle}.ts`, `web/src/components/useModalAction.ts`

Verification:

- Web: `tsc`, lint, `build` sạch
- Test SQL cục bộ (transaction, rollback): tự khoá → CA007; khoá không lý do → CA006; khoá sta001 → banned_until đặt, 5 phân công kết thúc, 6 yêu cầu chờ bị từ chối; mở khoá → gỡ; người thân gọi → bị chặn
- Supabase Auth cục bộ: đặt banned_until → đăng nhập bị từ chối `user_banned`; gỡ → đăng nhập lại được
- Chụp ảnh qua Chrome DevTools (trang tạm, đã xoá): menu ⋮, menu mở lên ở hàng cuối, popup Ngừng điều trị, popup Mở khoá

## [TASK-022] Web quản trị: trang chủ dạng dashboard số liệu + biểu đồ

Status: COMPLETED (chờ `db push` migration `20261008010000` lên project thật)

Date: 2026-10-08

Implemented:

- RPC `admin_dashboard_stats()` (chỉ ADMIN, ngày theo giờ Việt Nam): ô chỉ số tháng này / tháng trước (bệnh nhân mới, lượt đặt lịch, lượt khám hoàn thành, cảnh báo + số mức cao, tỉ lệ uống thuốc 7 ngày), bệnh nhân mới 12 tháng, lượt đặt lịch theo ngày (2 tháng), trạng thái lịch khám tháng này, cảnh báo theo mức độ (2 tháng), khối lượng việc bác sĩ, tỉ lệ uống thuốc 14 ngày
- Trang chủ web: 5 ô chỉ số có mũi tên + % so với kỳ trước (màu theo "tăng là tốt / xấu"), 6 biểu đồ Recharts (cột, đường so sánh, cột ngang trạng thái, cột đôi, đường %), mỗi biểu đồ có tooltip, chú thích, nút "Xem dạng bảng"; giữ mục "Cần chú ý"
- Màu biểu đồ kiểm tra bằng `validate_palette` (skill dataviz): xanh ngọc `#0b8c79` / xanh dương `#2a78d6` / cam `#eb6834` đạt mọi kiểm tra; cặp xanh ngọc–xám bị loại (người mù màu không phân biệt được)
- Tắt hiệu ứng vẽ dần; đường dùng nối thẳng (số đếm theo ngày)

Files:

- `supabase/migrations/20261008010000_admin_dashboard_stats.sql` (mới)
- `web/src/components/dashboard/{ChartCard,KpiTile,Charts}.tsx`, `web/src/lib/chartColors.ts` (mới)
- `web/src/app/(admin)/page.tsx`, `web/src/lib/data.ts`, `web/package.json` (recharts)

Verification:

- Web: `tsc`, lint, `build` sạch
- Test SQL trên Supabase cục bộ (transaction, rollback): RPC trả đủ các phần (31 ngày, 12 tháng, 14 ngày), số liệu khớp dữ liệu mẫu; bác sĩ gọi → bị chặn
- Chụp ảnh trang xem trước tạm với dữ liệu mẫu (đã xoá trang tạm): bố cục, cột, đường, nhãn hiển thị đúng

## [TASK-021] Web quản trị bệnh viện (Next.js, deploy Vercel) — đợt 1

Status: COMPLETED (chờ `db push` + tạo tài khoản ADMIN trên project thật + deploy Vercel)

Date: 2026-10-07

Implemented:

- Thư mục `web/`: Next.js 16 (App Router, Cache Components), Tailwind 4, `@supabase/ssr`, lucide-react; dùng chung project Supabase với app, chỉ publishable key
- Đăng nhập email / mật khẩu; `proxy.ts` chặn người chưa đăng nhập; `requireAdmin()` chặn role khác ADMIN (→ `/khong-co-quyen`, không lộ dữ liệu)
- Trang: Tổng quan (số người dùng theo vai trò, chưa có bác sĩ, yêu cầu chờ duyệt, lịch 7 ngày tới, cảnh báo 7 ngày), Người dùng (lọc vai trò, tìm kiếm, sửa họ tên / SĐT), Phân công bác sĩ (phân công, kết thúc kèm lý do, phân công lại, lọc người chưa có bác sĩ), Bác sĩ (hồ sơ chuyên môn, nơi làm việc, số bệnh nhân; sửa), Lịch khám (lọc trạng thái; duyệt / từ chối kèm lời dặn / lý do)
- Mọi thao tác ghi là Server Action, tự kiểm tra ADMIN; RLS chặn thêm ở Backend
- Migration `20261007090000_admin_web.sql`: policy ADMIN sửa `profiles` (vẫn giới hạn bởi quyền cột), RPC `admin_overview()`
- Seed / snippet tài khoản ADMIN mẫu `adm001@careage.vn`
- Sửa lỗi TASK-020: `profiles` chỉ cấp quyền sửa cột name, phone → thêm `grant update (workplace, workplace_phone)` trong migration `20261007080000` (bác sĩ tự lưu được nơi làm việc)
- Sửa `supabase/seed.sql` bị lặp toàn bộ nội dung (lỗi ghép chuỗi khi thêm dữ liệu demo)
- App: `tsconfig.json` và `metro.config.js` bỏ qua thư mục `web/`

Roles:

- ADMIN (mới có giao diện); các role khác không đổi

Files:

- `web/**` (mới), `supabase/migrations/20261007090000_admin_web.sql`, `supabase/snippets/create_admin.sql` (mới)
- `supabase/migrations/20261007080000_staff_profiles.sql`, `supabase/seed.sql`, `tsconfig.json`, `metro.config.js` (mới)

Verification:

- Web: `npm run lint`, `tsc`, `npm run build` sạch; app: `tsc` passed
- Test SQL trên Supabase cục bộ (transaction, rollback): tạo ADM001 (chạy lại không trùng, không còn health_profiles); `admin_overview` đúng số liệu; ADMIN sửa hồ sơ người khác, phân công / kết thúc / kích hoạt lại; ADMIN không đổi được role; bác sĩ gọi `admin_overview` bị chặn, không sửa được hồ sơ người khác; bác sĩ sửa được nơi làm việc của mình
- Chạy web với Supabase cục bộ: chưa đăng nhập → /login; đăng nhập sta001 → /khong-co-quyen trên mọi trang, HTML không chứa dữ liệu bệnh nhân
- Chưa thử luồng ADMIN đầy đủ trên trình duyệt (DB cục bộ chưa áp các migration mới)

Notes:

- Ngoài scope đợt 1: tạo tài khoản từ web (cần Edge Function giữ secret key), cổng bác sĩ trên web, báo cáo / xuất Excel.

## [TASK-020] Hồ sơ bác sĩ: thông tin chuyên môn, nơi làm việc, giới thiệu

Status: COMPLETED (chờ `db push` lên project thật + test trên thiết bị)

Date: 2026-10-07

Implemented:

- Bảng `staff_profiles` (học hàm, học vị, chuyên khoa, khoa, phòng khám, số CCHN, số năm kinh nghiệm, giờ làm việc, giới thiệu) + RLS: xem — chính bác sĩ, ADMIN, bệnh nhân đang được phụ trách và người thân của họ; sửa — chính bác sĩ (role MEDICAL_STAFF) hoặc ADMIN
- `get_assigned_doctors` trả thêm học vị, chuyên khoa, phòng → form đặt lịch hiện "ThS. Phạm Thị Hoa · Nội tổng quát · Phòng 203"
- Tab Hồ sơ của MEDICAL_STAFF dùng màn mới `StaffProfileScreen`: tên kèm học hàm / học vị, chuyên khoa, email, SĐT; số bệnh nhân đang phụ trách / cựu bệnh nhân; thẻ Thông tin chuyên môn, Nơi làm việc (bấm hotline để gọi), Giới thiệu; gợi ý hoàn thiện hồ sơ khi còn trống
- Popup `EditStaffProfileModal`: chọn học vị / học hàm, chuyên khoa (gợi ý), kinh nghiệm, CCHN, cơ sở y tế, khoa, phòng, hotline, giờ làm việc, giới thiệu — bác sĩ tự sửa nơi làm việc
- Seed / snippet hồ sơ mẫu cho STA001

Files:

- `supabase/migrations/20261007080000_staff_profiles.sql`, `supabase/snippets/demo_staff_profile.sql` (mới), `supabase/seed.sql`
- `src/screens/medical-staff/StaffProfileScreen.tsx`, `src/components/staff/EditStaffProfileModal.tsx`, `src/hooks/useStaffProfile.ts`, `src/utils/staff.ts` (mới)
- `src/types/{staff,appointment}.ts`, `src/constants/{staff,queryKeys,roles}.ts`, `src/services/{staff,appointment}.service.ts`, `src/components/appointment/RequestAppointmentModal.tsx`

Verification:

- `npx tsc --noEmit` passed
- Test SQL trên Supabase cục bộ (transaction, rollback): sta001 đọc + sửa hồ sơ của mình; eld001 / cg001 đọc được, không sửa / tạo được; người thân của cựu bệnh nhân không thấy; học vị sai / kinh nghiệm > 70 bị chặn; `get_assigned_doctors` trả đúng học vị, chuyên khoa, phòng

## [TASK-019] Lời dặn của bác sĩ khi xác nhận lịch khám

Status: COMPLETED (chờ `db push` lên project thật + test trên thiết bị)

Date: 2026-10-07

Implemented:

- Bác sĩ bấm "Xác nhận" (trên thẻ hoặc trong chi tiết) → popup "Xác nhận lịch khám": tóm tắt lịch, ô "Lời dặn cho bệnh nhân và người nhà" (không bắt buộc, ≤ 500 ký tự) + gợi ý chọn nhanh
- `appointments.staff_note`; `review_appointment_request` thêm `p_note` (chỉ lưu khi xác nhận); thông báo cho người thân kèm "Lời dặn của bác sĩ: …"
- Người cao tuổi / người thân: khung "Lời dặn của bác sĩ" trong chi tiết lịch; dòng "Bác sĩ dặn: …" trên thẻ "Lần khám tới"
- Thẻ yêu cầu chờ duyệt (bác sĩ): bỏ mã bệnh nhân và "… ngày nữa", bấm thẻ để xem chi tiết; chi tiết lịch ở chế độ bác sĩ có nút Từ chối / Xác nhận, ẩn lời nhắc dành cho bệnh nhân

Files:

- `supabase/migrations/20261007070000_appointment_staff_note.sql`, `src/components/staff/ApproveRequestModal.tsx` (mới)
- `src/types/appointment.ts`, `src/services/{appointment,staff}.service.ts`, `src/hooks/useStaffAppointments.ts`, `src/constants/appointmentRequest.ts`
- `src/components/appointment/{AppointmentDetailModal,AppointmentSection}.tsx`, `src/components/staff/RequestCard.tsx`
- `src/screens/medical-staff/{StaffAppointmentsScreen,PatientDetailScreen}.tsx`

Verification:

- `npx tsc --noEmit` passed
- Test SQL trên Supabase cục bộ (transaction, rollback): xác nhận có lời dặn → lưu `staff_note` (đã trim), thông báo người thân "… tại Phenikaamec. Lời dặn của bác sĩ: Nhịn ăn sáng trước khi khám"; xác nhận không lời dặn → thông báo như cũ; từ chối kèm note → không lưu note, thông báo có lý do; note > 500 ký tự → bị chặn

## [TASK-018] Trang chủ bác sĩ: "Lịch khám gần nhất" + hộp Thông báo (yêu cầu chờ duyệt, cảnh báo mới)

Status: COMPLETED (chưa test trên thiết bị)

Date: 2026-10-07

Implemented:

- Thẻ "Lịch khám hôm nay" → "Lịch khám gần nhất": 4 lịch đã xác nhận sắp tới (giờ, Hôm nay / Ngày mai / thứ-ngày, bệnh nhân, nội dung)
- Bỏ thẻ "Yêu cầu chờ duyệt" và "Cảnh báo mới" khỏi Trang chủ; thêm chuông Thông báo ở phần đầu (số = cảnh báo chưa đọc + yêu cầu chờ duyệt)
- Màn `StaffNotifications`: mục "Yêu cầu chờ duyệt" lên đầu (bấm → tab Lịch khám), cảnh báo 30 ngày của mọi bệnh nhân theo ngày (bấm → đánh dấu đã đọc + mở Cảnh báo của bệnh nhân đó), nút đánh dấu đã đọc tất cả
- `staff.service.getRecentAlerts` (RLS lọc theo phân công, trạng thái đọc riêng qua `alert_reads`); export `ALERT_COLUMNS` / `toAlert`

Files:

- `src/screens/medical-staff/StaffNotificationsScreen.tsx`, `src/hooks/useStaffNotifications.ts`, `src/components/staff/UpcomingScheduleCard.tsx` (mới)
- Xoá `src/components/staff/{TodayScheduleCard,PendingRequestsCard,AlertPatientsCard}.tsx`
- `src/screens/medical-staff/StaffHomeScreen.tsx`, `src/services/{staff,alert}.service.ts`, `src/types/staff.ts`, `src/constants/{queryKeys,alert}.ts`, `src/hooks/useAlerts.ts`, `src/navigation/RootNavigator.tsx`

Verification:

- `npx tsc --noEmit` passed; khóa ngoại `alerts_user_id_fkey` tồn tại

## [TASK-017] Bác sĩ kết thúc theo dõi bệnh nhân → Cựu bệnh nhân

Status: COMPLETED (chờ `db push` lên project thật + test trên thiết bị)

Date: 2026-10-07

Implemented:

- Nút "Kết thúc theo dõi bệnh nhân" cuối màn Hồ sơ bệnh nhân: chọn lý do (Đã điều trị xong / Chuyển sang bác sĩ khác / Chuyển cơ sở y tế khác / Bệnh nhân yêu cầu dừng / Khác tự nhập), cảnh báo hậu quả, xác nhận
- `staff_assignments.ended_at`, `end_reason`; RPC `end_staff_assignment` (chỉ bác sĩ đang phụ trách; → INACTIVE; từ chối yêu cầu đặt lịch đang chờ gửi tới bác sĩ đó — người thân được thông báo qua trigger sẵn có), RPC `get_former_patients`
- Màn "Cựu bệnh nhân" (tên, mã, ngày kết thúc, lý do — chỉ xem), lối vào cuối tab Bệnh nhân
- Popup chọn lý do dùng chung `ReasonPickerModal` (thay `RejectRequestModal`, dùng cho cả từ chối yêu cầu)
- Bác sĩ không tự phân công lại được — vẫn chỉ ADMIN

Roles:

- MEDICAL_STAFF; CAREGIVER nhận thông báo khi yêu cầu bị từ chối do kết thúc theo dõi

Files:

- `supabase/migrations/20261007060000_end_staff_assignment.sql` (mới)
- `src/screens/medical-staff/FormerPatientsScreen.tsx`, `src/hooks/useFormerPatients.ts`, `src/constants/staff.ts` (mới)
- `src/components/staff/ReasonPickerModal.tsx` (đổi từ `RejectRequestModal.tsx`)
- `src/services/staff.service.ts`, `src/types/staff.ts`, `src/constants/queryKeys.ts`, `src/navigation/RootNavigator.tsx`
- `src/screens/medical-staff/{PatientDetailScreen,PatientsScreen,StaffAppointmentsScreen}.tsx`

Verification:

- `npx tsc --noEmit` passed
- Test SQL trên Supabase cục bộ (transaction, rollback): người thân gọi RPC → bị từ chối; thiếu lý do → CA006; sta001 kết thúc ELD002 → dashboard còn 4, không đọc được chỉ số / hồ sơ ELD002, yêu cầu chờ → REJECTED kèm lý do, người thân nhận thông báo; kết thúc lần 2 → P0002; `get_former_patients` trả đúng lý do; bác sĩ tự UPDATE staff_assignments → 0 dòng (RLS)

## [TASK-016] Bác sĩ: gộp "Bệnh nhân" và "Sức khỏe" thành màn Hồ sơ bệnh nhân + làm lại Trang chủ bác sĩ

Status: COMPLETED (chưa test trên thiết bị)

Date: 2026-10-07

Implemented:

- Tab MEDICAL_STAFF còn 4: Trang chủ · Bệnh nhân · Lịch khám · Hồ sơ (bỏ tab Sức khỏe)
- Màn `PatientDetail` (stack): thẻ bệnh nhân (mã, tuổi, giới tính, gọi) + 3 mục Sức khỏe | Hồ sơ | Lịch khám; mở được thẳng một mục qua param `tab`
- Cảnh báo → "Xem chỉ số" / "Liên hệ" với bác sĩ mở đúng mục trong Hồ sơ bệnh nhân
- Trang chủ bác sĩ: ô số liệu nổi trên phần đầu, thẻ Yêu cầu chờ duyệt / Lịch khám hôm nay / Cảnh báo mới / Bệnh nhân của bạn
- Tách component dùng chung: `VitalsOverview` (tab Sức khỏe), `ElderlyHealthRecord` (màn hồ sơ của người thân); export `AppointmentRow`
- Phía người cao tuổi / người thân giữ nguyên giao diện

Files:

- `src/screens/medical-staff/PatientDetailScreen.tsx`, `src/components/health/VitalsOverview.tsx`, `src/components/caregiver/ElderlyHealthRecord.tsx`, `src/components/staff/{TodayScheduleCard,PendingRequestsCard,AlertPatientsCard}.tsx` (mới)
- `src/screens/medical-staff/{StaffHomeScreen,PatientsScreen}.tsx`, `src/screens/{VitalsScreen,AlertsScreen}.tsx`, `src/screens/caregiver/ElderlyDetailScreen.tsx`
- `src/navigation/RootNavigator.tsx`, `src/constants/roles.ts`, `src/constants/alert.ts`, `src/components/appointment/AppointmentSection.tsx`

Verification:

- `npx tsc --noEmit` passed

Notes:

- Có sẵn từ trước (ngoài scope): người thân bấm "Liên hệ người thân / bác sĩ" trong chi tiết cảnh báo sẽ điều hướng tới tab "Emergency" mà role này không có.

## [TASK-015] Phần cho bác sĩ: bệnh nhân được phân công + duyệt yêu cầu đặt lịch

Status: COMPLETED (chờ `db push` lên project thật + test trên thiết bị)

Date: 2026-10-07

Implemented:

- Tab của MEDICAL_STAFF: Trang chủ · Bệnh nhân · Lịch khám · Sức khỏe · Hồ sơ
- `SubjectContext` hỗ trợ bác sĩ: danh sách bệnh nhân được phân công (`staff_assignments`), chọn bệnh nhân đang xem → dùng lại màn Sức khỏe, Lịch sử chỉ số, Cảnh báo, Hồ sơ người cao tuổi, Lịch sử khám, chip đổi người. Kiểu chung `FollowedElderly` (người thân có quan hệ, bác sĩ hiện mã bệnh nhân)
- Trang chủ bác sĩ: số yêu cầu chờ duyệt / lịch khám hôm nay / bệnh nhân có cảnh báo mới, danh sách "Cần chú ý"
- Tab Bệnh nhân: tìm theo tên (không dấu) hoặc mã, thẻ bệnh nhân (tuổi, yêu cầu chờ duyệt, cảnh báo, lịch tới, gọi điện); hồ sơ bệnh nhân có lối tắt Chỉ số / Cảnh báo / Lịch sử khám
- Tab Lịch khám bác sĩ: duyệt yêu cầu (Xác nhận có hỏi lại; Từ chối chọn lý do có sẵn hoặc tự nhập), lịch đã xác nhận sắp tới nhóm theo ngày
- RPC `staff_dashboard(p_date)` (chỉ MEDICAL_STAFF); `review_appointment_request` chặn bác sĩ khác duyệt yêu cầu đã gửi tới một bác sĩ cụ thể
- Bác sĩ đánh dấu đã đọc cảnh báo (trạng thái đọc riêng, như người thân)

Roles:

- MEDICAL_STAFF (chính)
- CAREGIVER: kiểu danh sách / chip đổi người dùng chung, hành vi giữ nguyên
- ELDERLY: không ảnh hưởng

Files:

- `supabase/migrations/20261007050000_staff_portal.sql` (mới)
- `src/types/staff.ts`, `src/services/staff.service.ts`, `src/hooks/useStaffDashboard.ts`, `src/hooks/useStaffAppointments.ts` (mới)
- `src/components/staff/PatientRow.tsx`, `src/components/staff/RejectRequestModal.tsx` (mới)
- `src/screens/medical-staff/StaffHomeScreen.tsx`, `StaffAppointmentsScreen.tsx` (mới), `PatientsScreen.tsx` (viết lại)
- `src/context/SubjectContext.tsx`, `src/types/caregiver.ts`, `src/constants/caregiver.ts`, `src/constants/roles.ts`, `src/constants/queryKeys.ts`, `src/constants/appointmentRequest.ts`
- `src/services/appointment.service.ts` (export mapper), `src/hooks/useAlerts.ts`
- `src/components/caregiver/{ElderlySwitcher,LinkedElderlySection,NoLinkedElderlyState}.tsx`
- `src/screens/{Vitals,Medication,Appointments,Alerts,Profile}Screen.tsx`, `src/screens/caregiver/ElderlyDetailScreen.tsx`

Verification:

- `npx tsc --noEmit` passed
- Test SQL trên Supabase cục bộ (trong transaction, rollback): sta001 thấy đủ 5 bệnh nhân và đúng số yêu cầu chờ; bác sĩ khác duyệt yêu cầu gửi cho sta001 → bị chặn; sta001 từ chối kèm lý do → REJECTED; cg001 gọi `staff_dashboard` → bị từ chối; tên khóa ngoại dùng để join tồn tại
- Chưa `db push` lên project thật, chưa test trên thiết bị

Notes:

- Ngoài scope: ghi kết quả buổi khám, kê thuốc, bác sĩ tự sửa nơi làm việc, push thông báo cho bác sĩ khi có yêu cầu mới.

## [TASK-014] Đặt lịch khám theo bác sĩ phụ trách

Status: COMPLETED (chờ `db push` lên project thật + test trên thiết bị)

Date: 2026-10-07

Implemented:

- `profiles.workplace`, `profiles.workplace_phone` (nơi làm việc của nhân viên y tế); `appointments.staff_id`
- RPC `get_assigned_doctors(p_elderly_id)`: bác sĩ đang phụ trách (staff_assignments ACTIVE) — chính người cao tuổi, người thân đang liên kết hoặc ADMIN
- `request_appointment` nhận `p_staff_id` thay cho `p_facility`/`p_doctor`; Backend kiểm tra phân công (CA004), nơi làm việc (CA005) và tự điền `facility`, `facility_phone`, `doctor`, `staff_id`. Bỏ chữ ký cũ 7 tham số
- Form đặt lịch: chọn "Bác sĩ phụ trách" (thẻ lớn, tự chọn khi chỉ có 1 bác sĩ); "Cơ sở y tế" chỉ hiển thị theo bác sĩ; bỏ ô nhập cơ sở y tế và bác sĩ tự do; chưa có bác sĩ → thông báo + khóa nút gửi
- Seed: nơi làm việc của STA001 = Phenikaamec / 1900 1000

Roles:

- ELDERLY, CAREGIVER (đặt lịch, xem bác sĩ phụ trách)
- MEDICAL_STAFF (có thêm cột nơi làm việc), ADMIN (gọi được RPC)

Files:

- `supabase/migrations/20261007030000_appointment_linked_doctor.sql` (mới), `supabase/seed.sql`
- `src/services/appointment.service.ts`, `src/hooks/useAssignedDoctors.ts` (mới), `src/constants/queryKeys.ts`
- `src/types/appointment.ts`, `src/constants/appointmentRequest.ts`, `src/utils/appointment.ts` (bỏ `recentFacilities`)
- `src/components/appointment/RequestAppointmentModal.tsx`, `src/screens/AppointmentsScreen.tsx`

Verification:

- `npx tsc --noEmit` passed; `supabase db lint --local` không lỗi
- Test SQL trên Supabase cục bộ: eld001 và cg001 lấy được bác sĩ phụ trách; cg002 (không liên kết) bị từ chối; anon bị từ chối; đặt lịch tự điền đúng cơ sở y tế / SĐT / bác sĩ; bác sĩ không phụ trách → CA004; bác sĩ chưa có nơi làm việc → CA005
- Chưa `db push` lên project thật, chưa test trên thiết bị

Notes:

- Chưa có màn cho nhân viên y tế tự cập nhật nơi làm việc (hiện điền qua seed / ADMIN) — ngoài scope.

## [TASK-013] Tab "Lịch khám" + đặt lịch tái khám (yêu cầu → nhân viên y tế xác nhận)

Status: COMPLETED (chờ `db push` + test trên thiết bị)

Date: 2026-10-07

Implemented:

- Trạng thái lịch mới `REQUESTED` (Chờ xác nhận), `REJECTED` (Không được nhận); cột `requested_by`, `note`, `reject_reason`
- RPC `request_appointment` (người cao tuổi cho chính mình / người thân đang liên kết; giờ khám phải ở tương lai; tối đa 3 yêu cầu chờ), `cancel_appointment_request`, `review_appointment_request` (nhân viên y tế được phân công / ADMIN — dùng chung cho Admin web)
- Xác nhận / từ chối → thông báo `APPOINTMENT_REVIEWED` cho người thân (push tự chạy)
- Tab "Lịch khám" cho ELDERLY (6 tab) và CAREGIVER (5 tab): nút "Đặt lịch tái khám", nhóm "Đang chờ xác nhận", lịch sắp tới, lịch sử; chi tiết có ghi chú, lý do từ chối, nút "Hủy yêu cầu"
- Form đặt lịch: chọn ngày (30 ngày tới) và khung giờ bằng nút bấm, gợi ý cơ sở y tế đã khám và nội dung khám
- Bỏ lịch tái khám khỏi tab Chăm sóc; bấm nhắc lịch / thông báo lịch khám mở tab Lịch khám

Roles:

- ELDERLY, CAREGIVER: gửi / hủy yêu cầu
- MEDICAL_STAFF, ADMIN: xác nhận / từ chối qua RPC (chưa có màn trên mobile — làm qua Supabase Dashboard, sau này Admin web)

Files:

- `supabase/migrations/20261007020000_appointment_requests.sql` (mới)
- `supabase/functions/send-push/index.ts` (loại thông báo mới — cần deploy lại để data.type đúng; bấm thông báo vẫn chạy nếu chưa deploy)
- `src/screens/AppointmentsScreen.tsx`, `src/components/appointment/RequestAppointmentModal.tsx`, `src/constants/appointmentRequest.ts` (mới)
- `src/types/appointment.ts`, `src/constants/appointmentStatus.ts`, `src/services/appointment.service.ts`, `src/hooks/useAppointments.ts`, `src/utils/appointment.ts`
- `src/components/appointment/AppointmentSection.tsx`, `AppointmentDetailModal.tsx`
- `src/screens/MedicationScreen.tsx`, `src/constants/roles.ts`, `src/hooks/useReminderSync.ts`, `src/navigation/inboxNavigation.ts`
- `src/types/inbox.ts`, `src/constants/inbox.ts`, `src/hooks/useCaregiverAlertWatch.ts`

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` thành công; `supabase db lint` không lỗi
- RPC trên DB cục bộ 16/16: tự đặt, người thân đặt, chặn người không liên kết / quá khứ / thiếu cơ sở / quá 3 yêu cầu / insert trực tiếp / người thân tự duyệt / người khác hủy / anon; nhân viên y tế xác nhận + từ chối tạo thông báo đúng; lịch REQUESTED không có thông báo "lịch khám ngày mai"
- Qua supabase-js: mã lỗi CA001 / 42501 trả về đúng, đọc + hủy yêu cầu OK; unit test tách lịch / ngày / gợi ý cơ sở 5/5
- Chưa test trên thiết bị

Notes:

- Người cao tuổi có 6 tab (giữ Khẩn cấp). Có thể gộp Khẩn cấp vào Trang chủ sau nếu cần.

## [TASK-012] Push notification cho người thân (Phần 8)

Status: COMPLETED (chờ cấu hình EAS/FCM và test trên development build)

Date: 2026-10-07

Implemented:

- Bảng `push_tokens` + RPC `register_push_token` / `unregister_push_token` (token chuyển sang người đăng nhập mới trên cùng máy)
- Trigger `push_after_notification`: mỗi dòng mới trong `notifications` → `pg_net` gọi Edge Function `send-push` (URL + secret trong Vault; chưa cấu hình thì bỏ qua, không chặn việc lưu thông báo)
- Edge Function `send-push`: kiểm tra header `x-push-secret`, gửi qua Expo Push API (kênh `caregiver-alerts`, data giống local notification để bấm mở đúng màn), xóa token `DeviceNotRegistered`
- App: CAREGIVER đăng nhập → xin quyền, lấy Expo push token, đăng ký; đăng ký lại khi token đổi; gỡ token trước khi đăng xuất
- Máy đã có push thì realtime chỉ cập nhật hộp thông báo, không hiện local notification (tránh trùng); máy không có push (Expo Go Android, máy ảo) vẫn hiện local notification khi app đang mở như trước
- Kênh Android riêng `caregiver-alerts`; `initNotifications` dùng chung một lần khởi tạo

Roles:

- CAREGIVER (ELDERLY giữ nguyên nhắc thuốc local)

Files:

- `supabase/migrations/20261007010000_push_notifications.sql`, `supabase/functions/send-push/index.ts` (mới)
- `supabase/config.toml` (`verify_jwt = false` cho `send-push`)
- `src/services/pushToken.service.ts`, `src/hooks/usePushRegistration.ts` (mới)
- `src/services/notification.service.ts`, `src/constants/notification.ts`, `src/hooks/useCaregiverAlertWatch.ts`, `src/context/AuthContext.tsx`, `src/navigation/RootNavigator.tsx`
- `tsconfig.json` (bỏ qua `supabase/functions` — mã Deno)
- Dependencies: `expo-device`, `expo-constants`

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công; `supabase db lint` không lỗi
- RLS/RPC trên DB cục bộ 6/6: tự đăng ký, không thấy token người khác, không gỡ được token người khác, không insert trực tiếp, token chuyển chủ, anon bị chặn
- Luồng đầu-cuối cục bộ: thêm cảnh báo cho eld001 → thông báo cho cg001 → trigger gọi `send-push` (200) → Expo Push API trả `DeviceNotRegistered` cho token giả → token bị xóa
- Chưa test trên thiết bị thật (cần development build + FCM)

Notes:

- Expo Go trên Android không nhận push (từ SDK 53) → cần development build. iOS Expo Go vẫn nhận được push.
- Phiên hết hạn (không qua nút Đăng xuất) thì token còn trên server tới khi người khác đăng nhập trên máy đó.
- Bật quyền thông báo sau trong Cài đặt: token được đăng ký ở lần mở app kế tiếp.

## [TASK-011] Hộp thông báo cho người thân (Phần 7F)

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-10-06

Implemented:

- Bảng `notifications` (Backend tạo, app chỉ đọc / đánh dấu đã đọc), chống trùng theo `dedupe_key`
- Thông báo tự động, xưng hô theo quan hệ + giới tính (con → Bố/Mẹ, cháu → Ông/Bà, vợ chồng → Vợ/Chồng, khác → tên):
  - Quên uống thuốc, nhắc 2 lần (cập nhật 2026-10-06, migration `20261006050000_missed_dose_two_stage.sql`): quá giờ 5 phút → "Mẹ chưa uống thuốc 08:00"; quá 30 phút vẫn chưa uống → "Nhắc lại: Mẹ vẫn chưa uống thuốc 08:00". Lần 1 chỉ gửi trong khoảng 5–30 phút (không báo dồn). Gộp các thuốc cùng giờ; cron mỗi phút; tự sinh liều hôm nay nếu người cao tuổi chưa mở app
  - Lịch khám ngày mai — cron 18:00 giờ VN
  - Cảnh báo sức khỏe — trigger khi có cảnh báo mới
- Realtime trên `notifications` thay cho `alerts` (tránh báo trùng): thêm vào hộp, hiện thông báo trên máy, bấm mở đúng màn (thuốc/lịch khám → Chăm sóc, cảnh báo → Cảnh báo) và chọn đúng người
- Màn "Thông báo" (nhóm Hôm nay / Hôm qua / Trước đó, chưa đọc nổi bật, đánh dấu đã đọc tất cả, kéo để làm mới); nút chuông có số chưa đọc trên Trang chủ người thân
- Thẻ người cao tuổi: danh sách liều chỉ còn icon trạng thái (chữ trạng thái giữ cho trình đọc màn hình)

Files:

- Migration `20261006040000_caregiver_notifications.sql` (đã `db push`; cron `notify-missed-doses`, `notify-appointments-tomorrow`)
- Mới: `types/inbox.ts`, `constants/inbox.ts`, `services/inbox.service.ts`, `hooks/useInbox.ts`, `navigation/inboxNavigation.ts`, `screens/caregiver/NotificationsScreen.tsx`
- Sửa: `services/realtime.service.ts` (nghe `notifications`), `hooks/useCaregiverAlertWatch.ts`, `utils/reminders.ts`, `screens/caregiver/CaregiverHomeScreen.tsx`, `components/caregiver/ElderlySummaryCard.tsx`, `navigation/RootNavigator.tsx`, `constants/queryKeys.ts`

Verification:

- Cục bộ: 3 loại thông báo tạo đúng nội dung và xưng hô cho cg001–cg005; chạy lại không trùng
- RLS: chỉ thấy thông báo của mình, chỉ đánh dấu đã đọc, không thêm/sửa được; người cao tuổi không thấy
- Realtime cục bộ: cg002 nhận "Bố: SpO2 nằm ngoài khoảng theo dõi", cg001 không nhận
- Project thật: migration + 3 cron đã chạy; lần chạy đầu tạo 8 thông báo quên uống thuốc cho tài khoản test
- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Chưa test trên thiết bị

## [TASK-010] Trang cho người thân — CAREGIVER (Phần 7A–7E)

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-10-06

Quyết định (đã xác nhận): liên kết bằng mã mời 6 số; người thân chỉ xem (không đánh dấu uống hộ); push khi app tắt → Phần 8.

Implemented:

- 7A: `SubjectContext` / `useSubject` — "người đang được xem" (ELDERLY = chính mình, CAREGIVER = người cao tuổi đang chọn, nhớ lựa chọn); 8 hook dữ liệu dùng `subjectId`; `ElderlySwitcher` (chip "Đang xem: …") trên Sức khỏe, Chăm sóc, Cảnh báo, Lịch sử chỉ số; `NoLinkedElderlyState` khi chưa theo dõi ai; ẩn nút kết nối thiết bị với người thân
- 7B: mã mời 6 số (15 phút, dùng 1 lần, khóa sau 5 lần sai/10 phút); Hồ sơ người cao tuổi có "Người thân theo dõi" (gọi, gỡ) + "Mời người thân" (mã lớn, đếm ngược, gửi qua tin nhắn); người thân nhập mã + chọn quan hệ; tab "Người thân" (danh sách, gọi, ngừng theo dõi, xem hồ sơ chỉ đọc — dị ứng lên đầu)
- 7C: Trang chủ người thân — mỗi người cao tuổi 1 thẻ: cảnh báo mới, thuốc hôm nay x/y + liều quá giờ in đỏ, huyết áp/nhịp tim kèm thời điểm, lịch khám tới, nút Gọi / Xem chi tiết; dữ liệu từ RPC `caregiver_dashboard`
- 7D: trạng thái đã đọc cảnh báo riêng cho người thân (`alert_reads`), không đổi `read_at` của người cao tuổi
- 7E: Supabase Realtime trên `alerts` → người thân nhận thông báo trên máy khi cảnh báo HIGH/CRITICAL (app đang mở/chạy nền); bấm thông báo chọn đúng người và mở màn Cảnh báo

Files:

- Migration: `20261006010000_caregiver_link_invites.sql`, `20261006020000_caregiver_dashboard.sql` (đã `db push`)
- Mới: `context/SubjectContext.tsx`, `hooks/{useSubject,useLinkedCaregivers,useCaregiverDashboard,useCaregiverAlertWatch}.ts`, `services/{caregiver,realtime}.service.ts`, `types/caregiver.ts`, `constants/caregiver.ts`, `utils/healthProfile.ts`
- Mới: `components/caregiver/{ElderlySwitcher,NoLinkedElderlyState,InviteCodeModal,AcceptInviteModal,ElderlySummaryCard}.tsx`, `components/profile/CaregiverLinksCard.tsx`, `screens/caregiver/{CaregiverHomeScreen,ElderlyDetailScreen}.tsx`
- Sửa: 8 hook dữ liệu, `useAlerts` (đọc riêng theo người xem), `alert.service`, `notification.service` (`presentNow`), `screens/caregiver/ElderlyListScreen.tsx` (viết lại), `Vitals/Medication/Alerts/MetricHistory/Profile` screens, `RootNavigator` (route `ElderlyDetail`), `constants/roles.ts`, `App.tsx`

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Truy vấn liên kết 2 chiều (cg001 ↔ eld001): đúng
- Mã mời qua API cục bộ: 14/14 (tạo mã, sai role, sai mã, đúng mã, dùng lại, khóa 5 lần sai, gỡ liên kết, mất quyền xem sau khi gỡ)
- Dashboard + alert_reads cục bộ: 10/10 (sinh liều hôm nay, chỉ số, lịch khám, đọc riêng không ảnh hưởng người cao tuổi, chặn người không liên quan)
- Realtime cục bộ: cg004 nhận cảnh báo CRITICAL của eld004, cg001 (không liên kết) không nhận
- Trên project thật: dashboard cg004 trả đúng dữ liệu; RPC mã mời hoạt động; `alerts` đã trong publication realtime
- Chưa test trên thiết bị

Notes:

- Người thân chỉ nhận thông báo khi app đang mở/chạy nền; app tắt hẳn cần push (Phần 8).
- Bổ sung (2026-10-06): thẻ trên Trang chủ người thân bỏ quan hệ dưới tên, hiện tuổi; liệt kê từng liều thuốc hôm nay kèm trạng thái; thêm ô SpO2; lịch khám tới kèm cơ sở y tế + bác sĩ. Migration `20261006030000_caregiver_dashboard_more_info.sql` (đã `db push`).
- MEDICAL_STAFF hiện chưa có "người đang xem" (các màn dùng chung hiện trống) — làm ở phần dành cho nhân viên y tế.

## [TASK-009] Vuốt thẻ thuốc ở tab Chăm sóc

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- `SwipeableDoseCard`: vuốt phải = Đã uống (nền xanh ✓), vuốt trái = Bỏ qua (nền xám ✕); quá 110px mới ghi nhận, chưa đủ thì bật về; chỉ vuốt được liều chưa uống và chỉ với ELDERLY
- Giữ nút bấm ✓ / ✕ song song với vuốt (nút to 44px); liều đã xử lý hiện nhãn trạng thái bằng chữ + icon
- Bấm vào thẻ thuốc (thay cho giữ lâu) mở thông tin thuốc
- Nút ⓘ cạnh tiêu đề "Chăm sóc sức khỏe" giới thiệu toàn trang Chăm sóc (liều thuốc, bấm/vuốt, hoàn tác, lịch tái khám, danh sách thuốc, kéo làm mới); hành động cho trình đọc màn hình (accessibilityActions)
- Dải "Hoàn tác" 5 giây sau khi vuốt (`useUndoToast` dùng chung với Trang chủ; `UndoToast` chuyển sang `components/common`)

Files:

- `src/components/medication/SwipeableDoseCard.tsx`, `src/hooks/useUndoToast.ts` (mới)
- `src/components/common/UndoToast.tsx` (chuyển từ `components/home`)
- `src/screens/MedicationScreen.tsx` (bỏ `DoseCard` cũ), `src/screens/HomeScreen.tsx` (dùng `useUndoToast`)

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Chưa test cử chỉ vuốt trên thiết bị

Notes:

- Chế độ "Theo tuần" (`WeeklySchedule`) vẫn dùng nút bấm.

## [TASK-008] Thẻ "Lịch khám tới" trên Trang chủ

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- Ô lịch (thứ / ngày lớn / tháng) + giờ khám lớn, cơ sở y tế, bác sĩ, nội dung khám (mỗi dòng có icon)
- Nhãn đếm ngược ở góc tiêu đề; "Hôm nay"/"Ngày mai" nổi bật (nền xanh đậm)
- Bấm thẻ mở thẳng chi tiết lịch khám (gọi cơ sở y tế, chỉ đường) thay vì chuyển tab

Files:

- `src/components/home/NextAppointmentCard.tsx`, `src/screens/HomeScreen.tsx`

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Chưa xem giao diện trên thiết bị

## [TASK-007] Kéo để làm mới dùng chung (không dùng RefreshControl)

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- `usePullToRefresh`: tự nhận cử chỉ kéo xuống ở đầu trang (PanResponder), nội dung trượt theo tay, kéo quá 90px rồi thả thì làm mới; không còn vòng xoay đầu trang
- `LoadingOverlay`: vòng xoay giữa màn hình kèm chữ "CareAge", hiện tối thiểu 0,8 giây, không chặn thao tác (SOS vẫn bấm được)
- Áp dụng cho: Trang chủ, Cảnh báo, Chăm sóc, Sức khỏe, Khẩn cấp, Hồ sơ, Lịch sử chỉ số

Files:

- `src/hooks/usePullToRefresh.ts`, `src/components/common/LoadingOverlay.tsx`
- `src/screens/{HomeScreen,AlertsScreen,MedicationScreen,VitalsScreen,EmergencyScreen,ProfileScreen,MetricHistoryScreen}.tsx`

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Chưa test cử chỉ trên thiết bị

Notes:

- Hiệu ứng cuộn đàn hồi (bounce) tắt trên các màn này để không tranh cử chỉ với kéo-làm-mới.
- Sửa lỗi 2 vòng loading (màn Khẩn cấp): `useEmergencyContacts`, `useMedicalConditions` chuyển sang React Query — `isLoading` chỉ true ở lần tải đầu, kéo-làm-mới không còn bật vòng xoay toàn màn hình.

## [TASK-006] Trang chủ v2 (Phần 6A–6E)

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- 6A: React Query làm cache server state dùng chung — `useMedications`, `useHealthMetrics`, `useAppointments`, `useAlerts`, `useHealthProfile` viết lại bằng `useQuery`, giữ nguyên dữ liệu trả về; mutation cập nhật cache trực tiếp; tự tải lại khi app quay lại foreground (staleTime 30s); xóa cache khi đăng xuất; bỏ cơ chế tải lại khi quay về tab ở Trang chủ
- 6B: thẻ "Thuốc hôm nay" gộp các liều cùng giờ ("08:00 · 2 thuốc", nút "Đã uống cả 2"); dải "Hoàn tác" 5 giây (trả liều về PENDING)
- 6C: ô chỉ số ghi "Hôm nay / Hôm qua / n ngày trước"; quá 7 ngày hiện "Lâu chưa đo" (chữ mờ, không đánh giá cao/thấp)
- 6D: `useNow` cập nhật mỗi phút → trạng thái "quá giờ" và lịch khám tới tự đúng
- 6E: `Skeleton` thay chữ "Đang tải..." trong thẻ và ô chỉ số

Files:

- Mới: `src/config/queryClient.ts`, `src/constants/queryKeys.ts`, `src/hooks/useNow.ts`, `src/components/common/Skeleton.tsx`, `src/components/home/UndoToast.tsx`
- Sửa: `App.tsx`, `src/context/AuthContext.tsx`, 5 hook dữ liệu, `src/screens/HomeScreen.tsx`, `src/screens/AlertsScreen.tsx` (kéo-làm-mới), `src/components/home/{MedicationTodayCard,QuickStats,HomeSectionCard}.tsx`, `src/utils/{dashboard,date,medicationStatus}.ts`, `src/services/medication.service.ts` (`markDosePending`)
- Dependency: `@tanstack/react-query`

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Unit test `getNextDoseGroup`, `relativeDayText`, `getEffectiveDoseStatus(now)`: 8/8 đạt
- Không cần migration (hoàn tác dùng quyền cập nhật `status` sẵn có; trigger tự xóa `taken_at`)
- Chưa test trên thiết bị

Notes:

- `useMedicalConditions`, `useEmergencyContacts` vẫn dùng state cục bộ (ngoài phạm vi Trang chủ).

## [TASK-005] Cải thiện Lịch tái khám

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- Tách "Lần khám tới" (thẻ nổi bật: giờ lớn, thứ/ngày đầy đủ, đếm ngược, cơ sở y tế, nội dung), "Các lịch sắp tới khác", "Đã qua" (mới nhất trước, hiện 3 + "Xem thêm")
- Ngày hiển thị dễ đọc ("Thứ Hai, 5/10/2026", ô ngày/tháng) thay cho "2026-10-05"
- Trạng thái lịch khám có icon + chữ (`AppointmentStatusBadge`)
- Chi tiết lịch khám: nút Gọi cơ sở y tế, Chỉ đường (Google Maps), ghi chú giờ nhắc + đồ cần mang, kết quả đo tại buổi đã khám, nút "Đóng" lớn

Files:

- `src/components/appointment/AppointmentSection.tsx`, `AppointmentStatusBadge.tsx` (mới); `AppointmentDetailModal.tsx` (viết lại)
- `src/utils/appointment.ts` (mới); `src/utils/dashboard.ts` (dùng `splitAppointments`); `src/components/home/NextAppointmentCard.tsx`
- `src/constants/appointmentStatus.ts` (thêm icon)
- `src/screens/MedicationScreen.tsx` (dùng `AppointmentSection`, truyền kết quả đo cho chi tiết)

Verification:

- `npx tsc --noEmit` passed; unit test `appointment.ts` 5/5; `npx expo export --platform android` bundle thành công
- Chưa xem giao diện trên thiết bị

Notes:

- Lịch UPCOMING đã qua giờ mà chưa được cập nhật trạng thái sẽ nằm ở "Đã qua" với nhãn "Sắp tới" — cần bác sĩ/Backend cập nhật trạng thái sau buổi khám.

## [TASK-004] Tối giản Trang chủ người cao tuổi

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- Bỏ 4 nút tắt (trùng thanh tab), câu hỏi phụ dưới lời chào, thẻ "Lần đo gần nhất" (trùng ô chỉ số)
- Gộp "Thuốc cần uống tiếp theo" + "Uống thuốc hôm nay" thành thẻ "Thuốc hôm nay" (x/y, thanh tiến độ, liều tiếp theo 1 dòng, nút "Đã uống")
- Lịch khám rút gọn còn "T2, 5/10 · 09:00" + đếm ngược
- Cảnh báo chỉ hiện dải nhỏ khi có cảnh báo chưa đọc (không có thì ẩn, vẫn còn chuông có badge)
- Nút SOS giữ nguyên nội dung và kiểu dáng như trước (theo yêu cầu)

Files:

- `src/screens/HomeScreen.tsx`
- `src/components/home/MedicationTodayCard.tsx`, `AlertStrip.tsx` (mới); `NextAppointmentCard.tsx`, `HomeSectionCard.tsx` (thêm `headerRight`)
- Xóa `ComplianceCard`, `NextDoseCard`, `LatestMetricCard`, `AlertSummaryCard`
- `src/components/emergency/SOSButton.tsx`, `src/utils/date.ts` (`formatShortDate`), `src/utils/dashboard.ts` (bỏ `getLatestMetric`)

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Chưa xem giao diện trên thiết bị

## [TASK-003] Nhắc thuốc/lịch khám, Cảnh báo sức khỏe, Biểu đồ chỉ số, SOS kèm vị trí (Phần 2–5)

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- Phần 2: local notification nhắc uống thuốc (DAILY, gộp theo giờ) và lịch khám (19:00 hôm trước, 2 giờ trước); đồng bộ khi mở app, hủy khi đăng xuất; bấm thông báo mở tab Chăm sóc; mục bật lại quyền trong Hồ sơ; cron `mark-missed-doses`
- Phần 3: bảng `alert_thresholds` + `alerts`, trigger `evaluate_metric` sinh cảnh báo; màn Cảnh báo sức khỏe (đánh dấu đã đọc, chi tiết, xem chỉ số, liên hệ); chuông có badge + thẻ cảnh báo trên Trang chủ; hộp thoại cảnh báo sau khi đồng bộ thiết bị
- Phần 4: màn Lịch sử chỉ số với biểu đồ SVG (7 ngày → 1 năm), khoảng tham chiếu từ Backend, điểm có cảnh báo, chạm xem giá trị, thống kê thấp/cao/trung bình, danh sách lần đo
- Phần 5: nút SOS dùng chung (Trang chủ + Khẩn cấp): gọi 115 → lấy vị trí → mở SMS kèm link bản đồ tới liên hệ khẩn cấp

Roles:

- ELDERLY (nhắc nhở, đánh dấu đã đọc cảnh báo, SOS)
- CAREGIVER / MEDICAL_STAFF xem được cảnh báo qua RLS; MEDICAL_STAFF đặt ngưỡng riêng

Files:

- `supabase/migrations/20260929030222_mark_missed_doses.sql`, `20260929030439_health_alerts.sql`, `20260929040000_applicable_alert_thresholds.sql`
- `supabase/seed.sql` (lần đo huyết áp cao của eld004 → 167/102)
- Services: `notification`, `alert`, `location`, `sos`
- Hooks: `useReminderSync`, `useNotificationPermission`, `useAlerts`, `useAlertThresholds`, `useSOS`; `useHealthMetrics` (trả cảnh báo sau đồng bộ)
- Screens: `AlertsScreen`, `MetricHistoryScreen` (mới); `HomeScreen`, `VitalsScreen`, `EmergencyScreen`, `ProfileScreen`
- Components: `alert/AlertItem`, `alert/AlertDetailModal`, `home/AlertSummaryCard`, `health/MetricChart`, `health/RangeSelector`, `emergency/SOSButton`, `profile/ReminderSettingCard`
- Utils/constants: `reminders`, `chart`, `sos`, `notification`, `alert`, `chartRange`, `emergency`; `types/alert`, `types/alertThreshold`
- Navigation: stack `Main` bọc tab (màn `Alerts`, `MetricHistory`), `navigationRef`
- `app.json` (plugin `expo-notifications`, `expo-location`), `theme/colors.ts` (`warningLight`, màu series biểu đồ)
- Dependencies: `expo-notifications`, `react-native-svg`, `expo-location`, `expo-sms`

Verification:

- `npx tsc --noEmit` passed; `npx expo export --platform android` bundle thành công
- Unit test: lịch nhắc 6/6, hàm biểu đồ 7/7, tin nhắn SOS 2/2
- Cron MISSED test trên DB cục bộ (liều hôm qua → MISSED, hôm nay giữ PENDING, authenticated không gọi được)
- Cảnh báo test qua API cục bộ 13/13 (trigger, RLS 3 role, đánh dấu đã đọc, ngưỡng riêng ghi đè mặc định)
- Palette biểu đồ `#0B8C79`/`#C2621A` qua `validate_palette.js` (light): tất cả PASS
- 3 migration đã `db push` lên project thật; kiểm tra: cron có job, eld004 có 1 cảnh báo HIGH, RPC ngưỡng trả 6 dòng
- Chưa test trên thiết bị thật (thông báo, SMS, vị trí cần máy thật)

Notes:

- Người thân chưa nhận được cảnh báo/SOS tự động (cần push notification từ server — giai đoạn sau). SMS SOS vẫn cần người dùng bấm Gửi.

## [TASK-002] Trang chủ người cao tuổi dùng dữ liệu thật (Phần 1)

Status: COMPLETED (chờ test trên thiết bị)

Date: 2026-09-29

Implemented:

- Thẻ "Thuốc cần uống tiếp theo": liều chưa uống sớm nhất (kể cả liều quá giờ), trạng thái có icon + chữ, nút "Đã uống" lớn
- Thẻ "Uống thuốc hôm nay": số liều đã uống / tổng liều, thanh tiến độ
- 3 ô chỉ số nhanh (Huyết áp, Nhịp tim, SpO2) và thẻ "Lần đo gần nhất" (thời điểm, nguồn đo)
- Thẻ "Lịch khám sắp tới": ngày giờ, đếm ngược số ngày, cơ sở y tế, bác sĩ
- Kéo xuống để làm mới; tự tải lại khi quay về tab (không nháy nội dung cũ)
- Lỗi tải dữ liệu hiện banner "Thử lại" trong trang — nút SOS luôn dùng được
- Thẻ Cảnh báo giữ placeholder (Phần 3)

Roles:

- ELDERLY (nút "Đã uống" chỉ hiện cho ELDERLY)
- CAREGIVER / MEDICAL_STAFF dùng chung HomeScreen nhưng chưa có dữ liệu riêng (ngoài phạm vi)

Files:

- `src/screens/HomeScreen.tsx`
- `src/components/home/` (mới): `HomeSectionCard`, `NextDoseCard`, `ComplianceCard`, `QuickStats`, `LatestMetricCard`, `NextAppointmentCard`, `LoadErrorBanner`
- `src/utils/dashboard.ts`, `src/utils/metric.ts` (mới); `src/utils/date.ts` (thêm `fromDateKey`, `formatLongDate`, `formatDateTime`, `daysFromToday`)
- `src/screens/VitalsScreen.tsx` (dùng chung `formatMetricValue`, `formatDateTime`)
- `src/theme/colors.ts` (thêm `dangerLight`, `infoLight`)

Verification:

- `npx tsc --noEmit` passed
- Unit test các hàm trong `dashboard.ts` / `date.ts` / `metric.ts`: 12/12 đạt
- `npx expo export --platform android` bundle thành công
- Chưa test trên thiết bị thật

Notes:

- Home của CAREGIVER / MEDICAL_STAFF cần làm riêng sau (xem người cao tuổi được liên kết / phụ trách).

## [TASK-001] Supabase — Client, Schema & RLS, Auth, Services, Seed (Phần 0a–0e)

Status: COMPLETED

Date: 2026-09-29

Implemented:

- Supabase client (`expo-sqlite/localStorage` lưu session, tự refresh token theo AppState)
- Supabase CLI và migration khởi tạo: 10 bảng, RLS cho mọi bảng, trigger tạo profile/mã người dùng, RPC `ensure_doses_for_date`
- Đăng ký / đăng nhập / đăng xuất / khôi phục phiên / cập nhật hồ sơ qua Supabase Auth
- Chuyển lỗi Supabase thành thông báo tiếng Việt thân thiện
- 6 service dữ liệu chuyển sang Supabase; xóa toàn bộ `src/mock/`
- Hook có trạng thái `error`; `ErrorState` + nút Thử lại trên các màn Thuốc, Sức khỏe, Khẩn cấp, Hồ sơ; Alert khi lưu/xóa/đánh dấu thất bại
- Seed dữ liệu y tế mẫu cho 5 người cao tuổi (bệnh nền, liên hệ, thuốc, lịch khám, chỉ số 30 ngày)
- Seed 11 tài khoản test: ELD001–ELD005, CG001–CG005 (mỗi người thân liên kết 1 người cao tuổi), STA001 (phụ trách cả 5); mật khẩu `Careage@2026`

Roles:

- ELDERLY
- CAREGIVER
- MEDICAL_STAFF
- ADMIN (không tự đăng ký được; metadata `ADMIN` bị hạ thành ELDERLY)

Files:

- `src/config/supabase.ts` (mới)
- `src/services/supabaseError.ts` (mới)
- `src/services/auth.service.ts`, `src/context/AuthContext.tsx`
- `src/navigation/RootNavigator.tsx` (màn chờ khi khôi phục phiên)
- `src/screens/auth/RegisterScreen.tsx` (xử lý trường hợp cần xác nhận email)
- `src/screens/ProfileScreen.tsx`, `src/types/auth.ts` (chuyển `roleLabel` khỏi mock)
- `src/mock/mockUsers.ts` (xóa)
- `supabase/config.toml`, `supabase/migrations/20260929022401_init_schema.sql` (mới)
- `supabase/seed.sql` (mới)
- `src/services/{healthProfile,medicalCondition,emergencyContact,medication,appointment,health}.service.ts`
- `src/hooks/use*.ts` (6 hook dữ liệu)
- `src/components/common/ErrorState.tsx`, `src/utils/alertError.ts`, `src/constants/messages.ts` (mới)
- `src/utils/date.ts` (`toHourMinute`)
- 4 modal form (Contact, Condition, EditHealthProfile, EditProfile) và 4 màn (Medication, Vitals, Emergency, Profile)
- `src/mock/*` (xóa)
- `.env.example` (mới), `.env.local` (không commit)
- `package.json`, `app.json`

Verification:

- `npx tsc --noEmit` passed
- Migration áp dụng thành công trên Supabase cục bộ; `supabase db lint` không báo lỗi
- Test RLS bằng SQL theo từng role (ELDERLY, CAREGIVER, MEDICAL_STAFF, người không liên kết, anon): tất cả đạt
- Test luồng auth qua supabase-js với Supabase cục bộ (đăng ký, tạo profile, sửa hồ sơ, chặn đổi role, sai mật khẩu, trùng email, mật khẩu yếu, đăng xuất): 12/12 đạt
- Seed: cả 11 tài khoản đăng nhập được; người thân chỉ thấy người cao tuổi của mình, bác sĩ thấy đủ 5 người; chạy seed lại không tạo trùng
- Test truy vấn của các service với eld001 trên Supabase cục bộ (đọc/ghi hồ sơ, RPC sinh liều, đánh dấu uống/bỏ qua, CRUD bệnh nền và liên hệ, thêm chỉ số DEVICE, chặn sửa dữ liệu người khác): 16/16 đạt
- `npx expo export --platform android` bundle thành công; bundle không chứa secret key
- `supabase db push --include-seed` lên project thật; kiểm tra qua API: eld001/eld004/cg001/sta001 thấy đúng phạm vi dữ liệu, anon không thấy gì
- Chưa test trên thiết bị thật

Notes:

- Màn của CAREGIVER / MEDICAL_STAFF chưa làm (theo yêu cầu: làm chức năng cho người cao tuổi trước).
- Màn Quên mật khẩu vẫn là mock.
