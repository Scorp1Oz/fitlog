// Плаваючий нижній таб-бар: заокруглений прямокутник, що «висить» над низом.
// Керований ззовні: отримує активний index і викликає onChange(i) при тапі —
// перемикання сторінок робить хост через PagerView (тап = миттєво, свайп = анімація).
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/useTheme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Порядок збігається зі сторінками пейджера в хост-маршруті.
const TABS: { icon: IconName; label: string }[] = [
  { icon: "home-variant-outline", label: "ГОЛОВНИЙ" },
  { icon: "dumbbell", label: "ТРЕНУВАННЯ" },
  { icon: "image-filter-hdr", label: "БІГ" },
  { icon: "chart-line", label: "АНАЛІТИКА" },
];

export function FloatingTabBar({
  index,
  onChange,
  locked = false,
}: {
  index: number;
  onChange: (i: number) => void;
  // Під час забігу таб-бар приглушений і не реагує на тапи.
  locked?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Під час забігу меню повністю їде за нижній край екрана (а не просто
  // тьмяніє): забіг розгортається на весь екран. Зсув = висота бару + нижній
  // інсет + запас, щоб гарантовано сховати.
  const offscreen = 120 + insets.bottom;
  const shift = useSharedValue(0);

  useEffect(() => {
    shift.value = withTiming(locked ? offscreen : 0, {
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [locked, offscreen, shift]);

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: shift.value }],
  }));

  return (
    <Animated.View
      pointerEvents={locked ? "none" : "box-none"}
      className="absolute inset-x-0 bottom-0 items-center"
      style={[{ paddingBottom: insets.bottom + 12 }, slide]}
    >
      {/* gap між іконками = px від країв → однакові відступи; ширина по контенту. */}
      <View className="flex-row items-center gap-7 rounded-3xl border border-border bg-surface px-7 py-3">
        {TABS.map((tab, i) => (
          <Pressable
            key={tab.label}
            onPress={() => onChange(i)}
            disabled={locked}
            accessibilityLabel={tab.label}
            hitSlop={8}
            className="items-center justify-center py-1"
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={i === index ? colors.lime : colors.textDim}
            />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}
