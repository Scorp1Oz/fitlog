import { Text, View } from "react-native";

import { mvs, vs } from "@/lib/responsive";

// Єдиний заголовок екранів пейджера: лаймова акцент-плашка ліворуч,
// необов'язковий mono-кікер і великий display-заголовок. Лівий край — на
// одній вертикалі з шапкою профілю та кнопками. Розмір масштабуємо за
// висотою екрана (text-4xl≈32px при rem=14).
type Props = { kicker?: string; title: string };

export function ScreenTitle({ kicker, title }: Props) {
  const titleSize = mvs(32);
  return (
    <View
      className="flex-row items-stretch gap-3 px-4"
      style={{ paddingTop: vs(18) }}
    >
      {/* Лаймова плашка зв'язує заголовок із фірмовим акцентом. */}
      <View className="w-1 rounded-full bg-lime" />
      <View className="flex-1">
        {kicker ? (
          <Text className="font-mono text-[10px] tracking-[3px] text-text-dim">
            {kicker}
          </Text>
        ) : null}
        <Text
          className="font-display tracking-[1px] text-text"
          style={{ fontSize: titleSize, lineHeight: titleSize }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
