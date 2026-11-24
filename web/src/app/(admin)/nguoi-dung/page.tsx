import { Suspense } from "react";
import { Content, Hero } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getUsers } from "@/lib/data";
import type { Role } from "@/lib/labels";
import UsersBrowser from "./UsersBrowser";


const ROLES: Role[] = ["ELDERLY", "CAREGIVER", "MEDICAL_STAFF", "ADMIN"];

type Search = Promise<{ "vai-tro"?: string; q?: string }>;

// Mọi tài khoản. Danh sách tải MỘT lần trên server; chọn vai trò / tìm / sắp xếp lọc ngay trên trình duyệt (UsersBrowser).
export default function UsersPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <Hero title="Người dùng" subtitle="Tất cả tài khoản trong hệ thống" />
      <Suspense fallback={<UsersSkeleton />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UsersContent({ searchParams }: { searchParams: Search }) {
  const [admin, params, users] = await Promise.all([requireAdmin(), searchParams, getUsers()]);
  const role = ROLES.includes(params["vai-tro"] as Role) ? (params["vai-tro"] as Role) : null;
  return <UsersBrowser users={users} currentAdminId={admin.id} initialRole={role} initialQuery={params.q ?? ""} />;
}

// Khung chờ giống bố cục thật (thanh vai trò, ô tìm kiếm, các hàng có avatar) — trang không nhảy khi dữ liệu về.
function UsersSkeleton() {
  return (
    <Content>
      <section className="card">
        <div className="flex gap-2 border-b border-line p-3">
          <div className="h-9 flex-1 animate-pulse rounded-lg bg-line/50" />
          <div className="h-9 w-40 animate-pulse rounded-lg bg-line/50" />
        </div>
        <div className="flex gap-5 border-b border-line px-4 py-3">
          {[48, 96, 72, 96, 84].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-4 animate-pulse rounded bg-line/60" />
          ))}
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-line/60" />
              <div className="h-3.5 w-48 animate-pulse rounded bg-line/60" />
              <div className="hidden h-3.5 w-56 animate-pulse rounded bg-line/50 lg:block" />
              <div className="ml-auto h-5 w-24 animate-pulse rounded bg-line/50" />
            </div>
          ))}
        </div>
      </section>
    </Content>
  );
}
