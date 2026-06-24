// Іконка завершення з ефектною появою:
//   • сама іконка «вистрибує» з нуля з відскоком (а для бігуна — ще й вбігає зліва);
//   • позаду спалахує лаймове свічіння (радіальний градієнт), що далі тихо пульсує;
//   • від центру розходиться ударна хвиля-кільце (один раз).
// Свічіння робимо градієнтом, а не boxShadow: на Android тінь на прозорому в'ю
// домальовує темний диск-артефакт. Увесь таймлайн стартує із затримкою `delay` —
// щоб ефект не програвся під лаймовою завісою, поки вона ще перекриває екран.
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function CheckPop({
  name,
  size,
  color,
  delay = 0,
  slideIn = false,
}: {
  name: IconName;
  size: number;
  color: string;
  // Затримка старту — щоб анімація не «програлась» під лаймовою завісою.
  delay?: number;
  // Додає вхід зліва направо (для бігуна).
  slideIn?: boolean;
}) {
  const s = useSharedValue(0); // поява іконки (pop)
  const ring = useSharedValue(0); // ударна хвиля (один прохід)
  const glow = useSharedValue(0); // тиха пульсація свічіння після появи

  useEffect(() => {
    s.value = withDelay(
      delay,
      withSequence(
        withTiming(1.18, {
          duration: 360,
          easing: Easing.out(Easing.back(2.2)),
        }),
        withTiming(1, { duration: 160, easing: Easing.out(Easing.ease) })
      )
    );
    ring.value = withDelay(
      delay,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
    );
    glow.value = withDelay(
      delay + 420,
      withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [s, ring, glow, delay]);

  // Іконка: проявлення + (опц.) вбігання зліва + масштаб-відскок.
  const iconStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, s.value * 2),
    transform: [
      { translateX: slideIn ? -size * (1 - s.value) : 0 },
      { scale: s.value },
    ],
  }));

  // Свічіння: спалах разом із появою, далі тиха пульсація.
  const glowStyle = useAnimatedStyle(() => {
    const appear = Math.min(1, s.value);
    const pulse = 0.65 + glow.value * 0.35;
    return {
      opacity: appear * pulse,
      transform: [{ scale: 0.85 + s.value * 0.2 + glow.value * 0.12 }],
    };
  });

  // Ударна хвиля: розширюється від центру й згасає (один раз).
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.7,
    transform: [{ scale: 0.3 + ring.value * 2.2 }],
  }));

  const glowSize = size * 2.4;
  const gid = `checkpop-glow-${name}`;

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Свічіння (радіальний градієнт, за іконкою) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: glowSize,
            height: glowSize,
            left: (size - glowSize) / 2,
            top: (size - glowSize) / 2,
          },
          glowStyle,
        ]}
      >
        <Svg width={glowSize} height={glowSize}>
          <Defs>
            <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color} stopOpacity={0.55} />
              <Stop offset="0.4" stopColor={color} stopOpacity={0.22} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={glowSize / 2}
            cy={glowSize / 2}
            r={glowSize / 2}
            fill={`url(#${gid})`}
          />
        </Svg>
      </Animated.View>

      {/* Ударна хвиля-кільце */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: color,
          },
          ringStyle,
        ]}
      />

      {/* Сама іконка */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: "center", justifyContent: "center" },
          iconStyle,
        ]}
      >
        <MaterialCommunityIcons name={name} size={size} color={color} />
      </Animated.View>
    </Animated.View>
  );
}
