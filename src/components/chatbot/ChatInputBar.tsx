import React from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography } from "../../theme/colors";

interface Props {
  input: string;
  setInput: (text: string) => void;
  loading: boolean;
  onSend: () => void;
}

export default function ChatInputBar({ input, setInput, loading, onSend }: Props) {
  const insets = useSafeAreaInsets();
  const canSend = !loading && input.trim().length > 0;

  return (
    <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
      <TextInput
        id="chatbot-text-input"
        style={styles.textInput}
        value={input}
        onChangeText={setInput}
        placeholder="Nhập câu hỏi..."
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={() => onSend()}
        editable={!loading}
      />
      <Pressable
        id="chatbot-send-button"
        onPress={() => onSend()}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendBtn,
          !canSend && styles.sendBtnDisabled,
          pressed && canSend && styles.sendBtnPressed,
        ]}
        accessibilityLabel="Gửi tin nhắn"
      >
        <Ionicons name="arrow-up" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: typography.body,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
  sendBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
});
