import { Text, View } from "react-native";

export default function Analytics() {
  return (
    <View className="flex-1 items-center justify-center px-4">
      <Text className="font-mono text-[11px] tracking-[3px] text-lime">
        АНАЛІТИКА
      </Text>
      <Text className="mt-2 text-center font-sans text-text-muted">
        Графіки прогресу зʼявляться тут.
      </Text>
    </View>
  );
}
