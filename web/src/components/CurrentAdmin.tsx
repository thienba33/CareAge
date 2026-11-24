import { LogOut } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import { Avatar } from "./ui";

// Người đang đăng nhập (quản trị viên hoặc bác sĩ) + đăng xuất. Đọc phiên → đặt trong <Suspense> ở layout.
export default async function CurrentAdmin({ area = "admin" }: { area?: "admin" | "staff" }) {
  const admin = await requireRole([area === "staff" ? "MEDICAL_STAFF" : "ADMIN"]);
  return (
    <div className="flex items-center gap-2.5 border-t border-line px-2 pt-3 md:group-data-[collapsed=true]/sb:flex-col md:group-data-[collapsed=true]/sb:px-0">
      <Avatar name={admin.name} size="sm" />
      <div className="min-w-0 flex-1 md:group-data-[collapsed=true]/sb:hidden">
        <div className="truncate text-sm font-medium text-ink">{admin.name}</div>
        <div className="truncate text-xs text-muted">{admin.email}</div>
      </div>
      <form action={signOut}>
        <button aria-label="Đăng xuất" title="Đăng xuất" className="rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink">
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
