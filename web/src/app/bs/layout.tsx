import { Suspense, type ReactNode } from "react";
import Logo from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import CurrentAdmin from "@/components/CurrentAdmin";
import SidebarShell from "@/components/SidebarShell";

// Khu bác sĩ: cùng khung với trang quản trị (menu trái thu gọn được), menu riêng của bác sĩ.
export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas md:flex">
      <SidebarShell
        logo={<Logo subtitle="Bác sĩ" />}
        nav={<NavLinks area="staff" />}
        footer={
          <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-canvas" />}>
            <CurrentAdmin area="staff" />
          </Suspense>
        }
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
