import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../../theme/colors";

export type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface AppButtonProps extends Omit<TouchableOpacityProps, "onPress"> {
  title: string;
  onPress?: () => void | Promise<void>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// Component Nút bấm chuẩn hóa CareAge (đáp ứng tiêu chuẩn chạm bấm cho người cao tuổi)
export default function AppButton({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = true,
  style,
  textStyle,
  ...rest
}: AppButtonProps) {
  const isInactive = disabled || loading;

  const handlePress = () => {
    if (isInactive || !onPress) return;
    onPress();
  };

  const getContainerStyle = (): StyleProp<ViewStyle> => {
    const list: StyleProp<ViewStyle>[] = [styles.base, styles[`size_${size}`]];
    if (fullWidth) list.push(styles.fullWidth);
    list.push(styles[`variant_${variant}`]);
    if (disabled) list.push(styles.disabled);
    if (style) list.push(style);
    return list;
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case "primary":
      case "danger":
        return colors.surface;
      case "secondary":
        return colors.primaryDark;
      case "outline":
      case "ghost":
        return colors.primary;
      default:
        return colors.surface;
    }
  };

  const getSpinnerColor = (): string => {
    return getTextColor();
  };

  const iconColor = getTextColor();
  const iconSize = size === "sm" ? 18 : size === "md" ? 20 : 22;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      activeOpacity={0.8}
      disabled={isInactive}
      onPress={handlePress}
      style={getContainerStyle()}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === "left" ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
          ) : null}
          <Text style={[styles.text, styles[`textSize_${size}`], { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === "right" ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  // Kích thước nút
  size_sm: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  size_md: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  size_lg: {
    minHeight: 56, // Tiêu chuẩn 56px cho người già
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  // Kích thước chữ
  textSize_sm: {
    fontSize: 14,
    fontWeight: "700",
  },
  textSize_md: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  textSize_lg: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  // Biến thể màu sắc
  variant_primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  variant_secondary: {
    backgroundColor: colors.primaryLight,
  },
  variant_danger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  variant_outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  variant_ghost: {
    backgroundColor: "transparent",
  },
  // Trạng thái mờ khi bị khóa
  disabled: {
    opacity: 0.55,
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
    borderColor: colors.border,
  },
  text: {
    textAlign: "center",
  },
});
