// Плаваючий нижній таб-бар: заокруглений прямокутник, що «висить» над низом.
// Керований ззовні: отримує активний index і викликає onChange(i) при тапі —
// перемикання сторінок робить хост через PagerView (тап = миттєво, свайп = анімація).
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
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

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      {/* gap між іконками = px від країв → однакові відступи; ширина по контенту. */}
      <View
        className="flex-row items-center gap-7 rounded-3xl border border-border bg-surface px-7 py-3"
        style={{ opacity: locked ? 0.4 : 1 }}>
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
    </View>
  );
}
