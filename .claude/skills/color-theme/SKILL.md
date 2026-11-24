---
name: color-theme
description: Bảng màu chủ đạo (xanh ngọc/jade/teal) cho ứng dụng CareAge - design tokens, light/dark mode, màu semantic cho trạng thái sức khỏe/cảnh báo, và quy tắc dùng màu cho UI người cao tuổi. Dùng skill này khi tạo theme, style, component UI mới, hoặc khi cần chọn màu cho bất kỳ màn hình nào trong CareAge.
---

# SKILL: Color Theme - Xanh ngọc (Jade/Teal)

## 1. Nguyên tắc

Màu chủ đạo (primary) của toàn bộ ứng dụng CareAge là **xanh ngọc (jade/teal)**.

* Áp dụng nhất quán trên Mobile App và (sau này) Website Admin.
* Không tự ý đổi sang màu khác (xanh dương, xanh lá cây thường...) khi chưa được yêu cầu.
* Không hard-code mã màu rải rác trong component. Mọi màu phải khai báo tập trung tại theme/design tokens.
* Vì đối tượng chính là người cao tuổi: ưu tiên độ tương phản cao, không dùng màu làm phương tiện truyền đạt thông tin duy nhất (kèm icon/text).

---

## 2. Design tokens

Tập trung khai báo tại một nơi duy nhất, ví dụ:

```text
constants/colors.ts
constants/theme.ts
```

### 2.1 Primary - Jade/Teal scale

```text
primary-50   #E6FBF6
primary-100  #C2F5E8
primary-200  #8FEBD6
primary-300  #57DEC1
primary-400  #2BCBAC
primary-500  #0FAE94   <- Primary chính (base)
primary-600  #0B8C79
primary-700  #0A6E5F
primary-800  #08544A
primary-900  #063E37
```

* `primary-500` (`#0FAE94`) là màu chủ đạo dùng cho: nút chính (CTA), icon active, tab đang chọn, header/brand accent, progress bar, biểu đồ đường chính.
* `primary-600`/`primary-700` dùng cho trạng thái pressed/hover và text trên nền sáng cần tương phản cao hơn.
* `primary-50`/`primary-100` dùng cho nền nhẹ (badge, highlight, background của card được chọn).

### 2.2 Neutral (nền, text, border)

```text
neutral-0    #FFFFFF
neutral-50   #F7FAF9
neutral-100  #EEF3F2
neutral-200  #DCE5E3
neutral-300  #B9C7C4
neutral-500  #6B7C79
neutral-700  #3B4A47
neutral-900  #16211F
```

Nền chính dùng `neutral-0`/`neutral-50` (light) để không cạnh tranh với primary.

### 2.3 Semantic colors (trạng thái sức khỏe/cảnh báo)

Không dùng primary (jade) để biểu diễn cảnh báo/nguy hiểm — jade chỉ là màu thương hiệu/hành động.

```text
success   #16A34A   (đã uống thuốc, hoàn thành lịch khám, chỉ số bình thường)
warning   #F59E0B   (severity: MEDIUM, sắp đến hạn, cần chú ý)
danger    #DC2626   (severity: HIGH/CRITICAL, MISSED, chỉ số bất thường nghiêm trọng)
info      #0284C7   (thông báo hệ thống, gợi ý trung tính)
```

Mapping với `HealthAlerts.severity` (xem skill `elderly-health-mobile-app`, mục 15):

```text
LOW      → info
MEDIUM   → warning
HIGH     → danger
CRITICAL → danger (kèm nhấn mạnh: icon, viền dày hơn — không chỉ đổi màu)
```

### 2.4 Dark mode

```text
primary-500 (dark bg)  #2BCBAC   <- sáng hơn để đủ tương phản trên nền tối
background             #0E1613
surface                #16211F
text-primary           #EAF4F1
text-secondary         #9FB3AF
border                 #26332F
```

---

## 3. Quy tắc sử dụng

* **Primary (jade)**: nút CTA chính, tab/nav item active, link, icon nhấn mạnh, accent trên logo/splash, vòng tiến trình (ví dụ vòng tuân thủ uống thuốc).
* **Không dùng jade** cho nút hủy/xóa (dùng `danger`), không dùng cho text cảnh báo nguy hiểm.
* Nút phụ (secondary button): outline hoặc nền `neutral-100` với text `primary-700`, không dùng nền jade đặc để tránh quá nhiều mảng màu nổi bật trên một màn hình.
* Biểu đồ sức khỏe (Health Charts): đường chỉ số chính dùng `primary-500`; nếu có khoảng tham chiếu bất thường, dùng `warning`/`danger` cho vùng/điểm đó, không đổi màu toàn bộ đường biểu đồ.
* Trạng thái đã đọc/chưa đọc (notification, alert): chấm nhỏ `primary-500` cho "chưa đọc", không dùng cho severity.
* Contrast tối thiểu WCAG AA (4.5:1) cho text trên nền màu, đặc biệt quan trọng vì đối tượng dùng là người cao tuổi.

## 4. Khi tạo component/theme mới

1. Kiểm tra token đã tồn tại tại `constants/colors.ts` trước khi thêm màu mới.
2. Nếu cần thêm shade mới, thêm vào đúng scale (primary/neutral/semantic), không tạo biến rời rạc.
3. Không đặt tên biến theo mã hex (`teal500`) — đặt theo vai trò (`primary`, `success`, `danger`) để dễ đổi theme sau này.
4. Nếu dự án dùng NativeWind/Tailwind, khai báo scale này trong `tailwind.config.js` dưới key `colors.primary`.
