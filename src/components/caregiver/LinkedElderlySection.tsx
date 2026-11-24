import { AppAvatar } from "../common";
import { useSubject } from "../../hooks";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import AcceptInviteModal from "./AcceptInviteModal";
import { colors, typography } from "../../theme/colors";
import { RELATIONSHIP_LABEL, isLinkedElderly } from "../../constants/caregiver";
import { caregiverService } from "../../services";
import { alertError } from "../../utils/alertError";
import type { LinkedElderly } from "../../types/caregiver";

// Mục "Người thân bạn theo dõi" trong Hồ sơ (CAREGIVER): danh sách người cao tuổi, nhập mã liên kết,
// xem hồ sơ, gọi, ngừng theo dõi.
export default function LinkedElderlySection() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { linkedElderly: followed, isLoadingLinks, reloadLinks, select } = useSubject();
  const linkedElderly = followed.filter(isLinkedElderly);
  const [acceptVisible, setAcceptVisible] = useState(false);

  const openDetail = (e: LinkedElderly) => {
    select(e.id);
    navigation.navigate("ElderlyDetail");
  };

  const confirmLeave = (e: LinkedElderly) => {
    Alert.alert("Ngừng theo dõi?", `Bạn sẽ không còn xem được thông tin sức khỏe của ${e.name}.`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Ngừng theo dõi",
        style: "destructive",
        onPress: () =>
          caregiverService
            .revokeLink(e.linkId)
            .then(() => reloadLinks())
            .catch((err) => alertError(err)),
      },
    ]);
  };

  const handleLinked = async (elderlyName: string) => {
    setAcceptVisible(false);
    const result = (await reloadLinks()) as { data?: LinkedElderly[] } | undefined;
    const added = result?.data?.find((e) => e.name === elderlyName);
    if (added) select(added.id);
    queryClient.invalidateQueries({ queryKey: ["caregiverDashboard"] });
    Alert.alert("Đã liên kết", `Bạn đã bắt đầu theo dõi ${elderlyName}.`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="people" size={22} color={colors.primary} />
        <Text style={styles.title}>Người thân bạn theo dõi</Text>
      </View>

      {isLoadingLinks ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : linkedElderly.length === 0 ? (
        <Text style={styles.muted}>
          Chưa theo dõi ai. Nhờ người cao tuổi mở Hồ sơ → "Mời người thân" để lấy mã 6 số, rồi nhập mã bên dưới.
        </Text>
      ) : (
        <View>
          {linkedElderly.map((e, index) => {
            return (
              <View key={e.id} style={[styles.row, index > 0 && styles.rowDivider]}>
                <TouchableOpacity
                  style={styles.rowMain}
                  onPress={() => openDetail(e)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`${e.name}, ${RELATIONSHIP_LABEL[e.relationship]}. Xem hồ sơ`}
                >
                  <AppAvatar
                    name={e.name}
                    size={44}
                    variant="primaryLight"
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={styles.meta}>{RELATIONSHIP_LABEL[e.relationship]}</Text>
                  </View>
                </TouchableOpacity>
                {e.phone ? (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => Linking.openURL(`tel:${e.phone}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Gọi ${e.name}`}
                  >
                    <Ionicons name="call" size={22} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => confirmLeave(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ngừng theo dõi ${e.name}`}
                >
                  <Ionicons name="person-remove-outline" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.linkButton} onPress={() => setAcceptVisible(true)} activeOpacity={0.85} accessibilityRole="button">
        <Ionicons name="keypad" size={22} color={colors.surface} />
        <Text style={styles.linkText}>Nhập mã liên kết</Text>
      </TouchableOpacity>

      <AcceptInviteModal visible={acceptVisible} onClose={() => setAcceptVisible(false)} onLinked={handleLinked} />
    </View>
  );
}

// Cùng kiểu với CaregiverLinksCard (Hồ sơ người cao tuổi) để hai phía nhìn thống nhất.
const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  loader: { marginVertical: 12 },
  muted: { fontSize: typography.body, lineHeight: 26, color: colors.textMuted },
  row: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 },

  rowText: { flex: 1, gap: 2 },
  name: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: colors.background },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  linkText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
