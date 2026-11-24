import React, { useEffect, useRef } from "react";
import { Animated, type DimensionValue, StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
};

// Khối giữ chỗ khi đang tải (skill mục 23) — giữ đúng kích thước để bố cục không nhảy khi có dữ liệu.
export default function Skeleton({ width = "100%", height = 18, radius = 8 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius: radius, opacity }]}
      accessibilityLabel="Đang tải"
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.chartGrid },
});
