import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

const MIN_VISIBLE_MS = 800;
const TRIGGER_DISTANCE = 90;
const MAX_CONTENT_SHIFT = 80;
const DRAG_RESISTANCE = 0.4;

export function usePullToRefresh(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const scrollY = useRef(0);
  const shift = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await Promise.all([
        refresh().catch(() => undefined), 
        new Promise((resolve) => setTimeout(resolve, MIN_VISIBLE_MS)),
      ]);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [refresh]);

  const settle = useCallback(() => {
    Animated.spring(shift, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
  }, [shift]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        
        onMoveShouldSetPanResponderCapture: (_, g) =>
          !refreshingRef.current && scrollY.current <= 0 && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => {
          shift.setValue(Math.min(Math.max(g.dy, 0) * DRAG_RESISTANCE, MAX_CONTENT_SHIFT));
        },
        onPanResponderRelease: (_, g) => {
          settle();
          if (g.dy >= TRIGGER_DISTANCE) onRefresh();
        },
        onPanResponderTerminate: settle,
      }),
    [onRefresh, settle, shift]
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  return {
    refreshing,
    // Gắn vào Animated.View bọc ngoài ScrollView/FlatList.
    containerProps: { ...panResponder.panHandlers, style: { flex: 1, transform: [{ translateY: shift }] } },
    // Gắn vào ScrollView/FlatList.
    scrollProps: { onScroll, scrollEventThrottle: 16, bounces: false, overScrollMode: "never" as const },
  };
}
