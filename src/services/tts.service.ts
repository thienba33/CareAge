import * as Speech from "expo-speech";


export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*#_~`]/g, "")
    .replace(/[🌿📋⚠️👋😊🙏🩺💡❤️]/g, "")
    .replace(/\n\s*-\s*/g, ". ")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function stopSpeech(): Promise<void> {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}


export async function speakText(
  rawText: string,
  callbacks?: {
    onStart?: () => void;
    onDone?: () => void;
    onError?: () => void;
  }
): Promise<void> {
  await stopSpeech();
  callbacks?.onStart?.();

  const cleanedText = cleanTextForSpeech(rawText);
  if (!cleanedText) {
    callbacks?.onDone?.();
    return;
  }

  try {
    const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
    const viVoices = voices.filter((v) => v.language.toLowerCase().startsWith("vi"));
    const bestVoice =
      viVoices.find(
        (v) =>
          v.quality === Speech.VoiceQuality.Enhanced ||
          v.identifier.toLowerCase().includes("enhanced") ||
          v.identifier.toLowerCase().includes("premium") ||
          v.identifier.toLowerCase().includes("network")
      ) ?? viVoices[0];

    Speech.speak(cleanedText, {
      language: "vi-VN",
      voice: bestVoice?.identifier,
      rate: 0.9, // Tốc độ đĩnh đạc, rõ ràng cho người cao tuổi
      pitch: 1.0,
      onDone: () => {
        callbacks?.onDone?.();
      },
      onStopped: () => {
        callbacks?.onDone?.();
      },
      onError: () => {
        callbacks?.onError?.();
      },
    });
  } catch (err) {
    console.warn("[TTS] Speak error:", err);
    callbacks?.onError?.();
  }
}
