import { StyleSheet } from "react-native";
import { colors, typography } from "./colors";

export const commonStyles = StyleSheet.create({
  // Khung màn hình nền chuẩn
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenSurface: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Nội dung cuộn — chừa đủ khoảng đệm để không bị menu nổi (floating tab bar) che mất
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110,
  },

  // Hero header chuẩn bo tròn 40px đặc trưng của CareAge
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 64,
    paddingBottom: 44,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  heroCompact: {
    backgroundColor: colors.primary,
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },

  // Tiêu đề chữ trắng trong Hero
  heroTitle: {
    fontSize: typography.h1,
    fontWeight: "800",
    color: colors.surface,
  },
  heroSubtitle: {
    fontSize: typography.caption,
    color: colors.primaryLight,
    marginTop: 4,
  },

  // Khối danh sách nội dung bên dưới
  sections: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  sectionsLoose: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 14,
  },

  // Thẻ nội dung chuẩn bo góc 16px có viền mỏng
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },

  // Thẻ nổi có đổ bóng nhẹ chuẩn thương hiệu CareAge
  cardElevated: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },

  // Khoảng cách ô nhập liệu trong Form
  formField: {
    gap: 8,
  },

  // Nhãn tiêu đề trường nhập form
  formLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.text,
  },

  // Ô nhập liệu chuẩn nền kem nhạt, bo góc 14px, chiều cao tối thiểu 50px
  formInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: "#FAFAF7",
    minHeight: 50,
  },

  // Hộp thông báo lỗi nền đỏ nhạt
  errorBox: {
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // Chữ thông báo lỗi
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "600",
  },
});
