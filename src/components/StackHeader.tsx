import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/useTheme";

// Шапка stack-екрана: кнопка «назад» + заголовок (root Stack без власних шапок).
export function StackHeader({ title }: { title: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center gap-2 border-b border-border bg-bg px-3 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityLabel="Назад"
        className="p-1 active:opacity-70"
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={28}
          color={colors.text}
        />
      </Pressable>
      <Text className="font-display text-2xl text-text">{title}</Text>
    </View>
  );
}
