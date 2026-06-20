import { Text, View } from "react-native";

export function RunScreen() {
  return (
    <View className="flex-1 px-4 pt-6">
      <Text className="font-mono text-[10px] tracking-[3px] text-text-dim">
        БІГ
      </Text>
      <Text className="font-display text-4xl text-text">БІГ</Text>
      <Text className="mt-2 font-sans text-base text-text-muted">
        Скоро. GPS-трекінг бігу буде окремою фазою.
      </Text>
    </View>
  );
}
