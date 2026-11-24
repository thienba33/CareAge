import { isAuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";

// Chuyển lỗi từ Supabase (Auth / PostgREST) thành thông báo thân thiện, không hiển thị lỗi thô cho người dùng
// (skill elderly-health-mobile-app mục 22). Dùng chung cho mọi service gọi Supabase.

const DEFAULT_MESSAGE = "Đã có lỗi xảy ra. Vui lòng thử lại.";
const NETWORK_MESSAGE = "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email hoặc mật khẩu không đúng.",
  email_not_confirmed: "Email chưa được xác nhận. Vui lòng mở email và bấm vào liên kết xác nhận.",
  user_already_exists: "Email đã được sử dụng.",
  email_exists: "Email đã được sử dụng.",
  weak_password: "Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự.",
  email_address_invalid: "Email không hợp lệ.",
  validation_failed: "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.",
  over_request_rate_limit: "Bạn thao tác quá nhiều lần. Vui lòng đợi một lát rồi thử lại.",
  over_email_send_rate_limit: "Đã gửi quá nhiều email. Vui lòng đợi một lát rồi thử lại.",
  session_expired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  refresh_token_not_found: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  user_banned: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
};

// Mã lỗi Postgres / PostgREST hay gặp.
const DB_MESSAGES: Record<string, string> = {
  "42501": "Bạn không có quyền thực hiện thao tác này.",
  PGRST116: "Không tìm thấy dữ liệu.",
  "23505": "Dữ liệu này đã tồn tại.",
  "23514": "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  "22P02": "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
};

export function toAppError(error: unknown): Error {
  if (isAuthRetryableFetchError(error)) {
    return new Error(NETWORK_MESSAGE);
  }

  if (isAuthError(error)) {
    if (error.code && AUTH_MESSAGES[error.code]) return new Error(AUTH_MESSAGES[error.code]);
    if (error.status === 429) return new Error(AUTH_MESSAGES.over_request_rate_limit);
    return new Error(DEFAULT_MESSAGE);
  }

  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string" && DB_MESSAGES[code]) {
    return new Error(DB_MESSAGES[code]);
  }

  if (error instanceof TypeError) {
    // fetch thất bại (mất mạng) ném TypeError.
    return new Error(NETWORK_MESSAGE);
  }

  return new Error(DEFAULT_MESSAGE);
}
