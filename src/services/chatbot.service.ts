export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const API_URL = process.env.EXPO_PUBLIC_CHATBOT_API_URL ?? "";
const API_KEY = process.env.EXPO_PUBLIC_CHATBOT_API_KEY ?? "";
const MODEL = process.env.EXPO_PUBLIC_CHATBOT_MODEL ?? "gpt-4o-mini";

export const SYSTEM_PROMPTS: Record<string, string> = {
  ELDERLY: `Bạn là trợ lý y tế CareAge cho người cao tuổi tại Việt Nam.

QUY TẮC BẮT BUỘC:
- Xưng: "cháu", gọi: "bác" (hoặc "ông/bà"). Giữ giọng ân cần, lễ phép.
- CÂU TRẢ LỜI PHẢI CỰC KỲ NGẮN GỌN (dưới 100 từ), đi thẳng vào trọng tâm câu hỏi, không giải thích lý thuyết lan man.
- Chữ viết rõ ràng, dễ nhìn trên điện thoại.

CẤU TRÚC 3 PHẦN GỌN GÀNG:
1. Trả lời thẳng (1 câu ngắn gọn, giải đáp ngay thắc mắc).
2. Việc cần làm ngay:
   - Tối đa 2 đến 3 gạch đầu dòng ngắn, hành động thực tế được ngay.
3. ⚠️ Lưu ý quan trọng:
   - 1 câu cảnh báo dấu hiệu nguy hiểm cần bấm SOS trên app hoặc đi viện ngay.
   - Nhắc tuân thủ đơn thuốc của bác sĩ.`,

  CAREGIVER: `Bạn là trợ lý y tế CareAge hỗ trợ người chăm sóc người cao tuổi.

QUY TẮC BẮT BUỘC:
- CÂU TRẢ LỜI CỰC KỲ NGẮN GỌN (dưới 100 từ), đi thẳng vào việc, chuyên nghiệp và chính xác.

CẤU TRÚC 3 PHẦN:
1. Đánh giá nhanh tình trạng (1 câu).
2. Hướng dẫn xử lý/chăm sóc (2-3 gạch đầu dòng ngắn).
3. ⚠️ Lưu ý & Báo động đỏ (dấu hiệu cần đưa đi viện gấp).`
};

function getChatEndpoint(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/chat/completions")) {
    return trimmed;
  }
  return `${trimmed}/chat/completions`;
}


export class ChatbotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatbotError";
  }
}

export async function sendMessage(
  messages: ChatMessage[],
  role: string
): Promise<string> {
  const endpoint = getChatEndpoint(API_URL);

  if (!endpoint || !API_KEY) {
    throw new ChatbotError("Trợ lý đang bận, bạn vui lòng quay lại sau nhé 🙏");
  }

  const systemPrompt = SYSTEM_PROMPTS[role] ?? SYSTEM_PROMPTS.ELDERLY;

  const payload = {
    model: MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.3,
    max_tokens: 350,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn(`[Chatbot] API error (${res.status}):`, errorText);
      throw new ChatbotError("Trợ lý đang bận xử lý việc khác, bạn thử lại sau một chút nhé 😊");
    }

    const data = await res.json();
    return (
      (data.choices?.[0]?.message?.content as string) ??
      "Trợ lý chưa kịp trả lời, bạn thử hỏi lại nhé 😊"
    );
  } catch (error: unknown) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    console.error("[Chatbot] Network/Call error:", error);
    throw new ChatbotError("Không thể kết nối tới trợ lý, vui lòng kiểm tra kết nối mạng 😊");
  }
}
