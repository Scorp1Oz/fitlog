// Декоративний шар: маленькі сірі хрестики. Кожен «живе» один цикл —
// плавно з'являється, трохи дрейфує, зникає, після чого відроджується в
// іншому випадковому місці. Анімація на UI-потоці (react-native-reanimated).
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/useTheme";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Випадкові параметри одного «життя» хрестика (позиція, дрейф, розмір, оберт).
function spawn(width: number, height: number) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: rand(8, 18),
    driftX: rand(-1, 1) * 55,
    driftY: rand(-1, 1) * 60,
    rotate: rand(-1, 1) * 50,
  };
}

function Cross({ width, height }: { width: number; height: number }) {
  const { colors } = useTheme();
  // Поточне «життя»: позиція й параметри руху. Змінюється при відродженні.
  const [pos, setPos] = useState(() => spawn(width, height));
  // life 0→1 — прогрес одного циклу (fade-in, дрейф, fade-out).
  const life = useSharedValue(0);

  const respawn = useCallback(
    () => setPos(spawn(width, height)),
    [width, height]
  );

  useEffect(() => {
    // Один прохід; коли завершився — відроджуємось в іншому місці.
    // Коротший за попередній (рух помітно жвавіший).
    const duration = rand(5000, 9000);
    const delay = Math.random() * 2500; // стартовий розкид, щоб не блимали разом
    life.value = 0;
    life.value = withDelay(
      delay,
      withTiming(
        1,
        { duration, easing: Easing.inOut(Easing.sin) },
        (finished) => {
          if (finished) runOnJS(respawn)();
        }
      )
    );
  }, [pos, respawn, life]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(life.value, [0, 1], [0, pos.driftX]) },
      { translateY: interpolate(life.value, [0, 1], [0, pos.driftY]) },
      { rotate: `${interpolate(life.value, [0, 1], [0, pos.rotate])}deg` },
    ],
    // З'являється на початку, тримається, зникає в кінці.
    opacity: interpolate(life.value, [0, 0.2, 0.8, 1], [0, 0.4, 0.4, 0]),
  }));

  return (
    <Animated.Text
      style={[
        {
          position: "absolute",
          left: pos.x,
          top: pos.y,
          color: colors.textMuted,
          fontSize: pos.size,
          fontWeight: "300",
        },
        style,
      ]}
    >
      ✕
    </Animated.Text>
  );
}

export function FloatingCrosses({
  width,
  height,
  count = 19,
}: {
  width: number;
  height: number;
  count?: number;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => (
        <Cross key={i} width={width} height={height} />
      ))}
    </View>
  );
}
