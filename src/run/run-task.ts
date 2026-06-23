// Фоновий таск локації: отримує пакети координат (навіть при згорнутому
// застосунку завдяки foreground service) і вливає їх у стор пробіжки.
// Реєструється на рівні модуля — імпортується в _layout.tsx один раз.
import type { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";

import { RUN_TASK, useRunStore } from "./run-store";

TaskManager.defineTask(RUN_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: LocationObject[] } | null)?.locations;
  if (!locations?.length) return;
  useRunStore.getState().addLocations(
    locations.map((l) => ({
      lat: l.coords.latitude,
      lng: l.coords.longitude,
      t: l.timestamp,
    }))
  );
});
