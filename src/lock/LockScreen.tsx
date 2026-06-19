import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useLock } from "./LockContext";

export function LockScreen() {
  const { unlock, enter, biometricsAvailable } = useLock();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tryUnlock = async () => {
    setBusy(true);
    setError(null);
    const ok = await unlock();
    if (!ok) setError("Не вдалося розблокувати. Спробуй ще раз.");
    setBusy(false);
  };

  // Щойно екран відкрився і біометрія доступна — одразу показуємо системний запит.
  useEffect(() => {
    if (biometricsAvailable) {
      void tryUnlock();
    }
    // Запускаємо лише раз при монтуванні.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-bg px-6">
      <Text className="text-7xl opacity-20">🔒</Text>

      <Text className="font-mono text-[10px] tracking-[2px] text-text-dim">
        ЗАХИЩЕНО
      </Text>
      <Text className="font-display text-4xl text-text">РОЗБЛОКУВАННЯ</Text>
      <Text className="text-center font-sans text-sm text-text-muted">
        {biometricsAvailable
          ? "Підтвердь особу, щоб увійти у fitlog"
          : "Біометрія недоступна на цьому пристрої"}
      </Text>

      <Pressable
        onPress={biometricsAvailable ? tryUnlock : enter}
        disabled={busy}
        className="mt-2 w-full max-w-xs items-center bg-lime py-3 active:opacity-80"
      >
        <Text className="font-sans-strong text-base text-on-lime">
          {biometricsAvailable ? "РОЗБЛОКУВАТИ" : "УВІЙТИ"}
        </Text>
      </Pressable>

      {error ? (
        <Text className="font-mono text-xs text-orange">{error}</Text>
      ) : null}
    </View>
  );
}
