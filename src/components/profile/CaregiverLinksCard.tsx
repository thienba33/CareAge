import { useLinkedCaregivers } from "../../hooks";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { RELATIONSHIP_LABEL } from "../../constants/caregiver";
import { alertError } from "../../utils/alertError";
import InviteCodeModal from "../caregiver/InviteCodeModal";

// Phía người cao tuổi: ai đang theo dõi mình, mời thêm người thân, gỡ liên kết.
export default function CaregiverLinksCard() {
  const { caregivers, revoke, reload } = useLinkedCaregivers();
  const [inviteVisible, setInviteVisible] = useState(false);

  const confirmRevoke = (linkId: string, name: string) => {
    Alert.alert(
      "Gỡ người thân?",
      `${name} sẽ không còn xem được thông tin sức khỏe của bạn.`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Gỡ", style: "destructive", onPress: () => revoke(linkId).catch((e) => alertError(e)) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="people" size={22} color={colors.primary} />
        <Text style={styles.title}>Người thân theo dõi</Text>
      </View>

      {caregivers.length === 0 ? (
        <Text style={styles.muted}>Chưa có người thân nào. Mời người thân để họ theo dõi sức khỏe của bạn.</Text>
      ) : (
        caregivers.map((c) => (
          <View key={c.linkId} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.meta}>{RELATIONSHIP_LABEL[c.relationship]}</Text>
            </View>
            {c.phone ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => Linking.openURL(`tel:${c.phone}`)}
                accessibilityRole="button"
                accessibilityLabel={`Gọi ${c.name}`}
              >
                <Ionicons name="call" size={22} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => confirmRevoke(c.linkId, c.name)}
              accessibilityRole="button"
              accessibilityLabel={`Gỡ ${c.name}`}
            >
              <Ionicons name="person-remove-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.inviteButton} onPress={() => setInviteVisible(true)} activeOpacity={0.85} accessibilityRole="button">
        <Ionicons name="person-add" size={22} color={colors.surface} />
        <Text style={styles.inviteText}>Mời người thân</Text>
      </TouchableOpacity>

      <InviteCodeModal
        visible={inviteVisible}
        onClose={() => {
          setInviteVisible(false);
          reload(); // người thân có thể vừa nhập mã
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  muted: { fontSize: typography.body, lineHeight: 26, color: colors.textMuted },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { flex: 1 },
  name: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: colors.background },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  inviteText: { fontSize: typography.body, fontWeight: "800", color: colors.surface },
});
