import { ShieldAlert } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { signOut } from "@/lib/actions";


// Đăng nhập được nhưng không phải quản trị viên hay bác sĩ (người cao tuổi, người thân).
export default function NoAccessPage() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-warning-light">
          <ShieldAlert aria-hidden className="size-8 text-warning-dark" />
        </div>
        <h1 className="text-2xl font-extrabold">Tài khoản không dùng được trang web</h1>
        <p className="text-base text-muted">
          Trang web này dành cho quản trị viên và bác sĩ. Vui lòng dùng ứng dụng CareAge trên điện thoại để theo dõi sức khỏe và lịch khám.
        </p>
      </div>
      <form action={signOut}>
        <button className="w-full rounded-2xl border-[1.5px] border-danger py-3.5 text-base font-bold text-danger hover:bg-danger-light">
          Đăng xuất
        </button>
      </form>
    </AuthShell>
  );
}
