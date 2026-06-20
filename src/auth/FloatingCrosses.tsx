// Декоративний шар: маленькі сірі хрестики, що повільно «літають».
// Анімація на UI-потоці через react-native-reanimated (плавно, без лагів).
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/useTheme";

type CrossConfig = {
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
};

function Cross({
  startX,
  startY,
  driftX,
  driftY,
  size,
  duration,
  delay,
  rotate,
}: CrossConfig) {
  const { colors } = useTheme();
  // t повільно ходить 0↔1 туди-сюди по колу нескінченно.
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [delay, duration, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [0, driftX]) },
      { translateY: interpolate(t.value, [0, 1], [0, driftY]) },
      { rotate: `${interpolate(t.value, [0, 1], [0, rotate])}deg` },
    ],
    opacity: interpolate(t.value, [0, 1], [0.12, 0.4]),
  }));

  return (
    <Animated.Text
      style={[
        {
          position: "absolute",
          left: startX,
          top: startY,
          color: colors.textMuted,
          fontSize: size,
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
  // Випадкові параметри рахуємо один раз (поки незмінні розмір і кількість).
  const crosses = useMemo<CrossConfig[]>(
    () =>
      Array.from({ length: count }).map(() => ({
        startX: Math.random() * width,
        startY: Math.random() * height,
        // Дрейф у обидва боки → хрестик лишається біля місця появи,
        // тож розподіл по екрану рівномірний (нижня смуга не оголюється).
        driftX: (Math.random() - 0.5) * 45,
        driftY: (Math.random() - 0.5) * 50,
        size: 8 + Math.random() * 10,
        duration: 12000 + Math.random() * 13000,
        delay: Math.random() * 5000,
        rotate: (Math.random() - 0.5) * 40,
      })),
    [count, width, height]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {crosses.map((cross, i) => (
        <Cross key={i} {...cross} />
      ))}
    </View>
  );
}
