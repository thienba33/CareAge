import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import {
  contactService,
  locationService,
  sosService,
  type Coordinates,
} from "../../services";
import type { EmergencyContact } from "../../types";
import { EMERGENCY_NUMBER } from "../../constants/emergency";
import { buildSosMessage } from "../../utils/sos";
import { useAuth } from "../auth";

const CALL_FALLBACK_MS = 2500;

type PendingSms = { contacts: EmergencyContact[]; location: Promise<Coordinates | null> };

export function useSOS() {
  const { currentUser } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const pendingSms = useRef<PendingSms | null>(null);

  const sendPendingSms = useCallback(async () => {
    const pending = pendingSms.current;
    if (!pending) return;
    pendingSms.current = null;

    try {
      const location = await pending.location;
      const message = buildSosMessage(currentUser?.name ?? "Người thân của bạn", location);
      const result = await sosService.openSosSms(
        pending.contacts.map((c) => c.phone),
        message
      );
      if (result === "UNAVAILABLE") {
        Alert.alert(
          "Không mở được tin nhắn",
          "Máy này không gửi được SMS. Hãy gọi trực tiếp cho người thân trong danh bạ khẩn cấp."
        );
      }
    } finally {
      setIsRunning(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") sendPendingSms();
    });
    return () => sub.remove();
  }, [sendPendingSms]);

  const start = useCallback(async () => {
    setIsRunning(true);

    // Danh bạ và quyền vị trí được chuẩn bị song song, lỗi thì bỏ qua — không chặn cuộc gọi.
    const contacts = currentUser
      ? await contactService.getContacts(currentUser.id).catch(() => [] as EmergencyContact[])
      : [];

    if (contacts.length > 0) {
      const hasPermission = await locationService.ensureLocationPermission().catch(() => false);
      pendingSms.current = {
        contacts,
        location: hasPermission ? locationService.getCurrentLocation() : Promise.resolve(null),
      };
    }

    try {
      await sosService.callEmergencyNumber();
    } catch {
      Alert.alert("Không gọi được", `Hãy bấm số ${EMERGENCY_NUMBER} trên bàn phím điện thoại.`);
    }

    if (!pendingSms.current) {
      setIsRunning(false);
      if (contacts.length === 0) {
        Alert.alert(
          "Chưa có liên hệ khẩn cấp",
          "Hãy thêm người thân vào mục Khẩn cấp để họ nhận được tin nhắn kèm vị trí khi bạn gọi SOS."
        );
      }
      return;
    }

    setTimeout(() => {
      if (AppState.currentState === "active") sendPendingSms();
    }, CALL_FALLBACK_MS);
  }, [currentUser, sendPendingSms]);

  const trigger = useCallback(() => {
    Alert.alert(
      `Gọi cấp cứu ${EMERGENCY_NUMBER}?`,
      `Máy sẽ gọi ngay số cấp cứu ${EMERGENCY_NUMBER}. Sau cuộc gọi, app sẽ mở tin nhắn kèm vị trí của bạn để gửi cho người thân trong danh bạ khẩn cấp. Chỉ dùng khi có tình huống khẩn cấp thật sự.`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Gọi ngay", style: "destructive", onPress: start },
      ]
    );
  }, [start]);

  return { trigger, isRunning };
}
