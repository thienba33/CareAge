import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography } from "../../../theme/colors";

export type UndoToastProps = {
  message: string;
  onUndo: () => void;
};

// Dải xác nhận nổi ở cuối màn hình, cho phép hoàn tác thao tác vừa làm trong vài giây.
export default function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="checkmark-circle" size={24} color={colors.surface} />
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onUndo} activeOpacity={0.85} accessibilityRole="button">
        <Text style={styles.buttonText}>Hoàn tác</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 16,
    backgroundColor: colors.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: { flex: 1, fontSize: typography.body, color: colors.surface },
  button: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  buttonText: { fontSize: typography.body, fontWeight: "800", color: colors.text },
});
