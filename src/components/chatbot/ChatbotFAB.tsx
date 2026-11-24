import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAvatar } from "../common";
import { colors } from "../../theme/colors";
import { useChatbot } from "./useChatbot";
import ChatEmptyState from "./ChatEmptyState";
import ChatMessageBubble, { ChatTypingIndicator } from "./ChatMessageBubble";
import ChatInputBar from "./ChatInputBar";

interface Props {
  role: string;
}

export default function ChatbotFAB({ role }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const {
    messages,
    input,
    setInput,
    loading,
    speakingId,
    flatListRef,
    handleSend,
    handleClear,
    handleToggleSpeak,
    handleCloseCleanup,
  } = useChatbot(role);

  // Hiệu ứng nhấn nút FAB
  const handleFABPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => setOpen(true));
  }, [scaleAnim]);

  const handleClose = useCallback(() => {
    handleCloseCleanup();
    setOpen(false);
  }, [handleCloseCleanup]);

  return (
    <>
      {/* ── Nút FAB nổi ── */}
      <Animated.View
        style={[
          styles.fab,
          { bottom: insets.bottom + 94, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          id="chatbot-fab-button"
          onPress={handleFABPress}
          activeOpacity={0.85}
          accessibilityLabel="Mở chatbot trợ lý"
          accessibilityRole="button"
          style={styles.fabInner}
        >
          <View style={styles.brandIcon}>
            <Ionicons name="chatbubble" size={34} color="#fff" />
            <Ionicons
              name="heart"
              size={15}
              color={colors.primary}
              style={styles.brandHeart}
            />
          </View>
          <View style={styles.fabBadge}>
            <Ionicons name="sparkles" size={9} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Modal chat ── */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <AppAvatar icon="heart" size={38} variant="primaryLight" />
              <View>
                <Text style={styles.headerTitle}>Trợ lý CareAge</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {messages.length > 0 && (
                <TouchableOpacity
                  onPress={handleClear}
                  style={styles.iconBtn}
                  accessibilityLabel="Xoá hội thoại"
                >
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleClose}
                style={styles.iconBtn}
                accessibilityLabel="Đóng chatbot"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <ChatEmptyState role={role} onSelectPrompt={handleSend} />
            }
            renderItem={({ item }) => (
              <ChatMessageBubble
                item={item}
                speakingId={speakingId}
                onToggleSpeak={handleToggleSpeak}
              />
            )}
          />

          {/* Loading indicator */}
          {loading && <ChatTypingIndicator />}

          {/* Input bar */}
          <ChatInputBar
            input={input}
            setInput={setInput}
            loading={loading}
            onSend={handleSend}
          />
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // FAB
  fab: {
    position: "absolute",
    right: 20,
    zIndex: 999,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  brandIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  brandHeart: {
    position: "absolute",
    top: 7,
  },
  fabBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },

  // Messages
  messageList: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
});
