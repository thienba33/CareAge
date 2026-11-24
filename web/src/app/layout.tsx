import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

// Font hỗ trợ đầy đủ dấu tiếng Việt.
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // Tab trình duyệt chỉ hiện tên sản phẩm — các trang không đặt tiêu đề riêng.
  title: "CareAge Quản trị",
  description: "Trang quản trị bệnh viện cho hệ thống chăm sóc sức khỏe người cao tuổi CareAge.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: một số tiện ích trình duyệt tự thêm class vào <html> (vd. "mdl-js") trước khi React chạy.
    // Chỉ bỏ qua thuộc tính của riêng thẻ <html>, các thẻ bên trong vẫn được kiểm tra bình thường.
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
