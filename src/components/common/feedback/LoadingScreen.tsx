import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../../theme/colors";
import { LoadingBox } from "./LoadingOverlay";

export type LoadingScreenProps = { message?: string };

// Màn hình chờ khi tải lần đầu — cùng hộp vòng xoay với LoadingOverlay để mọi lần tải trông giống nhau.
export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <LoadingBox message={message} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
