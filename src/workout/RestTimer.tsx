import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/theme/useTheme";

function fmt(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Панель відпочинку між підходами. Керована: показує залишок і кнопки ±15с/пропустити.
export function RestTimer({
  remaining,
  onAdjust,
  onSkip,
}: {
  remaining: number; // секунд лишилось
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
      <Pressable
        onPress={() => onAdjust(-15)}
        hitSlop={8}
        className="px-2 active:opacity-60"
      >
        <Text className="font-sans-strong text-text-muted">−15</Text>
      </Pressable>

      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name="timer-sand" size={16} color={colors.lime} />
        <Text className="font-mono text-xl text-lime">{fmt(remaining)}</Text>
      </View>

      <Pressable
        onPress={() => onAdjust(15)}
        hitSlop={8}
        className="px-2 active:opacity-60"
      >
        <Text className="font-sans-strong text-text-muted">+15</Text>
      </Pressable>

      <Pressable
        onPress={onSkip}
        hitSlop={8}
        className="rounded-full border border-border px-3 py-1 active:opacity-60"
      >
        <Text className="font-mono text-[11px] tracking-[1px] text-text-dim">
          ПРОПУСТИТИ
        </Text>
      </Pressable>
    </View>
  );
}
