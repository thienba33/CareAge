import { createNavigationContainerRef } from "@react-navigation/native";

// Cho phép điều hướng từ ngoài cây component (vd. khi bấm vào thông báo).
export const navigationRef = createNavigationContainerRef<any>();

// Mở một tab trong stack "Main" (React Navigation v7 không tự tìm màn hình ở navigator lồng nhau).
export function navigateToTabWhenReady(tab: string, attempt = 0) {
  if (navigationRef.isReady()) {
    navigationRef.navigate("Main", { screen: tab });
  } else if (attempt < 20) {
    setTimeout(() => navigateToTabWhenReady(tab, attempt + 1), 100);
  }
}
