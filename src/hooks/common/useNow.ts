import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    let timer = setInterval(tick, intervalMs);

    const sub = AppState.addEventListener("change", (state) => {
      clearInterval(timer);
      if (state === "active") {
        tick();
        timer = setInterval(tick, intervalMs);
      }
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [intervalMs]);

  return now;
}
