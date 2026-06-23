import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Switch, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { StackHeader } from "@/components/StackHeader";
import { useLock } from "@/lock/LockContext";
import { useTheme } from "@/theme/useTheme";

export default function Settings() {
  const { logout, profile, updateProfile } = useAuth();
  const { enabled, setEnabled, biometricsAvailable } = useLock();
  const { colors } = useTheme();
  const router = useRouter();

  // Перемикач показує саму кнопку «Показові плани» на екрані Програм.
  const demoVisible = !profile?.demo_hidden;

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

        <View className="flex-row items-center justify-between border-b border-border pb-4">
          <View className="flex-1 pr-3">
            <Text className="font-sans text-text">Кнопка «Показові плани»</Text>
            <Text className="mt-0.5 font-mono text-[10px] text-text-dim">
              Показувати на екрані «Програми»
            </Text>
          </View>
          <Switch
            value={demoVisible}
            onValueChange={(v) => updateProfile({ demoHidden: !v })}
            trackColor={{ false: colors.faint, true: colors.limeTrack }}
            thumbColor={demoVisible ? colors.lime : colors.text}
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
