import { useCallback, useRef, useState } from "react";
import { FlatList } from "react-native";
import {
  sendMessage,
  speakText,
  stopSpeech,
  type ChatMessage,
} from "../../services";

export interface UIMessage extends ChatMessage {
  id: string;
  isError?: boolean;
}

export function useChatbot(role: string) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleToggleSpeak = useCallback(
    async (item: UIMessage) => {
      if (speakingId === item.id) {
        await stopSpeech();
        setSpeakingId(null);
        return;
      }

      setSpeakingId(item.id);

      await speakText(item.content, {
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    },
    [speakingId]
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      const userMsg: UIMessage = { id: Date.now().toString(), role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      // Scroll xuống cuối
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const history: ChatMessage[] = [...messages, userMsg].map(({ role: r, content: c }) => ({
          role: r,
          content: c,
        }));
        const reply = await sendMessage(history, role);
        const assistantMsg: UIMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e: any) {
        const errMsg: UIMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: e?.message ?? "Trợ lý đang bận, bạn vui lòng thử lại sau nhé 🙏",
          isError: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [input, loading, messages, role]
  );

  const handleClear = useCallback(() => {
    stopSpeech();
    setSpeakingId(null);
    setMessages([]);
  }, []);

  const handleCloseCleanup = useCallback(() => {
    stopSpeech();
    setSpeakingId(null);
    setInput("");
  }, []);

  return {
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
  };
}
