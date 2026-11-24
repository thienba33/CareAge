---
name: elderly-health-mobile-app
description: Kiến trúc, phân quyền, quy trình làm việc và quy tắc coding cho dự án CareAge (Mobile App quản lý sức khỏe người cao tuổi). Dùng skill này cho MỌI task liên quan đến CareAge - authentication, role/permission, health profile, medications, appointments, health metrics, alerts, notifications, caregiver/medical-staff relationship, navigation, state management, API architecture, hoặc khi cần lập PLAN trước khi code.
---

# SKILL: Elderly Health Mobile App

## 1. Mục tiêu

Xây dựng ứng dụng Mobile hỗ trợ quản lý và theo dõi sức khỏe người cao tuổi.

Hệ thống gồm:

* Mobile App: dành cho Người cao tuổi, Người thân/Người chăm sóc và Nhân viên y tế.
* Website Admin: dành cho bệnh viện, triển khai ở giai đoạn sau.
* Backend RESTful API: dùng chung cho Mobile App và Website Admin.
* Database: lưu trữ dữ liệu người dùng, hồ sơ sức khỏe, thuốc, lịch khám, chỉ số sức khỏe và cảnh báo.

Ưu tiên:

1. Kiến trúc rõ ràng.
2. Phân quyền chặt chẽ.
3. Code dễ mở rộng.
4. API rõ ràng.
5. Không viết business logic trực tiếp trong UI.
6. Có khả năng tích hợp AI trong tương lai.
7. Không làm ảnh hưởng đến các chức năng đã hoàn thành.

---

# 2. Role hệ thống

Hệ thống có 4 role:

```text
ADMIN
ELDERLY
CAREGIVER
MEDICAL_STAFF
```

## 2.1 ADMIN

Quản trị viên bệnh viện.

Chủ yếu sử dụng Website Admin.

Quyền:

* Quản lý người dùng.
* Quản lý người cao tuổi.
* Quản lý người thân/người chăm sóc.
* Quản lý nhân viên y tế.
* Quản lý hồ sơ sức khỏe.
* Xem chỉ số sức khỏe.
* Xem cảnh báo.
* Xem thống kê.
* Quản lý dữ liệu hệ thống.

Mobile App chưa cần triển khai đầy đủ chức năng ADMIN.

---

## 2.2 ELDERLY

Người cao tuổi.

Quyền:

* Xem/cập nhật hồ sơ cá nhân.
* Xem hồ sơ sức khỏe.
* Xem bệnh nền.
* Xem tiền sử bệnh.
* Xem dị ứng.
* Xem danh sách thuốc.
* Xem lịch uống thuốc.
* Đánh dấu đã uống thuốc.
* Xem lịch khám.
* Xem lịch sử khám.
* Nhập chỉ số sức khỏe.
* Xem lịch sử chỉ số.
* Xem biểu đồ sức khỏe.
* Nhận thông báo.
* Nhận cảnh báo sức khỏe.

---

## 2.3 CAREGIVER

Người thân/người chăm sóc.

Quyền:

* Xem người cao tuổi được liên kết.
* Xem hồ sơ sức khỏe được cấp quyền.
* Xem bệnh nền.
* Xem thuốc.
* Xem lịch uống thuốc.
* Xem lịch khám.
* Xem chỉ số sức khỏe.
* Xem biểu đồ.
* Nhận cảnh báo.
* Nhận thông báo.

CAREGIVER không được tự ý thay đổi dữ liệu y tế quan trọng nếu không có quyền.

---

## 2.4 MEDICAL_STAFF

Nhân viên y tế.

Quyền:

* Xem danh sách người cao tuổi được phụ trách.
* Xem hồ sơ sức khỏe.
* Xem bệnh nền.
* Xem thuốc.
* Xem lịch khám.
* Xem chỉ số sức khỏe.
* Xem lịch sử chỉ số.
* Xem biểu đồ.
* Xem cảnh báo.
* Cập nhật thông tin chuyên môn theo quyền được cấp.
* Theo dõi tình trạng sức khỏe.

