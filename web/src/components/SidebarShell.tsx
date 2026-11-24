"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

// Trạng thái đóng / mở sidebar — lưu ở trình duyệt (tiện ích riêng mỗi người, không phải dữ liệu hệ thống).
const KEY = "careage-admin-sidebar-collapsed";
const EVENT = "careage-sidebar-change";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false; // chế độ riêng tư / bị chặn lưu trữ → mặc định mở
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function setCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    // không lưu được thì chỉ đổi trong phiên này
  }
  window.dispatchEvent(new Event(EVENT));
}

// Khung sidebar: trên máy tính có nút thu gọn thành thanh icon (rê chuột hiện tên mục).
// Phần tử con ẩn chữ khi thu gọn bằng class `group-data-[collapsed=true]/sb:hidden`.
export default function SidebarShell({ logo, nav, footer }: { logo: ReactNode; nav: ReactNode; footer: ReactNode }) {
  // Server luôn render trạng thái mở; trình duyệt đọc lựa chọn đã lưu sau khi gắn.
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  return (
    <aside
      data-collapsed={collapsed}
      className={`group/sb sticky top-0 z-20 flex flex-col gap-6 border-b border-line bg-white px-3 py-4 transition-[width] duration-200 md:h-screen md:shrink-0 md:border-r md:border-b-0 ${
        collapsed ? "md:w-[68px]" : "md:w-60"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-1 md:group-data-[collapsed=true]/sb:flex-col md:group-data-[collapsed=true]/sb:px-0">
        <div className="min-w-0 overflow-hidden">{logo}</div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
          className="hidden shrink-0 rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink md:block group-data-[collapsed=true]/sb:mx-auto"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
      {nav}
      <div className="md:mt-auto">{footer}</div>
    </aside>
  );
}
