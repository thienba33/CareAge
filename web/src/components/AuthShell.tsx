import type { ReactNode } from "react";

// Khung trang đăng nhập / thông báo: dải xanh ngọc phía trên (như phần đầu các màn trên app), thẻ trắng nổi đè lên.
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="relative h-72 overflow-hidden rounded-b-[40px] bg-primary">
        <div aria-hidden className="absolute -top-16 -right-12 size-56 rounded-full bg-white/[0.08]" />
        <div aria-hidden className="absolute -bottom-10 -left-10 size-40 rounded-full bg-white/[0.08]" />
      </div>
      <div className="relative -mt-52 flex justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-7 rounded-3xl bg-white p-8 shadow-[0_8px_24px_rgba(11,140,121,0.12)]">{children}</div>
      </div>
    </main>
  );
}
