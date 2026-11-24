import { Alert } from "react-native";
import { ACTION_ERROR_TITLE } from "../constants/messages";

// Hiện lỗi của một thao tác (lưu, xóa, đánh dấu...). Service đã chuyển lỗi thành thông báo thân thiện.
export function alertError(error: unknown, title: string = ACTION_ERROR_TITLE) {
  const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
  Alert.alert(title, message);
}
