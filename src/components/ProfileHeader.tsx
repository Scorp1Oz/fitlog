import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/profile/Avatar";
import { getDisplayName } from "@/profile/profile-helpers";
import { ProfileModal } from "@/profile/ProfileModal";
import { useTheme } from "@/theme/useTheme";

// Постійна шапка над усіма вкладками. Тап по аватару/імені → модалка профілю,
// по шестерні → Налаштування.
export function ProfileHeader() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const name = getDisplayName(profile);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <View
      className="flex-row items-center justify-between border-b border-border bg-bg px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable
        onPress={() => setModalOpen(true)}
        className="flex-row items-center gap-3 active:opacity-70"
      >
        <Avatar uri={profile?.avatar_uri ?? null} name={name} size={40} />
        <View>
          <Text className="font-sans-strong text-base text-text">{name}</Text>
          <Text className="font-mono text-[10px] text-text-dim">
            @{profile?.username}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => router.push("/settings")}
        hitSlop={8}
        accessibilityLabel="Налаштування"
        className="p-1 active:opacity-70"
      >
        <MaterialCommunityIcons
          name="cog-outline"
          size={24}
          color={colors.textDim}
        />
      </Pressable>

      <ProfileModal visible={modalOpen} onClose={() => setModalOpen(false)} />
    </View>
  );
}