---

# 3. Nguyên tắc phân quyền

Phân quyền phải được kiểm tra ở Backend.

Mobile App chỉ dùng role để:

* Hiển thị/ẩn chức năng.
* Điều hướng.
* Thay đổi UI.

Không coi việc kiểm tra role ở Mobile là cơ chế bảo mật.

Backend phải kiểm tra:

```text
Authentication
        ↓
User
        ↓
Role
        ↓
Permission
        ↓
Resource ownership / Assignment
```

Quy tắc cơ bản:

```text
ELDERLY
→ Chỉ truy cập dữ liệu của chính mình.

CAREGIVER
→ Chỉ truy cập người cao tuổi đã được liên kết.

MEDICAL_STAFF
→ Chỉ truy cập người cao tuổi được phân công.

ADMIN
→ Quản lý toàn hệ thống.
```

Không hard-code logic permission ở nhiều màn hình.

Nên tập trung tại:

```text
constants/roles
constants/permissions
utils/permission
navigation
```

---

# 4. Phạm vi Mobile App

Giai đoạn hiện tại chỉ xây dựng Mobile App.

Không triển khai Website Admin nếu chưa được yêu cầu.

Các module:

```text
Authentication
Profile
Health Profile
Medical Conditions
Medications
Medication Reminders
Appointments
Health Metrics
Health Charts
Health Alerts
Notifications
Caregiver
Medical Staff
Settings
```

---

# 5. Authentication

Chức năng:

* Đăng ký.
* Đăng nhập.
* Đăng xuất.
* Refresh token.
* Lưu session.
* Khôi phục session.
* Lấy user hiện tại.
* Kiểm tra token hết hạn.

