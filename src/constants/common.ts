// Mảng rỗng bất biến dùng chung làm fallback mặc định cho các hooks dữ liệu,
// tránh tạo instance mảng mới ở mỗi file và giữ tham chiếu cố định.
export const EMPTY_ARRAY: never[] = Object.freeze([]) as never[];
