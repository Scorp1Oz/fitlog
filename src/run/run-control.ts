// Запуск/зупинка трекання пробіжки: дозволи + старт/стоп оновлень локації.
import * as Location from "expo-location";

import { RUN_TASK, useRunStore } from "./run-store";

/** Запит дозволів і старт фонового трекання. */
export async function startRun(): Promise<{ ok: boolean; error?: string }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) {
    return { ok: false, error: "Немає дозволу на геолокацію." };
  }
  // Фоновий дозвіл бажаний, але не обов'язковий: без нього трек пишеться,
  // поки екран відкритий.
  await Location.requestBackgroundPermissionsAsync().catch(() => {});

  useRunStore.getState().start();
  await Location.startLocationUpdatesAsync(RUN_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 5,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: "fitlog — пробіжка",
      notificationBody: "Запис маршруту триває…",
      notificationColor: "#C8F135",
    },
  });
  return { ok: true };
}

/** Зупинити трекання й повернути дані пробіжки для збереження. */
export async function stopRun() {
  const started = await Location.hasStartedLocationUpdatesAsync(RUN_TASK).catch(
    () => false
  );
  if (started) {
    await Location.stopLocationUpdatesAsync(RUN_TASK).catch(() => {});
  }
  return useRunStore.getState().finish();
}
