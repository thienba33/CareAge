import type { CaregiverRelationship, FollowedElderly, LinkedElderly } from "../types/caregiver";

export const RELATIONSHIP_LABEL: Record<CaregiverRelationship, string> = {
  CHILD: "Con",
  SPOUSE: "Vợ / Chồng",
  GRANDCHILD: "Cháu",
  RELATIVE: "Họ hàng",
  OTHER: "Khác",
};

export const RELATIONSHIPS: CaregiverRelationship[] = ["CHILD", "SPOUSE", "GRANDCHILD", "RELATIVE", "OTHER"];

// Dòng phụ dưới tên người đang theo dõi: quan hệ (người thân) hoặc mã bệnh nhân (bác sĩ).
export function followedLabel(e: FollowedElderly): string {
  return e.relationship ? RELATIONSHIP_LABEL[e.relationship] : `Mã ${e.code}`;
}

// Chỉ liên kết của người thân (có linkId, quan hệ) — dùng cho các thao tác gỡ liên kết.
export function isLinkedElderly(e: FollowedElderly): e is LinkedElderly {
  return !!e.linkId && !!e.relationship;
}
