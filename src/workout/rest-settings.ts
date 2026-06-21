import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

// Налаштування відпочинку: стандартний час між підходами і вимкнення звуку.
// Зберігаються в SecureStore, тож переживають перезапуск.
const KEY = "rest-settings";

type RestSettings = {
  defaultRest: number; // секунд (стандарт 1:30)
  muted: boolean;
  setDefaultRest: (s: number) => void;
  setMuted: (m: boolean) => void;
  hydrate: () => Promise<void>;
};

let hydrated = false;

function persist(defaultRest: number, muted: boolean) {
  SecureStore.setItemAsync(KEY, JSON.stringify({ defaultRest, muted })).catch(
    () => {}
  );
}

export const useRestSettings = create<RestSettings>((set, get) => ({
  defaultRest: 90,
  muted: false,
  setDefaultRest: (s) => {
    const v = Math.max(5, Math.min(60 * 15, Math.round(s)));
    set({ defaultRest: v });
    persist(v, get().muted);
  },
  setMuted: (m) => {
    set({ muted: m });
    persist(get().defaultRest, m);
  },
  hydrate: async () => {
    if (hydrated) return;
    hydrated = true;
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        set({
          defaultRest: typeof v.defaultRest === "number" ? v.defaultRest : 90,
          muted: !!v.muted,
        });
      }
    } catch {
      // налаштування не критичні
    }
  },
}));
