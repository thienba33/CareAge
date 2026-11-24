import { AppButton, ErrorState, LoadingOverlay, LoadingScreen } from "../../components/common";
import {
  useSubject,
  useHealthProfile,
  useMedicalConditions,
  useEmergencyContacts,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useLayoutEffect } from "react";
import { Animated, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ElderlyHealthRecord } from "../../components/caregiver";
import { colors, typography } from "../../theme/colors";
import { followedLabel } from "../../constants/caregiver";
import type { MainStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<MainStackParamList, "ElderlyDetail">;

// Hồ sơ sức khỏe của người cao tuổi đang được xem — người thân chỉ xem, không sửa.
export default function ElderlyDetailScreen({ navigation }: Props) {
  const { subject, linkedElderly } = useSubject();
  const { profile, isLoading, error, reload } = useHealthProfile();
  const { conditions, reload: reloadConditions } = useMedicalConditions();
  const { contacts, reload: reloadContacts } = useEmergencyContacts();
  const pullToRefresh = usePullToRefresh(
    useCallback(() => Promise.all([reload(), reloadConditions(), reloadContacts()]), [reload, reloadConditions, reloadContacts])
  );

  const link = linkedElderly.find((e) => e.id === subject?.id);

  useLayoutEffect(() => {
    navigation.setOptions({ title: subject?.name ?? "Hồ sơ" });
  }, [navigation, subject?.name]);

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={styles.content} {...pullToRefresh.scrollProps}>
          {link ? (
            <View style={styles.card}>
              <Text style={styles.name}>{link.name}</Text>
              <Text style={styles.meta}>
                {link.relationship ? `${followedLabel(link)} của bạn` : "Bệnh nhân"} · Mã {link.code}
              </Text>
              {link.phone ? (
                <AppButton
                  title={`Gọi ${link.phone}`}
                  icon="call"
                  size="lg"
                  onPress={() => Linking.openURL(`tel:${link.phone}`)}
                  style={styles.callButton}
                />
              ) : null}
            </View>
          ) : null}

          <ElderlyHealthRecord profile={profile} conditions={conditions} contacts={contacts} />

          <Text style={styles.footnote}>Thông tin do người cao tuổi và nhân viên y tế cập nhật. Bạn chỉ có quyền xem.</Text>
        </ScrollView>
      </Animated.View>
      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { gap: 8, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  name: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  meta: { fontSize: typography.body, color: colors.textMuted },
  callButton: { marginTop: 4 },
  footnote: { fontSize: typography.caption, fontStyle: "italic", color: colors.textMuted, marginTop: 8 },
});
