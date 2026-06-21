import { Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { ScreenTitle } from "@/components/ScreenTitle";

export function HomeScreen() {
  const { profile } = useAuth();

  return (
    <View className="flex-1">
      <ScreenTitle kicker="ГОЛОВНИЙ" title="СЬОГОДНІ" />
      <View className="px-4">
        <Text className="mt-3 font-sans text-base text-text-muted">
          Привіт, {profile?.display_name ?? profile?.username}!
        </Text>
      </View>
    </View>
  );
}
