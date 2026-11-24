import { AppAvatar, EmptyState, ErrorState, LoadingOverlay, LoadingScreen } from "../../components/common";
import { useFormerPatients, usePullToRefresh } from "../../hooks";
import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme/colors";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// Cựu bệnh nhân (MEDICAL_STAFF): người bác sĩ đã kết thúc theo dõi — chỉ xem tên, mã, ngày và lý do kết thúc.
// Không mở được hồ sơ vì bác sĩ không còn quyền xem dữ liệu sức khỏe; phân công lại do quản trị viên thực hiện.
export default function FormerPatientsScreen() {
  const { formerPatients, isLoading, error, reload } = useFormerPatients();
  const pullToRefresh = usePullToRefresh(useCallback(() => reload(), [reload]));

  if (error && formerPatients.length === 0) return <ErrorState message={error} onRetry={reload} />;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView contentContainerStyle={styles.content} {...pullToRefresh.scrollProps}>
          {formerPatients.length === 0 ? (
            <EmptyState
              icon="archive-outline"
              title="Chưa có cựu bệnh nhân"
              message="Người bạn kết thúc theo dõi sẽ hiện ở đây."
              style={styles.emptyContainer}
            />
          ) : (
            <>
              <View style={styles.list}>
                {formerPatients.map((p, i) => (
                  <View
                    key={p.elderlyId}
                    style={[styles.row, i < formerPatients.length - 1 && styles.divider]}
                    accessible
                    accessibilityLabel={`${p.name}, mã ${p.code}.${p.endedAt ? ` Kết thúc ngày ${formatDate(p.endedAt)}.` : ""}${p.endReason ? ` Lý do: ${p.endReason}` : ""}`}
                  >
                    <AppAvatar name={p.name} size={48} variant="muted" />
                    <View style={styles.text}>
                      <Text style={styles.name} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.meta}>
                        Mã {p.code}
                        {p.endedAt ? ` · Kết thúc ${formatDate(p.endedAt)}` : ""}
                      </Text>
                      {p.endReason ? (
                        <View style={styles.reason}>
                          <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.reasonText}>{p.endReason}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.footnote}>
                Bạn không còn xem được dữ liệu sức khỏe của cựu bệnh nhân. Cần theo dõi lại, vui lòng liên hệ quản trị viên bệnh viện.
              </Text>
            </>
          )}
        </ScrollView>
      </Animated.View>
      <LoadingOverlay visible={pullToRefresh.refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 20, gap: 12, paddingBottom: 40 },
  list: { borderRadius: 16, backgroundColor: colors.surface, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { flex: 1, gap: 2 },
  name: { fontSize: typography.body, fontWeight: "800", color: colors.text },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  reason: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  reasonText: { flex: 1, fontSize: typography.caption, color: colors.text },
  footnote: { fontSize: typography.caption, fontStyle: "italic", color: colors.textMuted },
  emptyContainer: { paddingVertical: 60 },
});
