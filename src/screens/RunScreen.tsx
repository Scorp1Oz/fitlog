import { Text, View } from "react-native";

import { ScreenTitle } from "@/components/ScreenTitle";

export function RunScreen() {
  return (
    <View className="flex-1">
      <ScreenTitle kicker="КАРДІО" title="БІГ" />
      <View className="px-4">
        <Text className="mt-3 font-sans text-base text-text-muted">
          Скоро. GPS-трекінг бігу буде окремою фазою.
        </Text>
      </View>
    </View>
  );
}
