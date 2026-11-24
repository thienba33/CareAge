import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mặc định ".next". Có thể build ra thư mục khác (vd. NEXT_DIST_DIR=.next-check) để kiểm tra
  // mà không đụng vào thư mục của `npm run dev` đang chạy.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Repo có 2 package-lock (app Expo ở gốc, web ở đây) — chỉ định rõ gốc của web.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
