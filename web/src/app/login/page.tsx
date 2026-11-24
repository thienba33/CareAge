import LoginIllustration from "@/components/LoginIllustration";
import Image from "next/image";
import LoginForm from "./LoginForm";


// Trang đăng nhập chia đôi: bên trái giới thiệu + hình minh hoạ (màn hình rộng), bên phải form.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-white">
      <section className="relative hidden w-[55%] flex-col overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#06574B] px-14 py-12 text-white lg:flex">
        <div aria-hidden className="absolute -top-24 -left-24 size-80 rounded-full bg-white/[0.06]" />
        <div aria-hidden className="absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-white/[0.05]" />
        <div className="relative text-right">
          <h1 className="text-5xl font-extrabold tracking-tight">CareAge</h1>
          <p className="mt-3 text-xl font-medium text-primary-light">Nền tảng chăm sóc và theo dõi sức khỏe người cao tuổi</p>
        </div>
        <div className="relative flex flex-1 items-center justify-center py-8">
          <LoginIllustration />
        </div>
        <ul className="relative grid grid-cols-3 gap-4 text-sm text-primary-light">
          <li>
            <b className="block text-base text-white">Theo dõi chỉ số</b>Huyết áp, nhịp tim, đường huyết
          </li>
          <li>
            <b className="block text-base text-white">Nhắc uống thuốc</b>Đúng giờ, báo người thân khi quên
          </li>
          <li>
            <b className="block text-base text-white">Lịch tái khám</b>Đặt lịch, bác sĩ xác nhận
          </li>
        </ul>
      </section>

      <section className="flex flex-1 flex-col px-6 py-8 sm:px-12">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-7">
            <div className="flex flex-col items-center gap-3 text-center">
              <Image src="/logo.png" alt="CareAge" width={200} height={176} priority className="h-auto w-44" />
              <p className="text-sm font-extrabold tracking-wide text-primary-dark uppercase">Hệ thống chăm sóc sức khỏe người cao tuổi</p>
            </div>
            <LoginForm />
          </div>
        </div>
        <p className="text-center text-xs text-muted italic">Bản quyền © 2026 CareAge. Bảo lưu mọi quyền.</p>
      </section>
    </main>
  );
}
