import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { ScreenTitle } from "@/components/ScreenTitle";
import { getActiveProgram, type ProgramDay } from "@/db/programs";
import { getRoutineDetail } from "@/db/routines";
import { WEEKDAYS_FULL, todayWeekday } from "@/lib/date";
import { useTheme } from "@/theme/useTheme";
import { useWorkoutStore } from "@/workout/workout-store";

type Active = { id: number; name: string | null; days: ProgramDay[] } | null;

export function WorkoutScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const start = useWorkoutStore((s) => s.start);
  const startFromRoutine = useWorkoutStore((s) => s.startFromRoutine);

  const [active, setActive] = useState<Active>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      getActiveProgram(profile.id).then(setActive);
    }, [profile])
  );

  const startFreeWorkout = () => {
    start(); // не скидає, якщо сесія вже триває
    router.push("/workout-session");
  };

  // Запуск тренування за рутиною дня програми.
  const startRoutine = async (routineId: number) => {
    const d = await getRoutineDetail(routineId);
    startFromRoutine(
      routineId,
      d.exercises.map((ex) => ({
        exerciseId: ex.exercise_id,
        name: ex.name,
        targetSets: ex.target_sets ?? 1,
        repLow: ex.rep_low ?? 0,
        repHigh: ex.rep_high ?? 0,
      }))
    );
    router.push("/routine-run");
  };

  const today = todayWeekday();
  const byWeekday = new Map((active?.days ?? []).map((d) => [d.weekday, d]));

  return (
    <View className="flex-1">
      <ScreenTitle title="ТРЕНУВАННЯ" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <View className="px-4">
          {/* Риска між заголовком і активною програмою */}
          <View className="mt-3 h-px bg-border" />

          <Text className="mt-3 font-mono text-[11px] tracking-[3px] text-lime">
            АКТИВНА ПРОГРАМА
          </Text>

          {!active ? (
            <View className="items-center py-10">
              <Text className="text-center font-sans text-text-dim">
                Активна програма ще не вибрана
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-2 mt-1 font-display text-xl text-text">
                {active.name ?? "Програма"}
              </Text>

              {/* Тижневий розклад — як в описі програми. Сьогоднішній
                  тренувальний день натискний і запускає тренування. */}
              {WEEKDAYS_FULL.map((label, weekday) => {
                const day = byWeekday.get(weekday);
                const isToday = weekday === today;
                const canStart = isToday && !!day;
                return (
                  <Pressable
                    key={weekday}
                    disabled={!canStart}
                    onPress={() => day && startRoutine(day.routine_id)}
                    className={`mb-1.5 flex-row items-center rounded-xl border bg-surface px-4 py-2.5 ${
                      isToday ? "border-lime" : "border-border"
                    } ${canStart ? "active:opacity-80" : ""}`}
                  >
                    <Text
                      className={`w-28 font-sans-strong ${
                        isToday ? "text-lime" : "text-text"
                      }`}
                    >
                      {label}
                    </Text>
                    <Text
                      className={`flex-1 font-sans ${
                        day ? "text-text" : "text-text-dim"
                      }`}
                      numberOfLines={1}
                    >
                      {day ? day.routine_name : "Відпочинок"}
                    </Text>
                    {canStart ? (
                      <MaterialCommunityIcons
                        name="play-circle"
                        size={24}
                        color={colors.lime}
                      />
                    ) : isToday ? (
                      <Text className="font-mono text-[9px] tracking-[1px] text-lime">
                        СЬОГОДНІ
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </>
          )}

          {/* Риска між розкладом і кнопками */}
          <View className="mb-3 mt-1.5 h-px bg-border" />

          {/* Дії */}
          <View className="gap-2.5">
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => router.push("/programs")}
                className="flex-1 items-center rounded-2xl border border-lime py-4 active:opacity-70"
              >
                <Text className="font-sans-strong text-lime">ПРОГРАМИ</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/routines")}
                className="flex-1 items-center rounded-2xl border border-lime py-4 active:opacity-70"
              >
                <Text className="font-sans-strong text-lime">РУТИНИ</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/exercises")}
              className="items-center rounded-2xl border border-lime py-3 active:opacity-70"
            >
              <Text className="font-sans-strong text-lime">
                БІБЛІОТЕКА ВПРАВ
              </Text>
            </Pressable>

            <Pressable
              onPress={startFreeWorkout}
              className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
            >
              <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
                ПОЧАТИ ВІЛЬНЕ ТРЕНУВАННЯ
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