API dự kiến:

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me
```

Response `/auth/me`:

```json
{
  "id": "user-id",
  "name": "Nguyen Van A",
  "email": "example@gmail.com",
  "role": "ELDERLY"
}
```

Role phải được lưu trong auth state.

---

# 6. Navigation theo Role

Không sử dụng một navigation cố định cho tất cả role.

## ELDERLY

```text
Home
Health
Medications
Appointments
Alerts
Profile
```

## CAREGIVER

```text
Home
Elderly
Health
Medications
Appointments
Alerts
Profile
```

## MEDICAL_STAFF

```text
Home
Patients
Health
Alerts
Profile
```

ADMIN chủ yếu sử dụng Website Admin.

Navigation phải dễ mở rộng.

---

# 7. Home Dashboard

## ELDERLY

Hiển thị:

* Lời chào.
* Tóm tắt sức khỏe.
* Chỉ số gần nhất.
* Thuốc sắp uống.
* Lịch khám gần nhất.
* Cảnh báo.
* Thông báo.

## CAREGIVER

Hiển thị:

* Người cao tuổi được liên kết.
* Tình trạng sức khỏe tổng quan.
* Chỉ số mới nhất.
* Thuốc sắp uống.
* Lịch khám.
* Cảnh báo.

## MEDICAL_STAFF

Hiển thị:

* Danh sách bệnh nhân/người cao tuổi.
* Cảnh báo mới.
* Chỉ số bất thường.
* Lịch khám gần nhất.

---

# 8. Health Profile

Thông tin:

```text
Họ tên
Ngày sinh
Giới tính
Chiều cao
Cân nặng
Nhóm máu
Địa chỉ
Số điện thoại
Người liên hệ khẩn cấp
```

Không hard-code dữ liệu.

Tách rõ:

```text
models
services
repositories
hooks
screens
components
```

---

# 9. Medical Conditions

Quản lý:

* Bệnh nền.
* Tiền sử bệnh.
* Dị ứng.
* Ghi chú y tế.

Ví dụ:

```json
{
  "id": "condition-id",
  "name": "Tăng huyết áp",
  "diagnosedAt": "2025-01-10",
  "status": "ACTIVE",
  "note": "..."
}
```

Status:

```text
ACTIVE
INACTIVE
RESOLVED
```

Không dùng string tự do nếu có thể sử dụng enum/constants.

---

# 10. Medications

Quản lý:

* Tên thuốc.
* Liều lượng.
* Đơn vị.
* Số lần uống.
* Thời gian uống.
* Ngày bắt đầu.
* Ngày kết thúc.
* Hướng dẫn sử dụng.
* Trạng thái.

Ví dụ:

```json
{
  "id": "medication-id",
  "name": "Example",
  "dosage": "500",
  "unit": "mg",
  "frequency": 2,
  "times": [
    "08:00",
    "20:00"
  ],
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "status": "ACTIVE"
}
```

---

# 11. Medication Reminder

Chức năng:

* Tạo lịch nhắc.
* Hiển thị thuốc cần uống.
* Nhắc uống thuốc.
* Đánh dấu đã uống.
* Đánh dấu bỏ qua.
* Ghi nhận uống thuốc trễ.
* Xem lịch sử.

Status:

```text
PENDING
TAKEN
SKIPPED
MISSED
```

Notification không được là nguồn dữ liệu duy nhất.

Lịch sử uống thuốc phải được lưu thông qua Backend.

---

# 12. Appointments

Quản lý:

* Ngày khám.
* Giờ khám.
* Bệnh viện/cơ sở y tế.
* Bác sĩ/nhân viên y tế.
* Nội dung khám.
* Trạng thái.

Status:

```text
UPCOMING
COMPLETED
CANCELLED
MISSED
```

Chức năng:

* Xem lịch.
* Xem chi tiết.
* Nhắc lịch.
* Xem lịch sử.

---

# 13. Health Metrics

Các chỉ số ban đầu:

```text
BLOOD_PRESSURE
HEART_RATE
BLOOD_GLUCOSE
SPO2
TEMPERATURE
WEIGHT
```

Ví dụ:

```json
{
  "type": "BLOOD_PRESSURE",
  "value": {
    "systolic": 130,
    "diastolic": 80
  },
  "unit": "mmHg",
  "recordedAt": "2026-09-18T08:00:00Z"
}
```

Thiết kế phải cho phép thêm metric mới.

Không thiết kế hệ thống quá cứng theo danh sách metric hiện tại.

---

# 14. Health Charts

Hiển thị:

* Huyết áp.
* Nhịp tim.
* Đường huyết.
* SpO2.
* Nhiệt độ.
* Cân nặng.

Khoảng thời gian:

```text
7 ngày
30 ngày
3 tháng
6 tháng
1 năm
```

Biểu đồ cần có:

* Trục thời gian.
* Giá trị.
* Đơn vị.
* Khoảng tham chiếu nếu Backend cung cấp.
* Đánh dấu điểm bất thường nếu có.

Không tự ý đưa ra chẩn đoán từ biểu đồ.

---

# 15. Health Alerts

Backend có thể trả:

```json
{
  "id": "alert-id",
  "type": "ABNORMAL_METRIC",
  "severity": "HIGH",
  "title": "Chỉ số sức khỏe bất thường",
  "message": "...",
  "metricType": "BLOOD_PRESSURE",
  "createdAt": "..."
}
```

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Mobile cần:

* Hiển thị cảnh báo.
* Đánh dấu đã đọc.
* Hiển thị thời gian.
* Hiển thị chỉ số liên quan.
* Điều hướng đến dữ liệu liên quan.

Không tự tạo chẩn đoán y khoa.

---

# 16. Notifications

Loại notification:

```text
MEDICATION_REMINDER
APPOINTMENT_REMINDER
HEALTH_ALERT
SYSTEM
```

Chức năng:

* Push notification.
* Danh sách thông báo.
* Read/unread.
* Deep link.
* Xóa hoặc đánh dấu đã đọc nếu Backend hỗ trợ.

Nếu sử dụng FCM, tách logic FCM khỏi UI.

---

# 17. Caregiver Relationship

CAREGIVER có thể được liên kết với một hoặc nhiều ELDERLY.

Ví dụ:

```json
{
  "caregiverId": "user-id",
  "elderlyId": "user-id",
  "relationship": "CHILD",
  "status": "ACTIVE"
}
```

Relationship:

```text
CHILD
SPOUSE
GRANDCHILD
RELATIVE
OTHER
```

Backend quyết định quyền truy cập.

Mobile không tự xác định quyền.

---

# 18. Medical Staff Assignment

MEDICAL_STAFF có thể được phân công cho người cao tuổi.

Ví dụ:

```json
{
  "staffId": "user-id",
  "elderlyId": "user-id",
  "assignedAt": "...",
  "status": "ACTIVE"
}
```

Mobile không tự quyết định nhân viên nào được xem bệnh nhân nào.

Backend phải kiểm tra assignment.

---

# 19. API Architecture

Không gọi API trực tiếp trong Screen/Component.

Không viết:

```js
fetch(...)
```

trực tiếp trong UI.

Luồng:

```text
Screen
   ↓
