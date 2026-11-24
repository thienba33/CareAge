import { ElderlySwitcher, NoLinkedElderlyState } from "../../components/caregiver";
import {
  EmptyCard,
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
  UndoToast,
} from "../../components/common";
import {
  useSubject,
  usePullToRefresh,
  useAuth,
  useMedications,
  useUndoToast,
  useNow,
} from "../../hooks";
import React, { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { alertError } from "../../utils/alertError";
import { useNavigation } from "@react-navigation/native";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";

import {
  WeeklySchedule,
  SwipeableDoseCard,
  MedicationDetailModal,
  MedicineInfoModal,
} from "../../components/medication";
import { MEDICATION_STATUS_COLOR } from "../../constants/medicationStatus";
import type { Medication } from "../../types/medication";

type ViewMode = "today" | "week";

// Trên nền xanh của phần đầu trang: trắng mờ để nhẹ nhàng nhưng vẫn đủ tương phản (xám sẽ khó nhìn).
const GUIDE_ICON_COLOR = "rgba(255,255,255,0.8)";

export default function MedicationScreen() {
  const { currentUser } = useAuth();
  const { subjectId } = useSubject();
  const navigation = useNavigation<any>();
  const needsLink = currentUser?.role !== "ELDERLY" && !subjectId;
  const { medications, todayDoses, isLoading, error, markTaken, markSkipped, markPending, reload } =
    useMedications();

  // Sau khi vuốt/bấm, cho hoàn tác vài giây phòng khi nhầm.
  const undoToast = useUndoToast();
  const now = useNow();

  const showPageGuide = () => {
    Alert.alert(
      "Trang Chăm sóc",
      "Theo dõi thuốc của bạn. Lịch tái khám nằm ở tab \"Lịch khám\".\n\n" +
        "• Hôm nay / Theo tuần: xem các liều thuốc trong ngày hoặc cả tuần.\n\n" +
        "• Đã uống: bấm nút ✓ hoặc vuốt thẻ thuốc sang PHẢI.\n" +
        "• Bỏ qua liều: bấm nút ✕ hoặc vuốt thẻ thuốc sang TRÁI.\n" +
        "• Lỡ nhầm: bấm \"Hoàn tác\" ở cuối màn hình trong vài giây.\n" +
        "• Bấm vào thẻ thuốc để xem thông tin thuốc.\n\n" +
        "• Danh sách thuốc: bấm vào tên thuốc để xem công dụng và thành phần.\n\n" +
        "• Kéo màn hình xuống để cập nhật dữ liệu mới nhất.",
      [{ text: "Đã hiểu" }]
    );
  };

  const handleTaken = async (doseId: string, medicationName?: string) => {
    try {
      await markTaken(doseId);
      undoToast.show(`Đã uống ${medicationName ?? "thuốc"}`, () => markPending(doseId));
    } catch (e) {
      alertError(e);
    }
  };

  const handleSkipped = async (doseId: string, medicationName?: string) => {
    try {
      await markSkipped(doseId);
      undoToast.show(`Đã bỏ qua ${medicationName ?? "thuốc"}`, () => markPending(doseId));
    } catch (e) {
      alertError(e);
    }
  };
  const [view, setView] = useState<ViewMode>("today");
  const [detailMedication, setDetailMedication] = useState<Medication | null>(null);
  const [infoMedication, setInfoMedication] = useState<Medication | null>(null);

  const canManageDoses = currentUser?.role === "ELDERLY";
  const takenCount = todayDoses.filter((d) => d.status === "TAKEN").length;
  const medicationById = new Map<string, Medication>(medications.map((m) => [m.id, m]));

  const pullToRefresh = usePullToRefresh(
    useCallback(
      () => reload(),
      [reload]
    )
  );

  // Người thân chưa theo dõi ai → hướng dẫn liên kết thay vì màn trống.
  if (needsLink) {
    return (
      <View style={commonStyles.screen}>
        <NoLinkedElderlyState onLink={() => navigation.navigate("Main", { screen: "Profile" })} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          {...pullToRefresh.scrollProps}
        >
          <View style={commonStyles.hero}>
            <HeroBlobs />
            <View style={styles.titleRow}>
              <Text style={commonStyles.heroTitle}>Chăm sóc sức khỏe</Text>
              <TouchableOpacity
                onPress={showPageGuide}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Giới thiệu trang Chăm sóc"
              >
                <Ionicons name="information-circle-outline" size={26} color={GUIDE_ICON_COLOR} />
              </TouchableOpacity>
            </View>
            <Text style={commonStyles.heroSubtitle}>
              {todayDoses.length > 0
                ? `Đã uống ${takenCount}/${todayDoses.length} liều hôm nay`
                : "Chưa có liều thuốc nào cho hôm nay"}
            </Text>
            <View style={styles.switcherRow}>
              <ElderlySwitcher variant="onPrimary" />
            </View>
          </View>

          <View style={styles.tabsCard}>
            <TouchableOpacity
              style={[styles.tabButton, view === "today" && styles.tabButtonActive]}
              onPress={() => setView("today")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="today"
                size={16}
                color={view === "today" ? colors.surface : colors.textMuted}
              />
              <Text style={[styles.tabLabel, view === "today" && styles.tabLabelActive]}>
                Hôm nay
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, view === "week" && styles.tabButtonActive]}
              onPress={() => setView("week")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={view === "week" ? colors.surface : colors.textMuted}
              />
              <Text style={[styles.tabLabel, view === "week" && styles.tabLabelActive]}>
                Theo tuần
              </Text>
            </TouchableOpacity>
          </View>

          <View style={commonStyles.sections}>
            {view === "today" ? (
              todayDoses.length === 0 ? (
                <EmptyCard
                  icon="medkit-outline"
                  iconSize={28}
                  message="Chưa có lịch uống thuốc nào hôm nay."
                />
              ) : (
                <View style={styles.doseList}>
                  <Text style={styles.doseListTitle}>Liều thuốc hôm nay</Text>
                  {todayDoses
                    .slice()
                    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                    .map((dose) => {
                      const medication = medicationById.get(dose.medicationId);
                      if (!medication) return null;
                      return (
                        <SwipeableDoseCard
                          key={dose.id}
                          dose={dose}
                          medication={medication}
                          now={now}
                          canManage={canManageDoses}
                          onTaken={() => handleTaken(dose.id, medication.name)}
                          onSkipped={() => handleSkipped(dose.id, medication.name)}
                          onPress={() => setDetailMedication(medication)}
                        />
                      );
                    })}
                </View>
              )
            ) : (
              <WeeklySchedule
                medications={medications}
                todayDoses={todayDoses}
                canManage={canManageDoses}
                onTaken={handleTaken}
                onSkipped={handleSkipped}
                onMedicationLongPress={setDetailMedication}
              />
            )}

            <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>
              Danh sách thuốc
            </Text>

            {medications.length === 0 ? (
              <EmptyCard
                icon="file-tray-outline"
                iconSize={28}
                message="Chưa có thuốc nào được thêm."
              />
            ) : (
              <View style={styles.medicationList}>
                {medications.map((medication, index) => (
                  <MedicationListItem
                    key={medication.id}
                    medication={medication}
                    isLast={index === medications.length - 1}
                    onPress={() => setInfoMedication(medication)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      {undoToast.message ? (
        <UndoToast message={undoToast.message} onUndo={() => undoToast.undo().catch((e) => alertError(e))} />
      ) : null}

      <MedicationDetailModal medication={detailMedication} onClose={() => setDetailMedication(null)} />
      <MedicineInfoModal medication={infoMedication} onClose={() => setInfoMedication(null)} />
    </View>
  );
}

function MedicationListItem({
  medication,
  isLast,
  onPress,
}: {
  medication: Medication;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.medicationRow, !isLast && styles.medicationRowDivider]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <View
        style={[
          styles.medicationStatusDot,
          { backgroundColor: MEDICATION_STATUS_COLOR[medication.status] },
        ]}
      />
      <Text style={styles.medicationRowName} numberOfLines={1}>
        {medication.name}
      </Text>
      <Text style={styles.medicationRowDosage}>
        {medication.dosage}{medication.unit}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  switcherRow: { marginTop: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tabsCard: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 6,
    marginHorizontal: 20,
    marginTop: -22,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: typography.caption, fontWeight: "700", color: colors.textMuted },
  tabLabelActive: { color: colors.surface },
  sectionHeading: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  sectionHeadingSpaced: { marginTop: 12 },

  doseList: { gap: 18 },
  doseListTitle: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  medicationList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  medicationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  medicationRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  medicationStatusDot: { width: 8, height: 8, borderRadius: 4 },
  medicationRowName: { flex: 1, fontSize: typography.body, fontWeight: "700", color: colors.text },
  medicationRowDosage: { fontSize: typography.caption, color: colors.textMuted },
});
