// Плаваючий нижній таб-бар: заокруглений прямокутник, що «висить» над низом.
// Використовує headless-вкладки expo-router/ui (TabTrigger + asChild),
// тож вигляд повністю наш (дизайн-система: surface, lime-активний).
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TabTrigger, type TabTriggerSlotProps } from "expo-router/ui";
import { forwardRef } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/useTheme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type TabButtonProps = TabTriggerSlotProps & {
  icon: IconName;
  label: string;
};

// Окрема кнопка вкладки. isFocused приходить від TabTrigger автоматично.
const TabButton = forwardRef<View, TabButtonProps>(
  ({ isFocused, icon, label, ...props }, ref) => {
    const { colors } = useTheme();
    const color = isFocused ? colors.lime : colors.textDim;
    return (
      <Pressable
        ref={ref}
        {...props}
        accessibilityLabel={label}
        hitSlop={8}
        className="items-center justify-center py-1"
      >
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </Pressable>
    );
  }
);
TabButton.displayName = "TabButton";

export function FloatingTabBar() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      {/* gap між іконками = px від країв → однакові відступи; ширина по контенту. */}
      <View className="flex-row items-center gap-7 rounded-3xl border border-border bg-surface px-7 py-3">
        <TabTrigger name="index" asChild>
          <TabButton icon="home-variant-outline" label="ГОЛОВНИЙ" />
        </TabTrigger>
        <TabTrigger name="workout" asChild>
          <TabButton icon="dumbbell" label="ТРЕНУВАННЯ" />
        </TabTrigger>
        <TabTrigger name="settings" asChild>
          <TabButton icon="cog-outline" label="НАЛАШТУВАННЯ" />
        </TabTrigger>
      </View>
    </View>
  );
}
