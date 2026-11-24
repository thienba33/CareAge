import type { Coordinates } from "../services";
import { EMERGENCY_NUMBER } from "../constants/emergency";

export function mapsLink({ latitude, longitude }: Coordinates): string {
  return `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

export function buildSosMessage(name: string, location: Coordinates | null, now: Date = new Date()): string {
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const where = location ? `Vị trí của tôi: ${mapsLink(location)}` : "Không lấy được vị trí hiện tại.";
  return `[KHẨN CẤP - CareAge] ${name} cần giúp đỡ, đã gọi cấp cứu ${EMERGENCY_NUMBER} lúc ${time}. ${where}`;
}
