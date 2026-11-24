import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// Supabase client phía server (Server Component, Server Action) — phiên đăng nhập lấy từ cookie,
// truy vấn chạy với quyền của người đăng nhập (RLS).
export async function createClient() {
  // Luôn chạy theo request (không prerender): supabase-js dùng Date.now() khi kiểm tra hạn phiên.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Gọi từ Server Component (không ghi cookie được) — proxy.ts đã làm mới phiên.
        }
      },
    },
  });
}