Hook / ViewModel
   ↓
Service
   ↓
API Client
   ↓
REST API
```

Ví dụ:

```text
services/
├── auth.service.js
├── profile.service.js
├── health.service.js
├── medication.service.js
├── appointment.service.js
├── alert.service.js
├── notification.service.js
└── caregiver.service.js
```

Tên file có thể thay đổi theo framework nhưng phải giữ nguyên nguyên tắc.

---

# 20. State Management

Phân biệt Server State và Local State.

## Server State

Bao gồm:

* User.
* Health profile.
* Health metrics.
* Medications.
* Appointments.
* Alerts.
* Notifications.
* Elderly profiles.

Sử dụng React Query hoặc giải pháp tương đương.

## Local State

Bao gồm:

* Modal.
* Form.
* Tab.
* Filter.
* UI state.

Không copy server state sang nhiều store nếu không cần thiết.

---

# 21. Cache

Có chiến lược cache cho:

```text
User
Health Profile
Health Metrics
Medications
Appointments
Alerts
Notifications
```

Không gọi API lại không cần thiết khi chuyển màn hình.

Sau mutation:

```text
Create
Update
Delete
```

phải:

* Invalidate cache
  hoặc
* Update cache trực tiếp nếu phù hợp.

---

# 22. Error Handling

API error phải xử lý thống nhất.

```text
401 → Session hết hạn
403 → Không có quyền
404 → Không tìm thấy dữ liệu
422 → Dữ liệu không hợp lệ
429 → Quá nhiều request
500 → Lỗi server
```

Không hiển thị raw error từ Backend.

Phải có message thân thiện với người dùng.

---

# 23. Loading / Empty / Error State

Mọi màn hình sử dụng API phải xử lý:

```text
Loading
Success
Empty
Error
```

Ví dụ:

```text
Loading → Skeleton
Empty → Empty State
Error → Error State + Retry
```

Không để màn hình trắng khi API lỗi.

---

# 24. Security

Không:

* Hard-code access token.
* Hard-code password.
* Hard-code secret.
* Lưu token không an toàn.
* Tin tưởng role từ client.
* Cho client tự quyết định quyền.
* Đưa dữ liệu nhạy cảm vào log.
* Log access token hoặc refresh token.

Token phải được lưu bằng Secure Storage phù hợp với Mobile.

---

# 25. AI Ready

Chưa triển khai AI trong giai đoạn đầu.

Kiến trúc phải cho phép thêm:

```text
Health Analysis
Risk Prediction
Abnormal Pattern Detection
Health Recommendation
AI Assistant
```

AI phải nằm ở Backend/AI Service.

Mobile chỉ nhận kết quả.

Ví dụ:

```json
{
  "riskLevel": "MEDIUM",
  "message": "...",
  "confidence": 0.82,
  "generatedAt": "..."
}
```

Không triển khai AI giả để demo nếu chưa có yêu cầu.

---

# 26. Medical Safety

Ứng dụng chỉ hỗ trợ:

* Theo dõi.
* Ghi nhận.
* Nhắc lịch.
* Phân tích dữ liệu.
* Cảnh báo.

Không coi kết quả hệ thống là chẩn đoán y khoa.

Không đưa ra các kết luận như:

```text
Bạn chắc chắn mắc bệnh X.
Bạn cần dùng thuốc Y.
Bạn bị bệnh Z.
```

Thay vào đó:

```text
Chỉ số này nằm ngoài khoảng theo dõi được cấu hình.

