import { redirect } from "next/navigation";

// Trang Phân công đã gộp vào trang Bác sĩ — giữ đường dẫn cũ (link đã lưu / đánh dấu) bằng cách chuyển hướng.
export default function AssignmentsRedirect() {
  redirect("/bac-si");
}
