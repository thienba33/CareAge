"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Stethoscope, UserRound, UserRoundCog, Users } from "lucide-react";

// Menu theo khu: quản trị viên / bác sĩ (/bs). Mục đầu là trang tổng quan — chỉ sáng khi đúng đường dẫn đó.
const LINKS = {
  admin: [
    { href: "/", label: "Tổng quan", Icon: LayoutDashboard },
    { href: "/nguoi-dung", label: "Người dùng", Icon: Users },
    { href: "/bac-si", label: "Bác sĩ & phân công", Icon: Stethoscope },
    { href: "/lich-kham", label: "Lịch khám", Icon: CalendarDays },
  ],
  staff: [
    { href: "/bs", label: "Tổng quan", Icon: LayoutDashboard },
    { href: "/bs/benh-nhan", label: "Bệnh nhân", Icon: UserRound },
    { href: "/bs/lich-kham", label: "Lịch khám", Icon: CalendarDays },
    { href: "/bs/ho-so", label: "Hồ sơ của tôi", Icon: UserRoundCog },
  ],
} as const;

type Area = keyof typeof LINKS;

// Menu: mục đang mở có nền xanh nhạt; còn lại chữ xám.
// usePathname là dữ liệu lúc chạy (route động như /bs/benh-nhan/[id]) → đặt trong Suspense; khung tĩnh hiện menu chưa đánh dấu.
export default function NavLinks({ area = "admin" }: { area?: Area }) {
  return (
    <Suspense fallback={<NavList area={area} pathname={null} />}>
      <ActiveNav area={area} />
    </Suspense>
  );
}

function ActiveNav({ area }: { area: Area }) {
  return <NavList area={area} pathname={usePathname()} />;
}

function NavList({ area, pathname }: { area: Area; pathname: string | null }) {
  return (
    <nav className="flex gap-0.5 overflow-x-auto md:flex-col">
      {LINKS[area].map((l, i) => {
        const active = pathname !== null && (i === 0 ? pathname === l.href : pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            title={l.label}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition md:group-data-[collapsed=true]/sb:justify-center md:group-data-[collapsed=true]/sb:px-0 ${
              active ? "bg-primary-light font-medium text-primary-dark" : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <l.Icon aria-hidden className="size-4 shrink-0" />
            <span className="md:group-data-[collapsed=true]/sb:hidden">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
