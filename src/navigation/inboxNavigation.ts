import type { InboxType } from "../types/inbox";
import { navigationRef } from "./navigationRef";

// Mở màn liên quan tới một thông báo: chọn đúng người cao tuổi rồi chuyển màn.
export function openInboxTarget(type: InboxType, elderlyId: string | undefined, select: (id: string) => void) {
  if (elderlyId) select(elderlyId);
  if (!navigationRef.isReady()) return;
  if (type === "HEALTH_ALERT") navigationRef.navigate("Alerts");
  else if (type === "MEDICATION_MISSED") navigationRef.navigate("Main", { screen: "Medications" });
  else navigationRef.navigate("Main", { screen: "Appointments" });
}
