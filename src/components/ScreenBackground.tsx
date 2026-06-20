import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";

import { useTheme } from "@/theme/useTheme";

// Фірмовий фон основних екранів: два радіальні лаймові ореоли по діагоналі.
// Центри — за межами екрана (~15% від кутів), спад м'який, тож світіння
// дифузне й не змішується з інтерфейсом.
export function ScreenBackground() {
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const r = width * 0.45;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Явні числові розміри полотна: на частині Android Svg із самим лише
          style не розтягується на весь екран і лишає непокриту чорну смугу. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Зліва — центр за лівим краєм, приблизно на третині згори. */}
          <RadialGradient
            id="glowTopLeft"
            gradientUnits="userSpaceOnUse"
            cx={-width * 0.06}
            cy={height * 0.33}
            r={r}
          >
            <Stop offset="0" stopColor={colors.lime} stopOpacity={0.28} />
            <Stop offset="0.35" stopColor={colors.lime} stopOpacity={0.1} />
            <Stop offset="0.7" stopColor={colors.lime} stopOpacity={0.025} />
            <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
          </RadialGradient>

          {/* Справа — центр за правим краєм, приблизно на двох третинах згори. */}
          <RadialGradient
            id="glowBottomRight"
            gradientUnits="userSpaceOnUse"
            cx={width * 1.06}
            cy={height * 0.66}
            r={r}
          >
            <Stop offset="0" stopColor={colors.lime} stopOpacity={0.28} />
            <Stop offset="0.35" stopColor={colors.lime} stopOpacity={0.1} />
            <Stop offset="0.7" stopColor={colors.lime} stopOpacity={0.025} />
            <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Два прозорі шари накладаються — обидва ореоли видно. */}
        <Rect width={width} height={height} fill="url(#glowTopLeft)" />
        <Rect width={width} height={height} fill="url(#glowBottomRight)" />
      </Svg>
    </View>
  );
}
