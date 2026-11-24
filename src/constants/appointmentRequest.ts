// Đặt lịch tái khám (gửi yêu cầu, nhân viên y tế xác nhận).

// Số ngày tới có thể chọn khi đặt lịch.
export const REQUEST_DAYS_AHEAD = 30;

// Khung giờ khám thường gặp (giờ hành chính), chọn bằng nút bấm thay vì gõ.
export const REQUEST_TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

export const REQUEST_REASON_SUGGESTIONS = ["Tái khám định kỳ", "Khám huyết áp", "Khám tiểu đường", "Lấy thuốc"];

// Mã lỗi riêng của RPC request_appointment (xem migration appointment_requests, appointment_linked_doctor).
export const APPOINTMENT_REQUEST_ERRORS: Record<string, string> = {
  CA001: "Thời gian khám phải sau thời điểm hiện tại.",
  CA003: "Đang có 3 yêu cầu chờ xác nhận. Vui lòng chờ nhân viên y tế xử lý hoặc hủy bớt yêu cầu.",
  CA004: "Bác sĩ này không còn phụ trách. Vui lòng chọn lại bác sĩ.",
  CA005: "Bác sĩ chưa cập nhật nơi làm việc. Vui lòng chọn bác sĩ khác hoặc liên hệ cơ sở y tế.",
};

// Lý do từ chối thường gặp (bác sĩ chọn nhanh, có thể tự nhập) — gửi kèm thông báo cho người thân.
export const REJECT_REASON_SUGGESTIONS = [
  "Bác sĩ bận vào giờ này",
  "Vui lòng chọn ngày hoặc giờ khác",
  "Nên khám tại cơ sở y tế khác",
];

// Lời dặn thường gặp khi bác sĩ xác nhận lịch (chọn nhanh, có thể sửa / tự nhập) — gửi cho bệnh nhân và người nhà.
export const APPROVE_NOTE_SUGGESTIONS = [
  "Nhịn ăn sáng trước khi khám",
  "Mang theo sổ khám và đơn thuốc cũ",
  "Đến trước 15 phút để làm thủ tục",
  "Có người nhà đi cùng",
];
