import { AppButton } from "../common";
import { useNow } from "../../hooks";
import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Share, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { caregiverService, type LinkInvite } from "../../services";

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Người cao tuổi tạo mã mời 6 số để người thân nhập. Mã hết hạn sau 15 phút.
export default function InviteCodeModal({ visible, onClose }: Props) {
  const [invite, setInvite] = useState<LinkInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const now = useNow(1000);

  const create = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    try {
      setInvite(await caregiverService.createInvite());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được mã. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  }, []);

  useEffect(() => {
    if (visible) create();
    else setInvite(null);
  }, [visible, create]);

  const secondsLeft = invite ? Math.max(0, Math.floor((new Date(invite.expiresAt).getTime() - now.getTime()) / 1000)) : 0;
  const isExpired = !!invite && secondsLeft === 0;
  const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const share = () => {
    if (!invite) return;
    Share.share({
      message: `Mã liên kết CareAge của tôi: ${invite.code} (hiệu lực 15 phút). Mở CareAge → Người thân → Nhập mã liên kết.`,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Mời người thân theo dõi</Text>
          <Text style={styles.text}>
            Đọc hoặc gửi mã này cho người thân. Người thân mở CareAge → Người thân → "Nhập mã liên kết".
          </Text>

          {/* Hiển thị mã mời */}
          <View
            style={styles.codeBox}
            accessible
            accessibilityLabel={invite ? `Mã liên kết ${invite.code.split("").join(" ")}` : "Đang tạo mã"}
          >
            {isCreating ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : invite && !isExpired ? (
              <Text style={styles.code}>{invite.code.slice(0, 3)} {invite.code.slice(3)}</Text>
            ) : (
              <Text style={styles.expired}>{error ?? "Mã đã hết hạn"}</Text>
            )}
          </View>

          {invite && !isExpired ? (
            <Text style={styles.countdown}>Còn hiệu lực {countdown}</Text>
          ) : null}

          {/* Nút hành động: chia sẻ hoặc tạo lại */}
          {invite && !isExpired ? (
            <AppButton
              title="Gửi mã qua tin nhắn / Zalo"
              onPress={share}
              variant="outline"
              size="md"
              icon="share-social"
            />
          ) : (
            <AppButton
              title="Tạo mã mới"
              onPress={create}
              variant="outline"
              size="md"
              icon="refresh"
              loading={isCreating}
            />
          )}

          <AppButton
            title="Xong"
            onPress={onClose}
            variant="primary"
            size="lg"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { gap: 14, padding: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  text: { fontSize: typography.body, lineHeight: 26, color: colors.textMuted },
  codeBox: {
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },
  code: { fontSize: 44, fontWeight: "800", letterSpacing: 6, color: colors.primaryDark },
  expired: { fontSize: typography.body, fontWeight: "700", color: colors.textMuted },
  countdown: { fontSize: typography.body, fontWeight: "700", color: colors.text, textAlign: "center" },
});
