import { Pressable, Switch, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { useLock } from "@/lock/LockContext";
import { useTheme } from "@/theme/useTheme";

export default function Settings() {
  const { profile, logout } = useAuth();
  const { enabled, setEnabled, biometricsAvailable } = useLock();
  const { colors } = useTheme();

  return (
    <View className="flex-1 gap-6 bg-bg px-4 pt-16">
      <View>
        <Text className="font-mono text-[10px] tracking-[3px] text-text-dim">
          НАЛАШТУВАННЯ
        </Text>
        <Text className="font-display text-4xl text-text">НАЛАШТУВАННЯ</Text>
        <Text className="mt-2 font-sans text-sm text-text-muted">
          {profile?.display_name ?? profile?.username}
        </Text>
      </View>

      <View className="flex-row items-center justify-between border-b border-border pb-4">
        <Text className="font-sans text-text">Замок при вході</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.faint, true: colors.limeTrack }}
          thumbColor={enabled ? colors.lime : colors.text}
          ios_backgroundColor={colors.faint}
        />
      </View>

      <Pressable
        onPress={logout}
        className="items-center rounded-md border border-border py-3 active:opacity-70"
      >
        <Text className="font-sans-strong text-orange">ВИЙТИ З АКАУНТА</Text>
      </Pressable>

      <Text className="font-mono text-[10px] text-text-dim">
        {biometricsAvailable
          ? "БІОМЕТРІЯ ДОСТУПНА"
          : "БІОМЕТРІЯ НЕДОСТУПНА (БРАУЗЕР / БЕЗ ЗАХИСТУ)"}
      </Text>
    </View>
  );
}
