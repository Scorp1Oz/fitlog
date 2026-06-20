import { Text, View } from "react-native";

export default function Workout() {
  return (
    <View className="flex-1 bg-bg px-4 pt-16">
      <Text className="font-mono text-[10px] tracking-[3px] text-text-dim">
        ТРЕНУВАННЯ
      </Text>
      <Text className="font-display text-4xl text-text">ТРЕНУВАННЯ</Text>
      <Text className="mt-2 font-sans text-base text-text-muted">
        Тут буде логування підходів. Скоро.
      </Text>
    </View>
  );
}
