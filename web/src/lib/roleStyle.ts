import { HeartHandshake, ShieldCheck, Stethoscope, UserRound, type LucideIcon } from "lucide-react";
import type { Role } from "./labels";

// Màu nhãn + icon theo vai trò (trang Người dùng).
export const ROLE_STYLE: Record<Role, { badge: string; avatar: string; Icon: LucideIcon }> = {
  ELDERLY: { badge: "bg-primary-light text-primary-dark", avatar: "", Icon: UserRound },
  CAREGIVER: { badge: "bg-info-light text-info", avatar: "", Icon: HeartHandshake },
  MEDICAL_STAFF: { badge: "bg-warning-light text-warning-dark", avatar: "", Icon: Stethoscope },
  ADMIN: { badge: "bg-[#ecebe6] text-[#55534e]", avatar: "", Icon: ShieldCheck },
};
