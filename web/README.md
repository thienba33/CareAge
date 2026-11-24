# CareAge — Web quản trị bệnh viện

Trang web cho **quản trị viên bệnh viện** (role `ADMIN`): tổng quan, người dùng, phân công bác sĩ, hồ sơ bác sĩ, lịch khám.
Dùng **chung project Supabase** với app mobile (cùng database, cùng RLS) — không có backend riêng.

- Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4
- `@supabase/ssr`: phiên đăng nhập trong cookie; `src/proxy.ts` chặn người chưa đăng nhập
- `src/lib/auth.ts` → `requireAdmin()`: không phải ADMIN thì chuyển sang `/khong-co-quyen`
- Chỉ dùng **publishable key**. Không bao giờ đưa service_role / secret key vào web.

## Chạy trên máy

```bash
cd web
cp .env.example .env.local   # điền NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY (giống app)
npm install
npm run dev                  # http://localhost:3000
```

Cần các migration đến `20261007090000_admin_web.sql` và một tài khoản ADMIN
(`supabase/snippets/create_admin.sql` → `adm001@careage.vn` / `Careage@2026`, đổi mật khẩu sau khi đăng nhập).

## Deploy lên Vercel

1. Vercel → **Add New Project** → chọn repo này.
2. **Root Directory**: `web` (Framework: Next.js — tự nhận).
3. **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` (Production + Preview).
4. Deploy. Mỗi lần push nhánh `main` Vercel tự build lại.
5. Supabase Dashboard → Authentication → URL Configuration: thêm domain Vercel vào **Site URL / Redirect URLs**.

## Kiểm tra

```bash
npm run lint && npx tsc --noEmit && npm run build
```
