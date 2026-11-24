import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppAvatar } from "../common";
import { colors, typography } from "../../theme/colors";
import type { UIMessage } from "./useChatbot";

interface Props {
  item: UIMessage;
  speakingId: string | null;
  onToggleSpeak: (item: UIMessage) => void;
}

export default function ChatMessageBubble({ item, speakingId, onToggleSpeak }: Props) {
  const isUser = item.role === "user";

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {!isUser && (
        <View style={styles.avatarWrapper}>
          <AppAvatar icon="heart" size={24} variant="primaryLight" />
        </View>
      )}
      <View style={styles.bubbleContent}>
        {!isUser ? (
          <View style={[styles.assistantCard, item.isError && styles.errorCard]}>
            {!item.isError && (
              <View style={styles.speakerRow}>
                <TouchableOpacity
                  style={[
                    styles.speakerBtn,
                    speakingId === item.id && styles.speakerBtnActive,
                  ]}
                  onPress={() => onToggleSpeak(item)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    speakingId === item.id ? "Dừng đọc câu trả lời" : "Nghe đọc câu trả lời"
                  }
                >
                  <Ionicons
                    name={speakingId === item.id ? "volume-high" : "volume-medium"}
                    size={18}
                    color={speakingId === item.id ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.speakerBtnText,
                      speakingId === item.id && styles.speakerBtnTextActive,
                    ]}
                  >
                    {speakingId === item.id ? "Đang đọc… (Bấm để dừng)" : "Nghe đọc"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.assistantText, item.isError && styles.errorText]}>
              {item.content}
            </Text>
          </View>
        ) : (
          <Text style={[styles.bubbleText, styles.userBubbleText]}>
            {item.content}
          </Text>
        )}
      </View>
    </View>
  );
}

export function ChatTypingIndicator() {
  return (
    <View style={styles.loadingRow}>
      <View style={styles.avatarWrapper}>
        <AppAvatar icon="heart" size={24} variant="primaryLight" />
      </View>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>Đang soạn trả lời…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  assistantBubble: {
    alignSelf: "flex-start",
  },
  avatarWrapper: {
    marginBottom: 2,
  },
  bubbleContent: {
    flex: 1,
  },
  bubbleText: {
    fontSize: typography.body,
    lineHeight: 26,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  userBubbleText: {
    backgroundColor: colors.primary,
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  assistantCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  errorCard: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  speakerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}80`,
  },
  speakerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: `${colors.primary}12`,
  },
  speakerBtnActive: {
    backgroundColor: `${colors.primary}25`,
  },
  speakerBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  speakerBtnTextActive: {
    color: colors.primary,
  },
  assistantText: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.text,
  },
  errorText: {
    color: colors.danger,
  },

  // Loading
  loadingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontStyle: "italic",
  },
});
