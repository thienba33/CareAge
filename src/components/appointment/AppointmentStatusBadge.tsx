import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { typography } from "../../theme/colors";
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_ICON,
  APPOINTMENT_STATUS_LABEL,
} from "../../constants/appointmentStatus";
import type { AppointmentStatus } from "../../types/appointment";

// Trạng thái lịch khám: icon + chữ, không chỉ dùng màu.
export default function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const color = APPOINTMENT_STATUS_COLOR[status];
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={APPOINTMENT_STATUS_ICON[status]} size={16} color={color} />
      <Text style={[styles.text, { color }]}>{APPOINTMENT_STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: { fontSize: typography.caption, fontWeight: "700" },
});
