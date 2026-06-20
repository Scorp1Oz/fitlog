import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, Text, TextInput, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { StackHeader } from "@/components/StackHeader";
import { Avatar } from "@/profile/Avatar";
import { useTheme } from "@/theme/useTheme";

export default function ProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [name, setName] = useState(profile?.display_name ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile?.avatar_uri ?? null
  );
  const [busy, setBusy] = useState(false);

  const previewName = name.trim() || profile?.username || "";

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Доступ", "Дозвольте доступ до фото, щоб обрати аватар.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const picked = result.assets[0].uri;

    // Веб не має documentDirectory — лишаємо URI як є.
    if (Platform.OS === "web") {
      setAvatarUri(picked);
      return;
    }

    // На пристрої копіюємо фото в постійне сховище додатка, у БД пишемо лише URI.
    try {
      const ext = picked.split("?")[0].split(".").pop() || "jpg";
      const dest = new File(Paths.document, `avatar_${Date.now()}.${ext}`);
      await new File(picked).copy(dest);
      setAvatarUri(dest.uri);
    } catch {
      setAvatarUri(picked); // запасний варіант — тимчасовий URI
    }
  };

  const save = async () => {
    setBusy(true);
    await updateProfile({ displayName: name.trim() || null, avatarUri });
    setBusy(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="ПРОФІЛЬ" />

      <View className="items-center gap-6 px-4 pt-8">
        <Pressable
          onPress={pickPhoto}
          className="items-center gap-2 active:opacity-80"
        >
          <Avatar uri={avatarUri} name={previewName} size={96} />
          <Text className="font-mono text-[10px] tracking-[1px] text-lime">
            ЗМІНИТИ ФОТО
          </Text>
        </Pressable>

        <View className="w-full gap-2">
          <Text className="font-mono text-[10px] tracking-[2px] text-text">
            ІМ'Я
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={profile?.username}
            placeholderTextColor={colors.textDim}
            className="rounded-md border-b border-border bg-surface px-3 py-3 font-sans text-text"
          />
          <Text className="font-mono text-[10px] text-text-dim">
            @{profile?.username} · логін незмінний
          </Text>
        </View>

        <Pressable
          onPress={save}
          disabled={busy}
          className="w-full items-center rounded-md bg-lime py-3 active:opacity-80"
        >
          <Text className="font-sans-strong text-base text-on-lime">
            ЗБЕРЕГТИ
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
