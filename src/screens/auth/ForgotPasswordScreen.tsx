import { AppButton } from "../../components/common";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import {
  AuthScreenLayout,
  AuthHeroHeader,
  AuthCard,
  AuthFooterLink,
} from "../../components/auth";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Vui lòng nhập email đã đăng ký.");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout>
      <AuthHeroHeader
        title="Quên mật khẩu?"
        subtitle="Nhập email đã đăng ký của bạn"
        onBack={() => navigation.goBack()}
      />

      <AuthCard>
        {sent ? (
          /* Trạng thái gửi thành công */
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.successTitle}>Đã gửi email!</Text>
            <Text style={styles.successText}>
              Kiểm tra hộp thư {email.trim()} để làm theo hướng dẫn đặt lại mật khẩu.
            </Text>
            <AppButton
              title="Quay lại đăng nhập"
              onPress={() => navigation.navigate("Login")}
              size="lg"
            />
          </View>
        ) : (
          <>
            {/* Ô nhập email */}
            <View style={commonStyles.formField}>
              <Text style={commonStyles.formLabel}>Email</Text>
              <TextInput
                style={commonStyles.formInput}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="email@careage.vn"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {/* Thông báo lỗi */}
            {error ? (
              <View style={commonStyles.errorBox}>
                <Text style={commonStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Nút gửi email */}
            <AppButton
              title="Gửi email"
              onPress={handleSubmit}
              loading={isSubmitting}
              size="lg"
              icon="mail-outline"
            />
          </>
        )}
      </AuthCard>

      <AuthFooterLink
        prompt="Nhớ mật khẩu rồi?"
        actionText="Đăng nhập"
        onPress={() => navigation.navigate("Login")}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  successBox: { alignItems: "center", gap: 10 },
  successTitle: { fontSize: typography.h2, fontWeight: "800", color: colors.text, marginTop: 4 },
  successText: {
    fontSize: typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
});
