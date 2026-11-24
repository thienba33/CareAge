// Tiền tố danh xưng y khoa và học hàm/học vị thường gặp (hỗ trợ cả dạng ghép như PGS.TS., BS.CKI, ThS.BS.)
const TITLE_PREFIX = /^((gs|pgs|ts|ths|bs|bscki{1,2}|bsck1|bsck2|cki{1,2}|ck1|ck2|đd|dd|ktv|bác sĩ|bác si|dược sĩ|duoc si|điều dưỡng|dieu duong)[\.\s]+)+/i;


// Xóa danh xưng y khoa tiền tố ("BS. Nguyễn Văn A" → "Nguyễn Văn A")
export function stripTitle(name?: string | null): string {
  if (!name) return "";
  return name.trim().replace(TITLE_PREFIX, "").trim();
}

// Chuẩn hóa tìm kiếm không dấu ("Đỗ Thị Mơ" → "do thi mo")
export function normalizeSearchText(text?: string | null): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

export interface GetInitialsOptions {
  takeLastWord?: boolean;
}

// Lấy chữ cái đại diện tên chính tiếng Việt ("BS. Nguyễn Văn Tám" → "T")
export function getInitials(name?: string | null, options?: GetInitialsOptions): string {
  if (!name || typeof name !== "string") return "?";

  const rawClean = name.trim();
  if (!rawClean) return "?";

  const cleaned = stripTitle(rawClean) || rawClean;
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  const takeLast = options?.takeLastWord !== false;
  const targetWord = takeLast ? words[words.length - 1] : words[0];

  return targetWord.charAt(0).toUpperCase() || "?";
}
