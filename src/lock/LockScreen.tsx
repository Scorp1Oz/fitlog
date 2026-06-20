import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/useTheme";

import { useLock } from "./LockContext";

export function LockScreen() {
  const { unlock, enter, biometricsAvailable } = useLock();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tryUnlock = async () => {
    setBusy(true);
    setError(null);
    const ok = await unlock();
    if (!ok) setError("Не вдалося розблокувати. Спробуйте ще раз.");
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

  const onPress = biometricsAvailable ? tryUnlock : enter;

  return (
    <View
      className="flex-1 bg-bg px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 72 }}
    >
      {/* Центр: заголовок + інструкція під ним. */}
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="font-display text-4xl text-text">РОЗБЛОКУВАННЯ</Text>
        <Text className="text-center font-sans text-sm text-text-muted">
          {biometricsAvailable
            ? "Підтвердіть особу, щоб увійти"
            : "Біометрія недоступна на цьому пристрої"}
        </Text>
      </View>

      {/* Нижній блок: квадратний відбиток у «рамці-сканері». */}
      <View className="items-center gap-5">
        <Pressable
          onPress={onPress}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={biometricsAvailable ? "Розблокувати" : "Увійти"}
          className="rounded-[36px] border border-faint p-3 active:border-border"
        >
          <View className="h-28 w-28 items-center justify-center rounded-3xl border border-border bg-surface">
            {busy ? (
              <ActivityIndicator color={colors.lime} />
            ) : (
              <MaterialCommunityIcons
                name={biometricsAvailable ? "fingerprint" : "login-variant"}
                size={60}
                color={colors.lime}
              />
            )}
          </View>
        </Pressable>

        <Text className="font-mono text-[10px] tracking-[2px] text-text-dim">
          {busy ? "ПЕРЕВІРКА…" : "ТОРКНІТЬСЯ, ЩОБ УВІЙТИ"}
        </Text>

        {error ? (
          <Text className="font-mono text-xs text-orange">{error}</Text>
        ) : null}
      </View>
    </View>
  );
}
