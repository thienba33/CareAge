import { Suspense } from "react";
import Logo from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import CurrentAdmin from "@/components/CurrentAdmin";
import SidebarShell from "@/components/SidebarShell";

// Khung trang quản trị: menu bên trái (thu gọn được trên máy tính) / phía trên (điện thoại) + nội dung.
// Phần đọc phiên (tên quản trị viên) stream sau trong Suspense.
export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-canvas md:flex">
      <SidebarShell
        logo={<Logo />}
        nav={<NavLinks />}
        footer={
          <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-canvas" />}>
            <CurrentAdmin />
          </Suspense>
        }
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
