import {
  AppAvatar,
  AppButton,
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
} from "../../components/common";
import {
  useAuth,
  useSubject,
  useStaffProfile,
  useFormerPatients,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import EditProfileModal from "../../components/profile/EditProfileModal";
import { EditStaffProfileModal } from "../../components/staff";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { ACADEMIC_TITLE_LABEL, DEGREE_LABEL } from "../../constants/staff";
import { formatDoctorName, stripTitle } from "../../utils/staff";

// Tab "Hồ sơ" của bác sĩ: danh tính + liên hệ, số bệnh nhân, thông tin chuyên môn, nơi làm việc, giới thiệu.
export default function StaffProfileScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, logout, updateProfile } = useAuth();
  const { linkedElderly, reloadLinks } = useSubject();
  const { profile, isLoading, error, reload, save } = useStaffProfile();
  const { formerPatients, reload: reloadFormer } = useFormerPatients();
  const [editAccountVisible, setEditAccountVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const pullToRefresh = usePullToRefresh(
    useCallback(() => Promise.all([reload(), reloadLinks(), reloadFormer()]), [reload, reloadLinks, reloadFormer])
  );

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  const name = currentUser?.name ?? "";
  const displayName = formatDoctorName(name, profile?.academicTitle, profile?.degree);
  const isEmpty = !profile?.degree && !profile?.specialty && !profile?.department && !profile?.bio;
  const degreeText = [
    profile?.academicTitle ? ACADEMIC_TITLE_LABEL[profile.academicTitle] : null,
    profile?.degree ? DEGREE_LABEL[profile.degree] : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={commonStyles.scrollContent} showsVerticalScrollIndicator={false} {...pullToRefresh.scrollProps}>
          <View style={[commonStyles.hero, { paddingBottom: 52 }]}>
            <HeroBlobs />
            <View style={styles.heroRow}>
              <AppAvatar name={name} size={64} variant="surface" />
              <View style={styles.heroInfo}>
                <Text style={styles.name} numberOfLines={2}>
                  {displayName}
                </Text>
                {profile?.specialty ? <Text style={styles.specialty}>{profile.specialty}</Text> : null}
                <HeroLine icon="mail-outline" text={currentUser?.email ?? ""} />
                <HeroLine icon="call-outline" text={currentUser?.phone || "Chưa cập nhật"} />
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditAccountVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Sửa họ tên, số điện thoại"
            >
              <Ionicons name="pencil" size={16} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <Stat value={linkedElderly.length} label="Đang phụ trách" onPress={() => navigation.navigate("Main", { screen: "Patients" })} />
            <View style={styles.statDivider} />
            <Stat value={formerPatients.length} label="Cựu bệnh nhân" onPress={() => navigation.navigate("FormerPatients")} />
          </View>

          <View style={styles.sections}>
            {isEmpty ? (
              <TouchableOpacity style={styles.completeCard} onPress={() => setEditProfileVisible(true)} activeOpacity={0.85}>
                <Ionicons name="id-card-outline" size={28} color={colors.primary} />
                <View style={styles.flexText}>
                  <Text style={styles.completeTitle}>Hoàn thiện hồ sơ chuyên môn</Text>
                  <Text style={styles.muted}>Bệnh nhân và người nhà sẽ thấy học vị, chuyên khoa, phòng khám của bạn khi đặt lịch.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}

            <Section title="Thông tin chuyên môn" icon="school-outline" onEdit={() => setEditProfileVisible(true)}>
              <InfoRow label="Học hàm, học vị" value={degreeText} />
              <InfoRow label="Chuyên khoa" value={profile?.specialty} />
              <InfoRow
                label="Kinh nghiệm"
                value={profile?.yearsExperience !== undefined ? `${profile.yearsExperience} năm` : undefined}
              />
              <InfoRow label="Chứng chỉ hành nghề" value={profile?.licenseNumber} isLast />
            </Section>

            <Section title="Nơi làm việc" icon="business-outline" onEdit={() => setEditProfileVisible(true)}>
              <InfoRow label="Cơ sở y tế" value={profile?.workplace} />
              <InfoRow label="Khoa" value={profile?.department} />
              <InfoRow label="Phòng khám" value={profile?.room} />
              <InfoRow
                label="Hotline"
                value={profile?.workplacePhone}
                onPress={
                  profile?.workplacePhone
                    ? () => Linking.openURL(`tel:${profile.workplacePhone!.replace(/\s/g, "")}`)
                    : undefined
                }
              />
              <InfoRow label="Giờ làm việc" value={profile?.workingHours} isLast />
            </Section>

            <Section title="Giới thiệu" icon="person-outline" onEdit={() => setEditProfileVisible(true)}>
              <Text style={profile?.bio ? styles.bio : styles.muted}>{profile?.bio || "Chưa có giới thiệu."}</Text>
            </Section>

            <AppButton
              title="Đăng xuất"
              icon="log-out-outline"
              variant="outline"
              onPress={logout}
              style={styles.logoutButton}
              textStyle={{ color: colors.danger }}
            />
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <EditProfileModal
        visible={editAccountVisible}
        user={currentUser}
        onClose={() => setEditAccountVisible(false)}
        onSubmit={async (newName, phone) => {
          await updateProfile({ name: newName, phone });
          setEditAccountVisible(false);
        }}
      />
      <EditStaffProfileModal
        visible={editProfileVisible}
        profile={profile}
        onClose={() => setEditProfileVisible(false)}
        onSubmit={async (input) => {
          await save(input);
          setEditProfileVisible(false);
        }}
      />
    </View>
  );
}

function HeroLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.heroLine}>
      <Ionicons name={icon} size={15} color={colors.primaryLight} />
      <Text style={styles.heroLineText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Stat({ value, label, onPress }: { value: number; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.stat} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity onPress={onEdit} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Sửa ${title.toLowerCase()}`}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value, isLast, onPress }: { label: string; value?: string; isLast?: boolean; onPress?: () => void }) {
  const content = (
    <>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, !value && styles.infoEmpty, onPress && styles.infoLink]}>{value || "Chưa cập nhật"}</Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.infoRow, !isLast && styles.divider]} onPress={onPress} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.infoRow, !isLast && styles.divider]}>{content}</View>;
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingRight: 36 },
  heroInfo: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: typography.h2, fontWeight: "800", color: colors.surface },
  specialty: { fontSize: typography.body, fontWeight: "700", color: colors.primaryLight },
  heroLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroLineText: { flex: 1, fontSize: typography.caption, color: colors.surface },
  editButton: {
    position: "absolute",
    top: 64,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: -30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  stat: { flex: 1, alignItems: "center", gap: 2, minHeight: 52, justifyContent: "center" },
  statValue: { fontSize: typography.h1, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  statDivider: { width: 1, alignSelf: "stretch", marginVertical: 6, backgroundColor: colors.border },
  sections: { gap: 14, paddingHorizontal: 20, marginTop: 20 },
  completeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  completeTitle: { fontSize: typography.body, fontWeight: "800", color: colors.text },
  flexText: { flex: 1, gap: 2 },
  card: { gap: 4, padding: 16, borderRadius: 18, backgroundColor: colors.surface },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: typography.body, fontWeight: "800", color: colors.text },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: typography.caption, color: colors.textMuted, paddingTop: 2 },
  infoValue: { flexShrink: 1, fontSize: typography.body, fontWeight: "700", color: colors.text, textAlign: "right" },
  infoEmpty: { fontWeight: "400", fontStyle: "italic", color: colors.textMuted },
  infoLink: { color: colors.primary },
  bio: { fontSize: typography.body, lineHeight: 26, color: colors.text },
  muted: { fontSize: typography.caption, color: colors.textMuted },
  logoutButton: {
    marginTop: 8,
    borderColor: colors.danger,
  },
});
