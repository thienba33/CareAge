import React, { useState } from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { getInitials } from "../../../utils/text";

export type AvatarSize = "sm" | "md" | "lg" | "xl" | number;
export type AvatarVariant = "primary" | "primaryLight" | "surface" | "muted";
export type AvatarRole = "ELDERLY" | "CAREGIVER" | "MEDICAL_STAFF";

export interface AppAvatarProps {
  name?: string | null;
  imageUri?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: AvatarSize;
  variant?: AvatarVariant;
  role?: AvatarRole;
  badgeColor?: string;
  badgeNode?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// Bảng quy đổi kích thước avatar
const SIZE_MAP: Record<"sm" | "md" | "lg" | "xl", { size: number; fontSize: number }> = {
  sm: { size: 32, fontSize: 13 },
  md: { size: 48, fontSize: 18 },
  lg: { size: 56, fontSize: 22 },
  xl: { size: 76, fontSize: 28 },
};

// Bảng icon theo vai trò
const ROLE_ICON_MAP: Record<AvatarRole, keyof typeof Ionicons.glyphMap> = {
  MEDICAL_STAFF: "medkit",
  CAREGIVER: "heart",
  ELDERLY: "person",
};

// Component Avatar chuẩn hóa CareAge
export default function AppAvatar({
  name,
  imageUri,
  icon,
  size = "md",
  variant = "primaryLight",
  role,
  badgeColor,
  badgeNode,
  style,
  textStyle,
}: AppAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Tính toán kích thước số thực tế
  let pixelSize = 48;
  let fontSize = 18;

  if (typeof size === "number") {
    pixelSize = size;
    fontSize = Math.round(size * 0.38);
  } else if (SIZE_MAP[size]) {
    pixelSize = SIZE_MAP[size].size;
    fontSize = SIZE_MAP[size].fontSize;
  }

  const borderRadius = Math.round(pixelSize / 2);
  const initials = getInitials(name || "");
  const hasImage = Boolean(imageUri) && !imageError;

  // Lấy màu nền và màu chữ
  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: colors.primary, text: colors.surface };
      case "surface":
        return { bg: colors.surface, text: colors.primaryDark };
      case "muted":
        return { bg: colors.border, text: colors.textMuted };
      case "primaryLight":
      default:
        return { bg: colors.primaryLight, text: colors.primaryDark };
    }
  };

  const colorScheme = getColors();
  const badgeSize = Math.max(16, Math.round(pixelSize * 0.36));

  return (
    <View style={[styles.wrapper, { width: pixelSize, height: pixelSize }, style]}>
      <View
        style={[
          styles.container,
          {
            width: pixelSize,
            height: pixelSize,
            borderRadius,
            backgroundColor: colorScheme.bg,
          },
        ]}
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUri! }}
            style={[styles.image, { borderRadius }]}
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <Text
            style={[
              styles.initialsText,
              { fontSize, color: colorScheme.text },
              textStyle,
            ]}
          >
            {initials}
          </Text>
        ) : (
          <Ionicons
            name={icon || "person"}
            size={Math.round(pixelSize * 0.55)}
            color={colorScheme.text}
          />
        )}
      </View>

      {/* Hiển thị badge vai trò */}
      {role ? (
        <View
          style={[
            styles.roleBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <Ionicons
            name={ROLE_ICON_MAP[role]}
            size={Math.round(badgeSize * 0.65)}
            color={colors.surface}
          />
        </View>
      ) : null}

      {/* Hiển thị chấm tròn thông báo (Online / Cảnh báo) */}
      {badgeColor && !role ? (
        <View
          style={[
            styles.dotBadge,
            {
              backgroundColor: badgeColor,
              width: Math.max(10, Math.round(pixelSize * 0.22)),
              height: Math.max(10, Math.round(pixelSize * 0.22)),
              borderRadius: pixelSize,
            },
          ]}
        />
      ) : null}

      {/* Phần tử badge tùy chỉnh chèn ngoài (ví dụ nút Camera sửa ảnh) */}
      {badgeNode ? <View style={styles.customBadge}>{badgeNode}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initialsText: {
    fontWeight: "800",
    textAlign: "center",
  },
  roleBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dotBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  customBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
  },
});
