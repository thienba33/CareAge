import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EmptyState } from "../common";
import { colors, typography } from "../../theme/colors";

const QUICK_PROMPTS_BY_ROLE: Record<string, string[]> = {
  ELDERLY: [
    "Cháu ơi, huyết áp bao nhiêu là bình thường?",
    "Bác thấy hơi chóng mặt khi đứng dậy thì làm sao?",
    "Người cao tuổi nên ăn uống và vận động thế nào?",
    "Khi nào bác cần gọi cấp cứu hoặc người nhà?",
  ],
  CAREGIVER: [
    "Chế độ ăn phù hợp cho người cao huyết áp?",
    "Dấu hiệu cảnh báo sớm đột quỵ ở người già?",
    "Cách đo và theo dõi huyết áp chuẩn tại nhà?",
    "Làm sao giúp người già ngủ ngon hơn?",
  ],
};

interface Props {
  role: string;
  onSelectPrompt: (prompt: string) => void;
}

export default function ChatEmptyState({ role, onSelectPrompt }: Props) {
  const quickPrompts = QUICK_PROMPTS_BY_ROLE[role] ?? QUICK_PROMPTS_BY_ROLE.ELDERLY;

  return (
    <EmptyState
      icon="heart-circle"
      iconColor={colors.primary}
      iconSize={64}
      title={role === "CAREGIVER" ? "Trợ lý sức khỏe CareAge" : "Cháu chào bác ạ! 👋"}
      message={
        role === "CAREGIVER"
          ? "Tôi sẵn sàng hỗ trợ bạn theo dõi và chăm sóc sức khỏe người thân."
          : "Cháu là trợ lý y tế của bác. Bác có thấy mệt hay cần cháu giải đáp điều gì về sức khỏe không ạ?"
      }
      style={styles.emptyContainer}
    >
      <View style={styles.quickPrompts}>
        {quickPrompts.map((q, i) => (
          <TouchableOpacity
            key={i}
            style={styles.quickChip}
            onPress={() => onSelectPrompt(q)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickChipText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </EmptyState>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  quickPrompts: {
    marginTop: 24,
    gap: 10,
    width: "100%",
  },
  quickChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  quickChipText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
});
