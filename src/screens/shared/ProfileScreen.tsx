import { LinkedElderlySection } from "../../components/caregiver";
import {
  AppAvatar,
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
} from "../../components/common";
import {
  usePullToRefresh,
  useAuth,
  useHealthProfile,
  useEmergencyContacts,
  useMedicalConditions,
  useLinkedCaregivers,
  useSubject,
} from "../../hooks";
import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";

import { BLOOD_TYPE_LABEL } from "../../constants/healthProfile";
import { HealthTile } from "../../components/profile";
import {
  CONDITION_CATEGORIES,
  CONDITION_CATEGORY_LABEL,
  CONDITION_STATUS_COLOR,
  CONDITION_STATUS_LABEL,
} from "../../constants/medicalCondition";
import { calculateAge, calculateBmi } from "../../utils/healthProfile";

export default function ProfileScreen() {
  const { currentUser } = useAuth();
  const isElderly = currentUser?.role === "ELDERLY";
  const isCaregiver = currentUser?.role === "CAREGIVER";
  const { reloadLinks } = useSubject();

  const {
    profile,
    isLoading: isLoadingProfile,
    error: profileError,
    reload: reloadProfile,
  } = useHealthProfile();
  const { contacts, reload: reloadContacts } = useEmergencyContacts();
  const { reload: reloadCaregivers } = useLinkedCaregivers();
  const { conditions, reload: reloadConditions } = useMedicalConditions();
  const navigation = useNavigation<any>();

  const pullToRefresh = usePullToRefresh(
    useCallback(
      () =>
        Promise.all([
          reloadProfile(),
          reloadContacts(),
          reloadConditions(),
          reloadCaregivers(),
          isElderly ? undefined : reloadLinks(),
        ]),
      [reloadProfile, reloadContacts, reloadConditions, reloadCaregivers, isElderly, reloadLinks]
    )
  );

  if (profileError) {
    return <ErrorState message={profileError} onRetry={reloadProfile} />;
  }

  if (isLoadingProfile) {
    return <LoadingScreen />;
  }

  const age = calculateAge(profile?.dateOfBirth);
  const bmi = calculateBmi(profile?.heightCm, profile?.weightKg);

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          {...pullToRefresh.scrollProps}
        >
          <View style={commonStyles.heroCompact}>
            <HeroBlobs />

            {navigation.canGoBack() ? (
              <View style={styles.backRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Quay lại"
                >
                  <Ionicons name="arrow-back" size={22} color={colors.surface} />
                </TouchableOpacity>
                <Text style={styles.backTitle}>Hồ sơ cá nhân</Text>
                <View style={{ width: 40 }} />
              </View>
            ) : null}

            <View style={styles.heroRow}>
              <AppAvatar
                name={currentUser?.name}
                size="xl"
                variant="surface"
              />
              <View style={styles.heroInfo}>
                <View style={styles.heroNameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {currentUser?.name}
                  </Text>
                  {isElderly && profile?.gender ? (
                    <Ionicons
                      name={profile.gender === "MALE" ? "male" : "female"}
                      size={16}
                      color={profile.gender === "MALE" ? "#93C5FD" : "#F9A8D4"}
                    />
                  ) : null}
                </View>
                <View style={styles.heroContact}>
                  <Ionicons name="mail-outline" size={16} color={colors.surface} />
                  <Text style={styles.heroContactText} numberOfLines={1}>
                    {currentUser?.email}
                  </Text>
                </View>
                <View style={styles.heroContact}>
                  <Ionicons name="call-outline" size={16} color={colors.surface} />
                  <Text style={styles.heroContactText} numberOfLines={1}>
                    {currentUser?.phone || "Chưa cập nhật"}
                  </Text>
                </View>
                {isElderly && profile?.address ? (
                  <View style={styles.heroContact}>
                    <Ionicons name="location-outline" size={16} color={colors.surface} />
                    <Text style={styles.heroContactText} numberOfLines={2}>
                      {profile.address}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("Settings")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={18} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.sections}>
            {isElderly ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Hồ sơ sức khỏe</Text>
                </View>

                {/* Hàng 1: 3 tile */}
                <View style={styles.grid}>
                  <HealthTile icon="calendar-outline" label="Tuổi" value={age !== null ? `${age}` : "--"} />
                  <HealthTile icon="water-outline" label="Nhóm máu" value={profile?.bloodType ? BLOOD_TYPE_LABEL[profile.bloodType] : "--"} />
                  <HealthTile icon="fitness-outline" label="BMI" value={bmi !== null ? bmi.toFixed(1) : "--"} />
                </View>

                {/* Hàng 2: 2 tile rộng — chiều cao & cân nặng */}
                <View style={styles.gridWide}>
                  <HealthTile wide icon="resize-outline" label="Chiều cao" value={profile?.heightCm ? `${profile.heightCm} cm` : "--"} />
                  <HealthTile wide icon="scale-outline" label="Cân nặng" value={profile?.weightKg ? `${profile.weightKg} kg` : "--"} />
                </View>

{/* Bệnh nền & Tiền sử — kiểu iOS grouped list */}
                {CONDITION_CATEGORIES.map((cat) => {
                  const items = conditions.filter((c) => c.category === cat);
                  const meta = CATEGORY_ICON[cat];
                  return (
                    <View key={cat}>
                      {/* Section label nhỏ phía trên card */}
                      <View style={styles.iosLabelRow}>
                        <Ionicons name={meta.icon} size={13} color={colors.textMuted} />
                        <Text style={styles.iosLabel}>
                          {CONDITION_CATEGORY_LABEL[cat as keyof typeof CONDITION_CATEGORY_LABEL].toUpperCase()}
                        </Text>
                      </View>

                      {/* Card trắng chứa các row */}
                      <View style={styles.iosCard}>
                        {items.length === 0 ? (
                          <View style={styles.iosRow}>
                            <Text style={styles.iosEmpty}>Chưa có mục nào</Text>
                          </View>
                        ) : (
                          items.map((condition, index) => (
                            <View
                              key={condition.id}
                              style={[
                                styles.iosRow,
                                index !== items.length - 1 && styles.iosRowDivider,
                              ]}
                            >
                              <View style={styles.iosRowMain}>
                                <Text style={styles.iosRowTitle}>{condition.name}</Text>
                                {condition.note ? (
                                  <Text style={styles.iosRowSub} numberOfLines={1}>
                                    {condition.note}
                                  </Text>
                                ) : null}
                              </View>
                              <View
                                style={[
                                  styles.statusPill,
                                  {
                                    backgroundColor: `${CONDITION_STATUS_COLOR[condition.status as keyof typeof CONDITION_STATUS_COLOR]}1A`,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusText,
                                    { color: CONDITION_STATUS_COLOR[condition.status as keyof typeof CONDITION_STATUS_COLOR] },
                                  ]}
                                >
                                  {CONDITION_STATUS_LABEL[condition.status as keyof typeof CONDITION_STATUS_LABEL]}
                                </Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={styles.emergencyCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("Emergency")}
                >
                  <View style={styles.emergencyIcon}>
                    <Ionicons name="people" size={20} color={colors.danger} />
                  </View>
                  <View style={styles.emergencyTextCol}>
                    <Text style={styles.emergencyTitle}>Người nhận thông báo khẩn cấp</Text>
                    <Text style={styles.emergencyMeta}>
                      {contacts.length > 0
                        ? contacts.map((c) => c.name).join(", ")
                        : "Chưa có ai được thêm"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            ) : null}

            {isCaregiver ? <LinkedElderlySection /> : null}
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

// ─── Icon nhỏ cho từng category ─────────────────────────────────────────────
const CATEGORY_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap }> = {
  CHRONIC: { icon: "heart-outline" },
  HISTORY: { icon: "time-outline" },
  ALLERGY: { icon: "alert-circle-outline" },
};

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  backTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.surface,
  },

  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingRight: 40 },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroInfo: { flex: 1, gap: 4 },
  heroContact: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroContactText: { flexShrink: 1, fontSize: typography.caption, color: colors.surface },

  name: { fontSize: typography.h2, fontWeight: "800", color: colors.surface },
  editButton: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  sections: { paddingHorizontal: 20, marginTop: 20, gap: 4 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 10,
  },
  sectionHeading: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridWide: { flexDirection: "row", gap: 10, marginBottom: 10 },

  // ── iOS-style grouped list ──────────────────────────────────────────────────
  iosLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  iosLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  iosCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  iosRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 52,
  },
  iosRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iosRowMain: { flex: 1, gap: 3 },
  iosRowTitle: { fontSize: typography.body, fontWeight: "600", color: colors.text },
  iosRowSub: { fontSize: typography.caption, color: colors.textMuted },
  iosEmpty: { fontSize: typography.body, color: colors.textMuted },

  // ── Status pill ─────────────────────────────────────────────────────────────
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: "700" },

  // ── Emergency card ─────────────────────────────────────────────────────────
  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyTextCol: { flex: 1, gap: 2 },
  emergencyTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  emergencyMeta: { fontSize: typography.caption, color: colors.textMuted },
});