Bạn nên kiểm tra lại dữ liệu hoặc liên hệ nhân viên y tế.
```

---

# 27. UI/UX

Phong cách:

* Hiện đại.
* Tối giản.
* Dễ sử dụng.
* Phù hợp với người cao tuổi.
* Font dễ đọc.
* Nút bấm đủ lớn.
* Khoảng cách giữa các thành phần rõ ràng.
* Thông tin quan trọng dễ nhìn.
* Không lạm dụng màu sắc.
* Không chỉ dùng màu để biểu diễn trạng thái.

Ưu tiên accessibility.

Xem quy tắc màu sắc chủ đạo chi tiết tại skill `color-theme` (xanh ngọc/teal).

---

# 28. Project Structure

Tùy framework thực tế nhưng phải giữ nguyên nguyên tắc phân tầng.

Ví dụ:

```text
src/
├── app/
│
├── screens/
│   ├── auth/
│   ├── elderly/
│   ├── caregiver/
│   ├── medical-staff/
│   └── shared/
│
├── components/
│   ├── common/
│   ├── health/
│   ├── medication/
│   ├── appointment/
│   ├── alert/
│   └── notification/
│
├── services/
│
├── hooks/
│
├── stores/
│
├── models/
│
├── navigation/
│
├── constants/
│
├── utils/
│
└── config/
```

Không nhồi toàn bộ code vào một file.

---

# 29. Coding Rules

## Không được

* Viết một file quá lớn.
* Viết Component hàng nghìn dòng.
* Gọi API trực tiếp trong UI.
* Hard-code dữ liệu nghiệp vụ.
* Hard-code role ở nhiều nơi.
* Duplicate API logic.
* Duplicate Component.
* Duplicate business logic.
* Tự ý thay đổi kiến trúc.
* Tự ý thêm feature ngoài scope.
* Sửa code không liên quan.
* Xóa code đang hoạt động nếu không cần thiết.

## Phải

* Component nhỏ.
* Service riêng.
* Model rõ ràng.
* Constants dùng chung.
* Role/permission tập trung.
* API tập trung.
* Error handling thống nhất.
* Naming nhất quán.
* Code dễ đọc.
* Code dễ test.
* Code dễ mở rộng.

---

# 30. Quy trình làm việc bắt buộc

Claude KHÔNG được bắt đầu code ngay đối với task lớn.

## Bước 1 — Phân tích

Trước tiên phải xác định:

```text
Task
Scope
Affected modules
Affected files
Dependencies
Role affected
Permission affected
API affected
Potential risks
```

## Bước 2 — Lập kế hoạch

Phải đưa ra:

```text
1. Mục tiêu
2. Các file cần tạo
3. Các file cần sửa
4. Kiến trúc xử lý
5. API cần sử dụng
6. Role liên quan
7. Permission liên quan
8. Dependency
9. Rủi ro
10. Cách kiểm thử
```

## Bước 3 — Chờ xác nhận

Không được code cho đến khi user xác nhận kế hoạch.

Phải hỏi:

```text
PLAN READY

Bạn xác nhận PLAN này để tôi bắt đầu code?
```

Nếu user chưa xác nhận:

* Không code.
* Không tự động triển khai.
* Có thể giải thích hoặc chỉnh sửa PLAN.

---

# 31. Implementation

Sau khi user xác nhận:

* Code đúng scope.
* Tuân thủ kiến trúc.
* Không mở rộng task.
* Không tự ý thêm feature.
* Không phá vỡ chức năng hiện tại.
* Reuse code nếu đã tồn tại.
* Kiểm tra các role bị ảnh hưởng.

Nếu phát hiện vấn đề ngoài scope:

```text
Không tự sửa ngay.

