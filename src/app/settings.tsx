import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Switch, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { StackHeader } from "@/components/StackHeader";
import { useLock } from "@/lock/LockContext";
import { useTheme } from "@/theme/useTheme";

export default function Settings() {
  const { logout } = useAuth();
  const { enabled, setEnabled, biometricsAvailable } = useLock();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="НАЛАШТУВАННЯ" />

      <View className="gap-6 px-4 pt-6">
        <Pressable
          onPress={() => router.push("/profile")}
          className="flex-row items-center justify-between border-b border-border pb-4 active:opacity-70"
        >
          <Text className="font-sans text-text">Редагувати профіль</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textDim}
          />
        </Pressable>

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
    </View>
  );
}
