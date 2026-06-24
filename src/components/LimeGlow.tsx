// Пульсуюче лаймове свічіння під кнопкою-акцентом. Гало — лаймовий
// прямокутник тієї ж форми позаду контенту; його boxShadow «витікає» за краї
// та дає ореол, а пульсація прозорості робить ефект «дихання». Сама кнопка
// (зазвичай теж лаймова й непрозора) лягає поверх гало.
import { useEffect, type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/theme/colors";

export function LimeGlow({
  children,
  radius = 16,
  className,
  style,
  enabled = true,
}: {
  children: ReactNode;
  // Радіус скруглення гало — має збігатися з кнопкою (rounded-2xl ≈ 16).
  radius?: number;
  // Класи розкладки (ширина/flex/відступи) — щоб обгортка займала те саме
  // місце, що й кнопка всередині, і гало точно лягало під неї.
  className?: string;
  style?: ViewStyle;
  // Дозволяє вимкнути свічіння (напр. коли кнопка неактивна/не лаймова).
  enabled?: boolean;
}) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [v]);

  const halo = useAnimatedStyle(() => ({ opacity: 0.35 + v.value * 0.5 }));

  if (!enabled) {
    return (
      <View className={className} style={style}>
        {children}
      </View>
    );
  }

  return (
    <View className={className} style={style}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: colors.lime,
            boxShadow: `0px 0px 22px 2px ${colors.lime}`,
          },
          halo,
        ]}
      />
      {children}
    </View>
  );
}
