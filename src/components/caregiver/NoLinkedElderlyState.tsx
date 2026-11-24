import React from "react";
import { useAuth } from "../../hooks";
import { EmptyState } from "../common";
import { colors } from "../../theme/colors";

type Props = {
  onLink?: () => void;
};

// Người thân chưa liên kết với người cao tuổi nào / bác sĩ chưa được phân công bệnh nhân.
export default function NoLinkedElderlyState({ onLink }: Props) {
  const isStaff = useAuth().currentUser?.role === "MEDICAL_STAFF";

  if (isStaff) {
    return (
      <EmptyState
        icon="people-circle-outline"
        iconColor={colors.primary}
        iconSize={64}
        title="Chưa có bệnh nhân"
        message="Bạn chưa được phân công bệnh nhân nào. Vui lòng liên hệ quản trị viên bệnh viện để được phân công."
      />
    );
  }

  return (
    <EmptyState
      icon="people-circle-outline"
      iconColor={colors.primary}
      iconSize={64}
      title="Chưa theo dõi ai"
      message="Nhờ người cao tuổi mở mục Hồ sơ → &quot;Mời người thân&quot; để lấy mã 6 số, rồi nhập mã đó để bắt đầu theo dõi."
      actionText={onLink ? "Nhập mã liên kết" : undefined}
      onAction={onLink}
    />
  );
}
