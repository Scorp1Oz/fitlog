import { Text, View } from "react-native";

// Єдиний заголовок екранів пейджера: лаймова акцент-плашка ліворуч,
// необов'язковий mono-кікер і великий display-заголовок. Лівий край — на
// одній вертикалі з шапкою профілю та кнопками.
type Props = { kicker?: string; title: string };

export function ScreenTitle({ kicker, title }: Props) {
  return (
    <View className="flex-row items-stretch gap-3 px-4 pt-5">
      {/* Лаймова плашка зв'язує заголовок із фірмовим акцентом. */}
      <View className="w-1 rounded-full bg-lime" />
      <View className="flex-1">
        {kicker ? (
          <Text className="font-mono text-[10px] tracking-[3px] text-text-dim">
            {kicker}
          </Text>
        ) : null}
        <Text className="font-display text-4xl tracking-[1px] text-text">
          {title}
        </Text>
      </View>
    </View>
  );
}
