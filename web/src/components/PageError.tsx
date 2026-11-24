"use client"; // Error boundary phải là Client Component.

import { useEffect } from "react";
import { RotateCw, ServerCrash } from "lucide-react";

// Lỗi khi tải dữ liệu một trang (quản trị hoặc bác sĩ) (vd. database chưa có hàm mới vì chưa `supabase db push`):
// hiện thông báo dễ hiểu + nút thử lại thay cho màn hình lỗi kỹ thuật. Khung menu bên trái vẫn giữ nguyên.
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 card p-8 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-danger-light">
          <ServerCrash aria-hidden className="size-8 text-danger" />
        </div>
        <h1 className="text-xl font-semibold text-ink">Không tải được dữ liệu</h1>
        <p className="text-base text-muted">
          Hệ thống đang gặp sự cố khi đọc dữ liệu. Vui lòng thử lại; nếu vẫn lỗi, liên hệ bộ phận kỹ thuật (có thể database chưa được cập nhật
          bản mới).
        </p>
        {error.digest ? <p className="font-mono text-xs text-muted">Mã lỗi: {error.digest}</p> : null}
        <button
          onClick={() => retry()}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark"
        >
          <RotateCw aria-hidden className="size-5" /> Thử lại
        </button>
      </div>
    </div>
  );
}
