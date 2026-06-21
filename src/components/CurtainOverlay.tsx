import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { create } from "zustand";

import { colors } from "@/theme/colors";

// Глобальний тригер «лаймової завіси». play(onCovered) запускає підйом;
// коли екран повністю перекрито — викликається onCovered (там роблять навігацію),
// після чого завіса опускається й зникає.
type CurtainState = {
  token: number;
  onCovered: (() => void) | null;
  play: (onCovered: () => void) => void;
};

export const useCurtain = create<CurtainState>((set) => ({
  token: 0,
  onCovered: null,
  play: (onCovered) => set((s) => ({ token: s.token + 1, onCovered })),
}));

const RISE_MS = 680;
const FALL_MS = 720;
// Пауза в повністю перекритому стані — щоб новий екран встиг змонтуватись.
const HOLD_MS = 420;

export function CurtainOverlay() {
  const { height } = useWindowDimensions();
  const token = useCurtain((s) => s.token);
  const onCovered = useCurtain((s) => s.onCovered);

  const [visible, setVisible] = useState(false);
  const ty = useSharedValue(3000); // далеко за нижнім краєм

  useEffect(() => {
    if (token === 0) return;

    const covered = () => {
      // Екран перекрито — навігуємо під завісою, потім опускаємо її.
      onCovered?.();
      setTimeout(() => {
        ty.value = withTiming(height, { duration: FALL_MS }, (fin) => {
          if (fin) runOnJS(setVisible)(false);
        });
      }, HOLD_MS);
    };

    setVisible(true);
    ty.value = height; // старт із-під низу
    ty.value = withTiming(0, { duration: RISE_MS }, (fin) => {
      if (fin) runOnJS(covered)();
    });
    // height/onCovered зчитуються в межах цього запуску — стежимо лише за token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.lime },
        style,
      ]}
    />
  );
}
