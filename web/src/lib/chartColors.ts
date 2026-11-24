// Màu biểu đồ — đã chạy validate_palette (skill dataviz) trên nền trắng: cả bộ đạt mọi kiểm tra
// (độ sáng, độ đậm, phân biệt cho người mù màu, tương phản ≥ 3:1).
// Xanh ngọc CareAge đi với xám KHÔNG đạt (người mù màu đỏ–lục không phân biệt được) nên "tháng trước" dùng xanh dương.
export const CHART = {
  primary: "#0b8c79", // số liệu chính / tháng này (xanh ngọc đậm CareAge)
  compare: "#2a78d6", // tháng trước / so sánh
  accent: "#eb6834", // yêu cầu chờ duyệt (khối lượng việc bác sĩ)
  primaryWash: "#0b8c79", // vùng dưới đường — dùng với opacity ~10%
  grid: "#ecebe6",
  axis: "#8a8984",
  text: "#1e1e1e",
  muted: "#6b6b6b",
} as const;

// Màu trạng thái lịch khám — khớp app (chờ: vàng, sắp tới: xanh dương, đã khám: xanh lá, huỷ: xám, lỡ / từ chối: đỏ).
// Luôn đi kèm nhãn chữ trên trục, không dùng màu một mình.
export const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "#d97706",
  UPCOMING: "#0284c7",
  COMPLETED: "#16a34a",
  CANCELLED: "#8a8984",
  MISSED: "#dc2626",
  REJECTED: "#dc2626",
};
