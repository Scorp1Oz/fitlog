// Запитує дозвіл на геолокацію одразу при заході в додаток і одразу ж бере
// поточну позицію — щоб карта пробіжки відкривалась уже центрованою на
// користувачі, а не на «нульовому острові». Нічого не рендерить.
import * as Location from "expo-location";
import { useEffect } from "react";

import { initNotifications } from "@/lib/notify";

import { useRunStore } from "./run-store";

export function LocationBootstrap() {
  const setUserPos = useRunStore((s) => s.setUserPos);

  useEffect(() => {
    let cancelled = false;

    // Дозвіл і канал сповіщень для фонового таймера відпочинку.
    initNotifications();

    (async () => {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted) return;

      // Остання відома позиція приходить миттєво — нею центруємо одразу.
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last && !cancelled) {
        setUserPos({
          lat: last.coords.latitude,
          lng: last.coords.longitude,
        });
      }

      // Далі уточнюємо реальним фіксом.
      const cur = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null);
      if (cur && !cancelled) {
        setUserPos({
          lat: cur.coords.latitude,
          lng: cur.coords.longitude,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUserPos]);

  return null;
}
