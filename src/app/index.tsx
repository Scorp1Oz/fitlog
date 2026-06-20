import { Pressable, Switch, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { useLock } from "@/lock/LockContext";

export default function Index() {
  const { profile, logout } = useAuth();
  // Тимчасові контролі замка (поки немає окремого екрана Налаштувань).
  const { enabled, setEnabled, lockNow, biometricsAvailable } = useLock();

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg px-6">
      <Text className="font-display text-5xl text-lime">FITLOG</Text>
      <Text className="font-sans text-base text-text">
        Привіт, {profile?.display_name ?? profile?.username}!
      </Text>

      <View className="mt-6 w-full max-w-xs gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-text">Замок при вході</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>

        <Pressable
          onPress={lockNow}
          className="items-center border border-border py-3 active:opacity-70"
        >
          <Text className="font-sans-strong text-text">ЗАБЛОКУВАТИ ЗАРАЗ</Text>
        </Pressable>

        <Pressable
          onPress={logout}
          className="items-center border border-border py-3 active:opacity-70"
        >
          <Text className="font-sans-strong text-orange">ВИЙТИ З АКАУНТА</Text>
        </Pressable>

        <Text className="text-center font-mono text-[10px] text-text-dim">
          {biometricsAvailable
            ? "БІОМЕТРІЯ ДОСТУПНА"
            : "БІОМЕТРІЯ НЕДОСТУПНА (БРАУЗЕР / БЕЗ ЗАХИСТУ)"}
        </Text>
      </View>
    </View>
  );
}
