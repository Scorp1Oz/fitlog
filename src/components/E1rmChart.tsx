import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import { useTheme } from "@/theme/useTheme";

// Простий лінійний графік оцінки 1ПМ по сесіях (без зайвих залежностей).
export function E1rmChart({ values, height = 160 }: { values: number[]; height?: number }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const pad = 16;

  let chart = null;
  if (w > 0 && values.length >= 2) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const innerW = w - pad * 2;
    const innerH = height - pad * 2;
    const pts = values.map((v, i) => ({
      x: pad + (innerW * i) / (values.length - 1),
      y: pad + innerH * (1 - (v - min) / span),
    }));
    const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
    chart = (
      <Svg width={w} height={height}>
        <Polyline
          points={poly}
          fill="none"
          stroke={colors.lime}
          strokeWidth={2}
        />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.lime} />
        ))}
      </Svg>
    );
  }

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height }}
    >
      {chart}
    </View>
  );
}
