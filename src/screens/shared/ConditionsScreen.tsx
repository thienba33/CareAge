import { useMedicalConditions } from "../../hooks";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../theme/colors";
import { alertError } from "../../utils/alertError";
import { ConditionFormModal } from "../../components/profile";
import {
  CONDITION_CATEGORIES,
  CONDITION_CATEGORY_LABEL,
  CONDITION_STATUS_COLOR,
  CONDITION_STATUS_LABEL,
} from "../../constants/medicalCondition";
import type { ConditionCategory, MedicalCondition } from "../../types/medicalCondition";
import type { ConditionInput } from "../../services";

export default function ConditionsScreen() {
  const { conditions, addCondition, updateCondition, deleteCondition } = useMedicalConditions();
  const [conditionFormVisible, setConditionFormVisible] = useState(false);
  const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null);
  const [conditionFormCategory, setConditionFormCategory] = useState<ConditionCategory>("CHRONIC");

  const openAddCondition = (category: ConditionCategory) => {
    setEditingCondition(null);
    setConditionFormCategory(category);
    setConditionFormVisible(true);
  };

  const openEditCondition = (condition: MedicalCondition) => {
    setEditingCondition(condition);
    setConditionFormCategory(condition.category);
    setConditionFormVisible(true);
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {CONDITION_CATEGORIES.map((category) => {
          const items = conditions.filter((c) => c.category === category);
          return (
            <View key={category} style={styles.conditionGroup}>
              <View style={styles.conditionGroupHeader}>
                <Text style={styles.conditionGroupTitle}>
                  {CONDITION_CATEGORY_LABEL[category]}
                </Text>
                <TouchableOpacity
                  onPress={() => openAddCondition(category)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <Text style={styles.conditionEmptyText}>Chưa có mục nào.</Text>
              ) : (
                <View style={styles.conditionList}>
                  {items.map((condition, index) => (
                    <TouchableOpacity
                      key={condition.id}
                      style={[
                        styles.conditionRow,
                        index !== items.length - 1 && styles.conditionRowDivider,
                      ]}
                      activeOpacity={0.6}
                      onPress={() => openEditCondition(condition)}
                    >
                      <View style={styles.conditionInfoCol}>
                        <Text style={styles.conditionName}>{condition.name}</Text>
                        {condition.note ? (
                          <Text style={styles.conditionNote} numberOfLines={1}>
                            {condition.note}
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.conditionStatusPill,
                          { backgroundColor: `${CONDITION_STATUS_COLOR[condition.status]}22` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.conditionStatusText,
                            { color: CONDITION_STATUS_COLOR[condition.status] },
                          ]}
                        >
                          {CONDITION_STATUS_LABEL[condition.status]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <ConditionFormModal
        visible={conditionFormVisible}
        editingCondition={editingCondition}
        defaultCategory={conditionFormCategory}
        onClose={() => setConditionFormVisible(false)}
        onSubmit={async (input: ConditionInput) => {
          if (editingCondition) {
            await updateCondition(editingCondition.id, input);
          } else {
            await addCondition(input);
          }
          setConditionFormVisible(false);
        }}
        onDelete={(id: string) => {
          deleteCondition(id).catch((e) => alertError(e));
          setConditionFormVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14 },
  conditionGroup: { gap: 8 },
  conditionGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conditionGroupTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  conditionEmptyText: { fontSize: typography.caption, color: colors.textMuted },
  conditionList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  conditionRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  conditionInfoCol: { flex: 1, gap: 2 },
  conditionName: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  conditionNote: { fontSize: typography.caption, color: colors.textMuted },
  conditionStatusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  conditionStatusText: { fontSize: 11, fontWeight: "700" },
});
