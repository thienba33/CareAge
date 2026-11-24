"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, ShieldCheck, Stethoscope } from "lucide-react";
import { signIn, type ActionState } from "@/lib/actions";

type Tab = "admin" | "doctor";

const INPUT =
  "w-full rounded-[14px] border-[1.5px] border-line bg-canvas px-4 py-3.5 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20";

// Form đăng nhập có thanh chọn vai trò (chỉ đổi gợi ý trên form). Sau khi đăng nhập, server đưa vào khu theo vai trò
// thật của tài khoản: bác sĩ → /bs, quản trị viên → /.
export default function LoginForm() {
  const [tab, setTab] = useState<Tab>("doctor");
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, null);

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 border-b-2 pb-3 text-sm font-extrabold uppercase tracking-wide transition ${
      active ? "border-primary text-primary-dark" : "border-line text-muted hover:text-ink"
    }`;

  return (
    <div className="space-y-6">
      <div role="tablist" className="flex">
        <button type="button" role="tab" aria-selected={tab === "doctor"} className={tabClass(tab === "doctor")} onClick={() => setTab("doctor")}>
          <Stethoscope aria-hidden className="size-4" /> Bác sĩ
        </button>
        <button type="button" role="tab" aria-selected={tab === "admin"} className={tabClass(tab === "admin")} onClick={() => setTab("admin")}>
          <ShieldCheck aria-hidden className="size-4" /> Quản trị
        </button>
      </div>

      <form action={action} className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink">
            Email <span className="text-danger">*</span>
          </span>
          <input name="email" type="email" autoComplete="email" required placeholder={tab === "admin" ? "adm001@careage.vn" : "sta001@careage.vn"} className={INPUT} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ink">
            Mật khẩu <span className="text-danger">*</span>
          </span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className={`${INPUT} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </label>

        {state && !state.ok ? <p className="rounded-xl bg-danger-light px-4 py-2.5 text-sm font-semibold text-danger">{state.message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-base font-extrabold text-white shadow-[0_8px_20px_rgba(15,174,148,0.3)] transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        <p className="rounded-xl bg-canvas px-4 py-3 text-center text-sm text-muted">
          {tab === "admin" ? "Tài khoản quản trị do bệnh viện cấp." : "Dùng cùng email và mật khẩu với ứng dụng CareAge trên điện thoại."}
        </p>
      </form>
    </div>
  );
}
