import { MaterialCommunityIcons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { StackHeader } from "@/components/StackHeader";
import { createCustomExercise } from "@/db/exercises";
import { MUSCLE_ORDER, tMuscle } from "@/exercises/translations";
import { useTheme } from "@/theme/useTheme";

export default function ExerciseNewScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]); // ключі м'язів
  const [busy, setBusy] = useState(false);

  const toggle = (m: string) =>
    setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Доступ", "Дозвольте доступ до фото, щоб обрати картинку.");
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
    if (Platform.OS === "web") {
      setImageUri(picked);
      return;
    }
    try {
      const ext = picked.split("?")[0].split(".").pop() || "jpg";
      const dest = new File(Paths.document, `exercise_${Date.now()}.${ext}`);
      await new File(picked).copy(dest);
      setImageUri(dest.uri);
    } catch {
      setImageUri(picked);
    }
  };

  const save = async () => {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert("Назва", "Вкажи назву вправи.");
      return;
    }
    setBusy(true);
    await createCustomExercise(profile.id, {
      name: name.trim(),
      muscle: selected[0] ?? null, // основна група = перша обрана
      imageUri,
    });
    setBusy(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="НОВА ВПРАВА" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Картинка */}
        <View className="items-center">
          <Pressable
            onPress={pickPhoto}
            className="h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface active:opacity-80"
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View className="items-center gap-1">
                <MaterialCommunityIcons
                  name="image-plus"
                  size={28}
                  color={colors.textDim}
                />
                <Text className="font-mono text-[10px] tracking-[1px] text-text-dim">
                  ФОТО
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Назва */}
        <View className="mt-6 gap-2">
          <Text className="font-mono text-[10px] tracking-[2px] text-text">
            НАЗВА
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Напр. Жим гантелей лежачи"
            placeholderTextColor={colors.textDim}
            className="rounded-md border-b border-border bg-surface px-3 py-3 font-sans text-text"
          />
        </View>

        {/* Категорії (вибір, не введення) */}
        <View className="mt-6 gap-2">
          <Text className="font-mono text-[10px] tracking-[2px] text-text">
            КАТЕГОРІЇ
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {MUSCLE_ORDER.map((m) => {
              const active = selected.includes(m);
              return (
                <Pressable
                  key={m}
                  onPress={() => toggle(m)}
                  className={`rounded-full border px-3 py-1.5 active:opacity-70 ${
                    active ? "border-lime bg-lime" : "border-border"
                  }`}
                >
                  <Text
                    className={`font-sans text-sm ${
                      active ? "text-on-lime" : "text-text-muted"
                    }`}
                  >
                    {tMuscle(m)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="font-mono text-[10px] text-text-dim">
            Перша обрана — основна група (за нею фільтр).
          </Text>
        </View>

        <Pressable
          onPress={save}
          disabled={busy}
          className="mt-8 items-center rounded-2xl bg-lime py-4 active:opacity-80"
        >
          <Text className="font-sans-strong text-base text-on-lime">
            ЗБЕРЕГТИ ВПРАВУ
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
