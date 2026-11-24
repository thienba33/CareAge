import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Khối giao diện dùng chung của web quản trị — cùng "ngôn ngữ" với app mobile nhưng tiết chế:
// dải xanh ngọc phẳng đầu trang, thẻ bo 16px bóng rất nhẹ (utility `card`), avatar nền xanh nhạt,
// nhãn trạng thái dạng viên thuốc có icon như app; bảng / chữ 14px giữ gọn cho màn hình quản trị.

// Đầu trang: tiêu đề + mô tả ngắn, thao tác (nếu có) bên phải.
export function Hero({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    // Khối xanh nằm trong vùng nội dung: lề trái/phải bằng lề các thẻ bên dưới, mép trên bằng đệm trên của sidebar
    // (py-4) — thẳng hàng với sidebar thay vì dính sát mép nó.
    <div className="px-6 pt-4 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-primary px-6 py-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-primary-light">{subtitle}</p> : null}
        </div>
        {children}
      </header>
    </div>
  );
}

// Vùng nội dung bên dưới đầu trang. (`overlap` giữ cho tương thích — không còn hiệu ứng nổi đè.)
export function Content({ children }: { children: ReactNode; overlap?: boolean }) {
  return <div className="space-y-5 px-6 py-6 md:px-8">{children}</div>;
}

// Thanh chọn mục dạng gạch chân.
export function SegmentedTabs({ items }: { items: { href: string; label: string; count?: number; active: boolean }[] }) {
  return (
    <nav className="-mb-px flex gap-6 overflow-x-auto border-b border-line">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 text-sm transition ${
            t.active ? "border-primary font-medium text-primary-dark" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {t.label}
          {t.count !== undefined ? <span className="text-xs text-muted tabular-nums">{t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

// Dải số liệu: các ô ngăn bằng vạch mảnh trong một khung viền.
export function StatsStrip({
  items,
}: {
  items: { label: string; value: number; Icon?: LucideIcon; color?: string; href?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 divide-line overflow-hidden card sm:flex sm:divide-x">
      {items.map((s) => {
        const body = (
          <>
            <span className="text-sm text-muted">{s.label}</span>
            <span className="text-2xl font-semibold text-ink tabular-nums">{s.value}</span>
          </>
        );
        const cls = "flex flex-1 flex-col gap-1 px-5 py-4";
        return s.href ? (
          <Link key={s.label} href={s.href} className={`${cls} hover:bg-canvas`}>
            {body}
          </Link>
        ) : (
          <div key={s.label} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {right}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

// Danh sách liền mạch trong một khung viền, các hàng ngăn bằng đường kẻ mảnh.
export function ListCard({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line overflow-hidden card">{children}</div>;
}

// Avatar chữ cái đầu của tên gọi (từ cuối) trên nền xanh nhạt — như avatar trên app.
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg"; muted?: boolean }) {
  const letter = name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "?";
  const dim = size === "lg" ? "size-12 text-lg" : size === "sm" ? "size-8 text-xs" : "size-9 text-sm";
  return (
    <div aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-primary-light font-semibold text-primary-dark ${dim}`}>
      {letter}
    </div>
  );
}

// Nhãn dạng viên thuốc: icon + chữ (không chỉ dùng màu — như AppointmentStatusBadge trên app).
export function Badge({ children, className = "bg-canvas text-muted", Icon }: { children: ReactNode; className?: string; Icon?: LucideIcon }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {Icon ? <Icon aria-hidden className="size-3.5" /> : null}
      {children}
    </span>
  );
}

// Khung chờ khi phần dữ liệu đang tải (Suspense fallback).
export function ListSkeleton({ rows = 5 }: { rows?: number; overlap?: boolean }) {
  return (
    <Content>
      <div className="h-9 w-80 max-w-full animate-pulse rounded-lg bg-line/60" />
      <div className="divide-y divide-line card">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="size-9 animate-pulse rounded-full bg-line/60" />
            <div className="h-4 flex-1 animate-pulse rounded bg-line/50" />
          </div>
        ))}
      </div>
    </Content>
  );
}

// Trạng thái trống: một câu ngắn trong khung viền.
export function EmptyState({ Icon, children }: { Icon?: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      {Icon ? <Icon aria-hidden className="size-6 text-muted/60" /> : null}
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}
