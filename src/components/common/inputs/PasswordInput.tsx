import React, { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../../theme/colors";

export interface PasswordInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

// Component Ô nhập mật khẩu có nút con mắt ẩn/hiện và xử lý focus/lỗi chuẩn CareAge
export default function PasswordInput({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  placeholder = "Nhập mật khẩu",
  ...rest
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps["onFocus"] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps["onBlur"] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Xác định màu viền theo trạng thái lỗi và focus
  let borderColor = colors.border;
  if (error) {
    borderColor = colors.danger;
  } else if (isFocused) {
    borderColor = colors.primary;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, { borderColor }]}>
        <TextInput
          style={[styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={isFocused ? colors.primaryDark : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: "#FAFAF7",
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: typography.body,
    color: colors.text,
  },
  toggleButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderRadius: 999,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "600",
    marginTop: 2,
  },
});
