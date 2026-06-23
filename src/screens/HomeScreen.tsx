import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { ScreenTitle } from "@/components/ScreenTitle";
import { getActiveProgram } from "@/db/programs";
import { getRoutineDetail } from "@/db/routines";
import { todayWeekday } from "@/lib/date";
import { mvs, vs } from "@/lib/responsive";
import { useTheme } from "@/theme/useTheme";
import { useWorkoutStore } from "@/workout/workout-store";

export function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const startFromRoutine = useWorkoutStore((s) => s.startFromRoutine);

  // Рутина сьогоднішнього дня активної програми (null — нема програми/відпочинок).
  const [todayRoutine, setTodayRoutine] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      getActiveProgram(profile.id).then((active) => {
        const day = active?.days.find((d) => d.weekday === todayWeekday());
        setTodayRoutine(
          day ? { id: day.routine_id, name: day.routine_name } : null
        );
      });
    }, [profile])
  );

  // Тап по боксу: є рутина дня → одразу запускаємо тренування за нею;
  // нема → ведемо до екрана програм, щоб вибрати/створити.
  const onPress = async () => {
    if (!todayRoutine) {
      router.push("/programs");
      return;
    }
    const d = await getRoutineDetail(todayRoutine.id);
    startFromRoutine(
      todayRoutine.id,
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

  return (
    <View className="flex-1">
      <ScreenTitle title="СЬОГОДНІ" />

      <View className="px-4">
        {/* Риска під заголовком */}
        <View className="h-px bg-border" style={{ marginTop: vs(14) }} />

        {/* Бокс «Сьогоднішнє тренування» — на пів ширини, притиснутий ліворуч. */}
        <Pressable
          onPress={onPress}
          className="self-start rounded-2xl border border-border bg-surface active:opacity-80"
          style={{
            width: "50%",
            marginTop: vs(16),
            padding: vs(14),
          }}
        >
          <View className="flex-row items-center" style={{ gap: vs(6) }}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={mvs(13)}
              color={colors.lime}
            />
            <Text className="font-mono text-[10px] tracking-[2px] text-lime">
              СЬОГОДНІШНЄ ТРЕНУВАННЯ
            </Text>
          </View>

          {todayRoutine ? (
            <>
              <Text
                className="font-display text-text"
                style={{ fontSize: mvs(18), marginTop: vs(8) }}
                numberOfLines={2}
              >
                {todayRoutine.name}
              </Text>
              <View
                className="flex-row items-center"
                style={{ gap: vs(4), marginTop: vs(8) }}
              >
                <MaterialCommunityIcons
                  name="play-circle"
                  size={mvs(18)}
                  color={colors.lime}
                />
                <Text
                  className="font-sans-strong text-lime"
                  style={{ fontSize: mvs(13) }}
                >
                  Почати
                </Text>
              </View>
            </>
          ) : (
            <Text
              className="font-sans text-text-dim"
              style={{ fontSize: mvs(14), marginTop: vs(8) }}
            >
              Програма не вибрана
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
