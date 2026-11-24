import { useAuth, useHealthProfile } from "../../hooks";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import {
  EditHealthProfileModal,
  EditProfileModal,
  CaregiverLinksCard,
  ReminderSettingCard,
} from "../../components/profile";
import type { HealthProfile } from "../../types/healthProfile";

export default function SettingsScreen() {
  const { currentUser, logout, updateProfile } = useAuth();
  const isElderly = currentUser?.role === "ELDERLY";
  const navigation = useNavigation<any>();
  const { profile, updateProfile: updateHealthProfile } = useHealthProfile();

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editHealthVisible, setEditHealthVisible] = useState(false);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          <TouchableOpacity
            style={[styles.row, isElderly && styles.rowDivider]}
            activeOpacity={0.6}
            onPress={() => setEditProfileVisible(true)}
          >
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.rowTitle}>Thông tin cá nhân</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          {isElderly ? (
            <>
          <TouchableOpacity
            style={[styles.row, styles.rowDivider]}
            activeOpacity={0.6}
            onPress={() => setEditHealthVisible(true)}
          >
            <Ionicons name="heart-outline" size={20} color={colors.primary} />
            <Text style={styles.rowTitle}>Hồ sơ sức khỏe</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, ]}
            activeOpacity={0.6}
            onPress={() => navigation.navigate("Conditions")}
          >
            <Ionicons name="medkit-outline" size={20} color={colors.primary} />
            <Text style={styles.rowTitle}>Bệnh nền & Tiền sử</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
            </>
          ) : null}
        </View>

        {isElderly ? <CaregiverLinksCard /> : null}

        {isElderly ? <ReminderSettingCard /> : null}

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.6}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={editProfileVisible}
        user={currentUser}
        onClose={() => setEditProfileVisible(false)}
        onSubmit={async (name: string, phone: string) => {
          await updateProfile({ name, phone });
          setEditProfileVisible(false);
        }}
      />

      <EditHealthProfileModal
        visible={editHealthVisible}
        profile={profile}
        onClose={() => setEditHealthVisible(false)}
        onSubmit={async (input: Omit<HealthProfile, "userId">) => {
          await updateHealthProfile(input);
          setEditHealthVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  group: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { flex: 1, fontSize: typography.body, color: colors.text },
  logoutButton: { alignItems: "center", paddingVertical: 14 },
  logoutText: { color: colors.danger, fontSize: typography.body, fontWeight: "700" },
});
