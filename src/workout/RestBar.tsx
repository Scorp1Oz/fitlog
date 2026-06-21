import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/theme/useTheme";

function fmt(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Постійна панель відпочинку зверху екрана. Активна — лаймовий відлік; у спокої
// показує 0:00 і кнопку «рестарт». ±15с коригують час.
export function RestBar({
  remaining,
  active,
  muted,
  onAdjust,
  onRestart,
  onSkip,
  onToggleMute,
  onOpenMenu,
}: {
  remaining: number;
  active: boolean;
  muted: boolean;
  onAdjust: (delta: number) => void;
  onRestart: () => void;
  onSkip: () => void;
  onToggleMute: () => void;
  onOpenMenu: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View className="mx-4 mt-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons
            name="timer-sand"
            size={16}
            color={active ? colors.lime : colors.textDim}
          />
          <Text className="font-mono text-[10px] tracking-[2px] text-text-dim">
            ВІДПОЧИНОК
          </Text>
        </View>

        <View className="flex-row items-center gap-5">
          <Pressable
            onPress={onToggleMute}
            hitSlop={6}
            accessibilityLabel={muted ? "Увімкнути звук" : "Вимкнути звук"}
            className="active:opacity-50"
          >
            <MaterialCommunityIcons
              name={muted ? "volume-off" : "volume-high"}
              size={20}
              color={muted ? colors.textDim : colors.textMuted}
            />
          </Pressable>
          <Pressable onPress={() => onAdjust(-15)} hitSlop={6} className="active:opacity-50">
            <Text className="font-sans-strong text-text-muted">−15</Text>
          </Pressable>
          <Pressable onPress={() => onAdjust(15)} hitSlop={6} className="active:opacity-50">
            <Text className="font-sans-strong text-text-muted">+15</Text>
          </Pressable>
          <Pressable
            onPress={active ? onSkip : onRestart}
            hitSlop={8}
            accessibilityLabel={active ? "Пропустити" : "Запустити"}
            className="active:opacity-50"
          >
            <MaterialCommunityIcons
              name={active ? "close" : "restart"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* Тап по таймеру відкриває меню налаштувань */}
      <Pressable onPress={onOpenMenu} className="active:opacity-70">
        <Text
          className={`mt-1 text-center font-display text-5xl ${
            active ? "text-lime" : "text-text-dim"
          }`}
        >
          {fmt(remaining)}
        </Text>
      </Pressable>
    </View>
  );
}
