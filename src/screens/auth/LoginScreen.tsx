import { AppButton, PasswordInput } from "../../components/common";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
import { useAuth } from "../../hooks";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login, isAuthenticating } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }
    try {
      await login({ email, password });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng nhập thất bại.");
    }
  };

  return (
    <AuthScreenLayout>
      <AuthHeroHeader subtitle="Đăng nhập để tiếp tục chăm sóc người thân" />

      <AuthCard>
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
            placeholder="email@vidu.vn"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
          />
        </View>

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
          <TouchableOpacity
            style={styles.forgotLinkWrap}
            onPress={() => navigation.navigate("ForgotPassword")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={commonStyles.errorBox}>
            <Text style={commonStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppButton
          title="Đăng nhập"
          onPress={handleSubmit}
          loading={isAuthenticating}
          size="lg"
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert("Sắp ra mắt", "Đăng nhập bằng Google sẽ sớm được hỗ trợ.")
          }
        >
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
        </TouchableOpacity>
      </AuthCard>

      <AuthFooterLink
        prompt="Chưa có tài khoản?"
        actionText="Đăng ký ngay"
        onPress={() => navigation.navigate("Register")}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotLinkWrap: { alignSelf: "flex-end", marginTop: 6 },
  forgotLink: { fontSize: typography.caption, color: colors.primaryDark, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: -2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: typography.caption, color: colors.textMuted, fontWeight: "600" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  googleButtonText: { fontSize: typography.body, fontWeight: "700", color: colors.text },
});
