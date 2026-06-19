import { Text, View } from "react-native";

export default function Index() {
  // Тимчасова перевірка NativeWind: чорний фон, текст по центру, лаймовий колір.
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg">
      <Text className="font-display text-5xl text-lime">FITLOG</Text>
      <Text className="font-sans text-base text-text">NativeWind + шрифти працюють</Text>
      <Text className="font-mono text-xs text-text-dim">IBM PLEX MONO · 12:34</Text>
    </View>
  );
}
