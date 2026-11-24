import { NoLinkedElderlyState } from "../../components/caregiver";
import {
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
} from "../../components/common";
import {
  useSubject,
  useStaffDashboard,
  useFormerPatients,
  useNow,
  usePullToRefresh,
} from "../../hooks";
import React, { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { PatientRow } from "../../components/staff";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import type { StaffDashboardItem } from "../../types/staff";
import { normalizeSearchText } from "../../utils/text";

// Tab "Bệnh nhân" (MEDICAL_STAFF): người cao tuổi được phân công — tìm theo tên / mã, bấm để xem hồ sơ.
export default function PatientsScreen() {
  const navigation = useNavigation<any>();
  const { select, reloadLinks } = useSubject();
  const { items, isLoading, error, reload } = useStaffDashboard();
  const { formerPatients, reload: reloadFormer } = useFormerPatients();
  const [query, setQuery] = useState("");
  const now = useNow();
  const pullToRefresh = usePullToRefresh(useCallback(() => Promise.all([reload(), reloadLinks(), reloadFormer()]), [reload, reloadLinks, reloadFormer]));

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return items;
    return items.filter((p) => normalizeSearchText(p.name).includes(q) || normalizeSearchText(p.code).includes(q));
  }, [items, query]);

  // Không tìm kiếm: chia 2 nhóm — cần chú ý (yêu cầu chờ duyệt / cảnh báo mới) lên trước, rồi những người còn lại.
  const groups = useMemo(() => {
    if (query.trim()) return [{ title: `Kết quả (${filtered.length})`, data: filtered }];
    const needsAttention = (p: StaffDashboardItem) => p.pendingRequests > 0 || p.unreadAlerts > 0;
    return [
      { title: "Cần chú ý", data: filtered.filter(needsAttention) },
      { title: "Tất cả bệnh nhân khác", data: filtered.filter((p) => !needsAttention(p)) },
    ].filter((g) => g.data.length > 0);
  }, [filtered, query]);

  const openPatient = (elderlyId: string) => {
    select(elderlyId);
    navigation.navigate("PatientDetail");
  };

  if (error && items.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...pullToRefresh.scrollProps}
        >
          <View style={commonStyles.hero}>
            <HeroBlobs />
            <Text style={commonStyles.heroTitle}>Thông tin bệnh nhân</Text>
            <Text style={commonStyles.heroSubtitle}>{items.length} người được phân công</Text>
          </View>

          <View style={commonStyles.sections}>
            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <NoLinkedElderlyState />
              </View>
            ) : (
              <>
                <View style={styles.search}>
                  <Ionicons name="search" size={22} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Tìm theo tên hoặc mã (ELD001)"
                    placeholderTextColor={colors.textMuted}
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {query ? (
                    <TouchableOpacity onPress={() => setQuery("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Xoá tìm kiếm">
                      <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {filtered.length === 0 ? (
                  <Text style={styles.emptyText}>Không tìm thấy bệnh nhân phù hợp.</Text>
                ) : (
                  groups.map((group) => (
                    <View key={group.title} style={styles.group}>
                      <Text style={styles.groupTitle}>
                        {group.title}
                        {query.trim() ? "" : ` · ${group.data.length}`}
                      </Text>
                      <View style={styles.list}>
                        {group.data.map((item, i) => (
                          <PatientRow
                            key={item.elderlyId}
                            item={item}
                            now={now}
                            isLast={i === group.data.length - 1}
                            onPress={() => openPatient(item.elderlyId)}
                          />
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* Lối vào danh sách người đã kết thúc theo dõi. */}
            <TouchableOpacity
              style={styles.formerLink}
              onPress={() => navigation.navigate("FormerPatients")}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Ionicons name="archive-outline" size={22} color={colors.textMuted} />
              <Text style={styles.formerText}>Cựu bệnh nhân</Text>
              {formerPatients.length > 0 ? <Text style={styles.formerCount}>{formerPatients.length}</Text> : null}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: typography.body, color: colors.text },
  emptyCard: { borderRadius: 20, backgroundColor: colors.surface },
  group: { gap: 8, marginTop: 4 },
  formerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    marginTop: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  formerText: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  formerCount: { fontSize: typography.body, fontWeight: "800", color: colors.textMuted },
  groupTitle: { fontSize: typography.body, fontWeight: "700", color: colors.textMuted },
  list: { borderRadius: 16, backgroundColor: colors.surface, overflow: "hidden" },
  emptyText: { fontSize: typography.body, color: colors.textMuted, textAlign: "center", paddingVertical: 24 },
});
