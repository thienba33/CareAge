import { AppButton, PasswordInput } from "../../components/common";
import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import {
  AuthScreenLayout,
  AuthHeroHeader,
  AuthCard,
  AuthRolePicker,
  AuthFooterLink,
} from "../../components/auth";
import { useAuth } from "../../hooks";
import type { Role } from "../../types/auth";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register, isAuthenticating } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ELDERLY");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      return;
    }
    try {
      const result = await register({ name, email, phone, password, role });
      if (result.status === "NEEDS_EMAIL_CONFIRMATION") {
        Alert.alert(
          "Đăng ký thành công",
          `Vui lòng mở email ${email.trim()} và bấm vào liên kết xác nhận, sau đó đăng nhập.`,
          [{ text: "Đến trang đăng nhập", onPress: () => navigation.navigate("Login") }]
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng ký thất bại.");
    }
  };

  return (
    <AuthScreenLayout>
      <AuthHeroHeader
        title="Tạo tài khoản"
        subtitle="Đăng ký để bắt đầu sử dụng CareAge"
        onBack={() => navigation.goBack()}
      />

      <AuthCard>
        {/* Họ và tên */}
        <View style={commonStyles.formField}>
          <Text style={commonStyles.formLabel}>Họ và tên</Text>
          <TextInput
            style={commonStyles.formInput}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
            placeholder="Nguyễn Văn A"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
          />
        </View>

        {/* Email */}
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
            returnKeyType="next"
          />
        </View>

        {/* Số điện thoại */}
        <View style={commonStyles.formField}>
          <Text style={commonStyles.formLabel}>Số điện thoại</Text>
          <TextInput
            style={commonStyles.formInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="09xxxxxxxx"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
          />
        </View>

        {/* Mật khẩu */}
        <View style={commonStyles.formField}>
          <PasswordInput
            label="Mật khẩu"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            placeholder="••••••"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* Vai trò */}
        <AuthRolePicker value={role} onChange={setRole} />

        {/* Thông báo lỗi */}
        {error ? (
          <View style={commonStyles.errorBox}>
            <Text style={commonStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Nút đăng ký */}
        <AppButton
          title="Đăng ký"
          onPress={handleSubmit}
          loading={isAuthenticating}
          size="lg"
        />
      </AuthCard>

      <AuthFooterLink
        prompt="Đã có tài khoản?"
        actionText="Đăng nhập"
        onPress={() => navigation.navigate("Login")}
      />
    </AuthScreenLayout>
  );
}
