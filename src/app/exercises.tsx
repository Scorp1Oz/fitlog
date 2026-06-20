import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { StackHeader } from "@/components/StackHeader";
import {
  listExercises,
  listMuscleGroups,
  type ExerciseListItem,
} from "@/db/exercises";
import { tEquipment, tMuscle } from "@/exercises/translations";
import { useTheme } from "@/theme/useTheme";

export default function ExercisesScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [items, setItems] = useState<ExerciseListItem[]>([]);

  useEffect(() => {
    listMuscleGroups().then(setMuscles);
  }, []);

  useEffect(() => {
    listExercises({ search, muscle }).then(setItems);
  }, [search, muscle]);

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="ВПРАВИ" />

      <View className="px-4 pt-4">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Пошук вправи…"
          placeholderTextColor={colors.textDim}
          className="rounded-md border-b border-border bg-surface px-3 py-3 font-sans text-text"
        />
      </View>

      <View className="py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          <Chip
            label="ВСІ"
            active={muscle === null}
            onPress={() => setMuscle(null)}
          />
          {muscles.map((m) => (
            <Chip
              key={m}
              label={tMuscle(m).toUpperCase()}
              active={muscle === m}
              onPress={() => setMuscle(m)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 py-3">
            {item.preview ? (
              <Image
                source={{ uri: item.preview }}
                style={{ width: 48, height: 48, borderRadius: 2 }}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View
                style={{ width: 48, height: 48, borderRadius: 2 }}
                className="bg-surface-2"
              />
            )}
            <View className="flex-1">
              <Text className="font-sans-strong text-text" numberOfLines={1}>
                {item.name_uk?.trim() || item.name}
              </Text>
              <Text
                className="font-mono text-[10px] text-text-dim"
                numberOfLines={1}
              >
                {tMuscle(item.primary_muscle)} · {tEquipment(item.equipment)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="px-4 py-10 text-center font-sans text-text-muted">
            Нічого не знайдено
          </Text>
        }
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1 ${
        active ? "border-lime" : "border-border"
      }`}
    >
      <Text
        className={`font-mono text-[10px] tracking-[1px] ${
          active ? "text-lime" : "text-text-dim"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
