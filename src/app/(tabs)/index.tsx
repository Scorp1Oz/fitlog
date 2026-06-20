import { Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";

export default function Home() {
  const { profile } = useAuth();

  return (
    <View className="flex-1 px-4 pt-6">
      <Text className="font-mono text-[10px] tracking-[3px] text-text-dim">
        ГОЛОВНИЙ
      </Text>
      <Text className="font-display text-4xl text-text">СЬОГОДНІ</Text>
      <Text className="mt-2 font-sans text-base text-text-muted">
        Привіт, {profile?.display_name ?? profile?.username}!
      </Text>
    </View>
  );
}
