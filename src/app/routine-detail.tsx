import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useConfirm } from "@/components/ConfirmDialog";
import { LimeGlow } from "@/components/LimeGlow";
import { StackHeader } from "@/components/StackHeader";
import {
  deleteRoutine,
  getRoutineDetail,
  type RoutineExercise,
} from "@/db/routines";
import { formatTarget } from "@/lib/strength";
import { useTheme } from "@/theme/useTheme";
import { useStartRoutine } from "@/workout/useStartRoutine";

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);
  const confirm = useConfirm((s) => s.ask);
  const startRoutine = useStartRoutine();

  const [name, setName] = useState<string | null>(null);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!routineId) return;
      getRoutineDetail(routineId).then((d) => {
        setName(d.routine?.name ?? null);
        setExercises(d.exercises);
      });
    }, [routineId])
  );

  const onStart = () => startRoutine(routineId);

  const onDelete = async () => {
    const ok = await confirm({
      title: "Видалити рутину?",
      message: "Шаблон буде видалено. Історія тренувань не зміниться.",
      confirmText: "Видалити",
      cancelText: "Ні",
      destructive: true,
    });
    if (ok) {
      await deleteRoutine(routineId);
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={(name || "РУТИНА").toUpperCase()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Дії редагування / видалення */}
        <View className="mb-4 flex-row gap-3">
          <Pressable
            onPress={() => router.push(`/routine-edit?id=${routineId}`)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border py-3 active:opacity-70"
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text className="font-sans text-text-muted">Редагувати</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border py-3 active:opacity-70"
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color={colors.orange}
            />
            <Text className="font-sans text-orange">Видалити</Text>
          </Pressable>
        </View>

        <Text className="mb-2 font-mono text-[11px] tracking-[3px] text-lime">
          ВПРАВИ
        </Text>

        {exercises.length === 0 ? (
          <Text className="font-sans text-text-dim">
            У цій рутині ще немає вправ.
          </Text>
        ) : (
          exercises.map((ex, i) => {
            const label = formatTarget(ex.target_sets, ex.rep_low, ex.rep_high);
            return (
              <View
                key={ex.exercise_id}
                className="mb-2 flex-row items-center rounded-xl border border-border bg-surface px-4 py-3"
              >
                <Text className="w-7 font-mono text-sm text-text-dim">
                  {i + 1}
                </Text>
                <Text
                  className="flex-1 font-sans text-text"
                  numberOfLines={1}
                >
                  {ex.name}
                </Text>
                {label ? (
                  <Text className="font-mono text-[11px] text-text-muted">
                    {label}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Низ: почати тренування за рутиною (свічіння — лише коли активна) */}
      <View className="px-4 pt-2 pb-8">
        <LimeGlow enabled={exercises.length > 0}>
          <Pressable
            onPress={onStart}
            disabled={exercises.length === 0}
            className={`items-center rounded-2xl py-4 ${
              exercises.length === 0
                ? "bg-surface-2"
                : "bg-lime active:opacity-80"
            }`}
          >
            <Text
              className={`font-sans-strong text-base tracking-[1px] ${
                exercises.length === 0 ? "text-text-dim" : "text-on-lime"
              }`}
            >
              ПОЧАТИ ТРЕНУВАННЯ
            </Text>
          </Pressable>
        </LimeGlow>
      </View>
    </View>
  );
}