Ghi nhận:
- Problem
- Impact
- Suggested solution
```

Sau đó hỏi user nếu cần sửa.

---

# 32. Verification

Sau khi code xong phải kiểm tra:

```text
Lint
Type check nếu có
Build
Unit test nếu có
Navigation
Authentication
Role access
Permission
API error
Loading state
Empty state
Error state
```

Đặc biệt phải kiểm tra:

```text
ELDERLY
CAREGIVER
MEDICAL_STAFF
ADMIN
```

đối với những task có liên quan đến quyền.

---

# 33. Task History

Tạo và duy trì:

```text
docs/TASKS.md
```

File này lưu lịch sử các task đã hoàn thành.

Format:

```md
# Task History

## [TASK-001] Authentication

Status: COMPLETED

Date: YYYY-MM-DD

Implemented:
- Login
- Register
- Refresh token
- Logout
- Get current user

Roles:
- ELDERLY
- CAREGIVER
- MEDICAL_STAFF
- ADMIN

Files:
- ...

Verification:
- Build passed
- Lint passed

Notes:
- ...
```

Mỗi task hoàn thành phải cập nhật vào file này.

Không xóa lịch sử task cũ.

---

# 34. Development Priority

Triển khai theo thứ tự:

```text
1. Project Foundation
2. Authentication
3. Role & Permission
4. Navigation
5. User Profile
6. Health Profile
7. Medical Conditions
8. Medications
9. Medication Reminder
10. Appointments
11. Health Metrics
12. Health Charts
13. Health Alerts
14. Notifications
15. Caregiver Relationship
16. Medical Staff Assignment
17. Dashboard
18. Optimization
19. Testing
```

Không triển khai AI trước khi các chức năng quản lý sức khỏe cốt lõi hoàn thành.

---

# 35. Future Hospital Admin

Website Admin sẽ được xây dựng ở giai đoạn sau.

Website Admin dự kiến sử dụng cùng Backend:

```text
Mobile App
     │
     ▼
 REST API
     │
     ▼
 Backend
     │
     ├── Database
     ├── Health Analysis
     ├── Notification
     └── AI Service
     
Hospital Admin Web
     │
     ▼
 REST API
```

Do đó:

* Không tạo API chỉ phục vụ riêng Mobile nếu không cần thiết.
* API phải có khả năng phục vụ Website Admin.
* Business logic phải nằm ở Backend.
* Mobile không được chứa business logic độc quyền mà Admin sau này cần sử dụng.

---

# 36. Final Rule

Mọi code phải hướng đến kiến trúc:

```text
                    ┌──────────────────┐
                    │    Mobile App    │
                    │                  │
                    │ ELDERLY          │
                    │ CAREGIVER        │
                    │ MEDICAL_STAFF    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   RESTful API    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌────────────┐   ┌──────────┐
        │ Database │   │   Health   │   │   AI     │
        │          │   │  Analysis  │   │ Future   │
        └──────────┘   └─────┬──────┘   └──────────┘
                             │
                             ▼
                       Alert System

                    ┌──────────────────┐
                    │ Hospital Admin   │
                    │ Web - Future     │
                    │      ADMIN       │
                    └──────────────────┘
```

Mobile App và Website Admin phải sử dụng cùng Backend/API.

Không tạo business logic riêng biệt trên Mobile làm sai lệch dữ liệu hoặc hành vi so với Website Admin.

# 37. Claude Behavior

Luôn ưu tiên:

```text
Understand → Analyze → Plan → Ask Approval → Implement → Verify → Report → Update TASKS.md
```

Không bỏ qua bước xác nhận đối với task lớn.

Không tự ý quyết định thay đổi kiến trúc.

Không tự ý mở rộng scope.

Không đánh đổi kiến trúc lâu dài để lấy tốc độ code ngắn hạn.

Mục tiêu cuối cùng:

```text
Clean Code
+
Clear Architecture
+
Strict Role & Permission
+
Reusable Components
+
Centralized API
+
Scalable Backend
+
Future AI Integration
```
