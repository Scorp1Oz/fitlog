// Стан активної пробіжки (в пам'яті). Точки додає і фоновий таск, і він же
// рахує дистанцію. weight/час не тут — тривалість UI рахує з startedAt.
import { create } from "zustand";

import { haversineMeters } from "@/lib/geo";

// Назва фонового таска локації (реєструється в run-task.ts).
export const RUN_TASK = "fitlog-run-location";

export type RunPointLive = { lat: number; lng: number; t: number };

type RunState = {
  status: "idle" | "running";
  startedAt: number | null;
  points: RunPointLive[];
  distanceM: number;
  // Остання відома позиція користувача — щоб карта в режимі очікування
  // одразу центрувалась на ньому (а не на «нульовому острові»).
  userPos: { lat: number; lng: number } | null;

  start: () => void;
  setUserPos: (p: { lat: number; lng: number }) => void;
  addLocations: (locs: RunPointLive[]) => void;
  finish: () => {
    startedAt: number;
    endedAt: number;
    distanceM: number;
    durationS: number;
    points: RunPointLive[];
  } | null;
  reset: () => void;
};

export const useRunStore = create<RunState>((set, get) => ({
  status: "idle",
  startedAt: null,
  points: [],
  distanceM: 0,
  userPos: null,

  start: () =>
    set({ status: "running", startedAt: Date.now(), points: [], distanceM: 0 }),

  setUserPos: (p) => set({ userPos: p }),

  addLocations: (locs) =>
    set((s) => {
      if (s.status !== "running") return s;
      const pts = [...s.points];
      let dist = s.distanceM;
      for (const loc of locs) {
        const last = pts[pts.length - 1];
        if (last) {
          const d = haversineMeters(last, loc);
          // Фільтр GPS-шуму: мікро-рухи < 2 м не рахуємо й не додаємо.
          if (d < 2) continue;
          dist += d;
        }
        pts.push(loc);
      }
      const tip = pts[pts.length - 1];
      return {
        points: pts,
        distanceM: dist,
        ...(tip ? { userPos: { lat: tip.lat, lng: tip.lng } } : {}),
      };
    }),

  finish: () => {
    const s = get();
    if (s.status !== "running" || s.startedAt == null) return null;
    const endedAt = Date.now();
    const data = {
      startedAt: s.startedAt,
      endedAt,
      distanceM: s.distanceM,
      durationS: Math.round((endedAt - s.startedAt) / 1000),
      points: s.points,
    };
    set({ status: "idle", startedAt: null, points: [], distanceM: 0 });
    return data;
  },

  reset: () =>
    set({ status: "idle", startedAt: null, points: [], distanceM: 0 }),
}));
