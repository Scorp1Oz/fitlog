import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { LimeGlow } from "@/components/LimeGlow";
import { ScreenTitle } from "@/components/ScreenTitle";
import { getActiveProgram, type ProgramDay } from "@/db/programs";
import { WEEKDAYS_FULL, todayWeekday } from "@/lib/date";
import { mvs, vs } from "@/lib/responsive";
import { useTheme } from "@/theme/useTheme";
import { useStartRoutine } from "@/workout/useStartRoutine";
import { useWorkoutStore } from "@/workout/workout-store";

type Active = { id: number; name: string | null; days: ProgramDay[] } | null;

export function WorkoutScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const start = useWorkoutStore((s) => s.start);
  const startRoutine = useStartRoutine();

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

  const today = todayWeekday();
  const byWeekday = new Map((active?.days ?? []).map((d) => [d.weekday, d]));

  return (
    <View className="flex-1">
      <ScreenTitle title="ТРЕНУВАННЯ" />

      {/* Без скролу: flex-лейаут, що вписується в екран (масштаб тримає розміри).
          Спейсер нижче притискає кнопки донизу; paddingBottom — під таб-бар. */}
      <View className="flex-1 px-4" style={{ paddingBottom: vs(120) }}>
        <View>
          {/* Риска між заголовком і активною програмою */}
          <View className="h-px bg-border" style={{ marginTop: vs(10) }} />

          <Text
            className="font-mono text-[11px] tracking-[3px] text-lime"
            style={{ marginTop: vs(10) }}
          >
            АКТИВНА ПРОГРАМА
          </Text>

          {!active ? (
            <View className="items-center" style={{ paddingVertical: vs(36) }}>
              <Text className="text-center font-sans text-text-dim">
                Активна програма ще не вибрана
              </Text>
            </View>
          ) : (
            <>
              <Text
                className="font-display text-text"
                style={{
                  fontSize: mvs(18),
                  marginTop: vs(4),
                  marginBottom: vs(8),
                }}
              >
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
                    className={`flex-row items-center rounded-xl border bg-surface px-4 ${
                      isToday ? "border-lime" : "border-border"
                    } ${canStart ? "active:opacity-80" : ""}`}
                    style={{ marginBottom: vs(6), paddingVertical: vs(9) }}
                  >
                    <Text
                      className={`w-28 font-sans-strong ${
                        isToday ? "text-lime" : "text-text"
                      }`}
                      style={{ fontSize: mvs(14) }}
                    >
                      {label}
                    </Text>
                    <Text
                      className={`flex-1 font-sans ${
                        day ? "text-text" : "text-text-dim"
                      }`}
                      style={{ fontSize: mvs(14) }}
                      numberOfLines={1}
                    >
                      {day ? day.routine_name : "Відпочинок"}
                    </Text>
                    {canStart ? (
                      <MaterialCommunityIcons
                        name="play-circle"
                        size={mvs(22)}
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
        </View>

        {/* Спейсер: притискає кнопки донизу, поглинає вільне місце на високих
            екранах (на коротких стиснеться до 0). */}
        <View className="flex-1" />

        <View>
          {/* Риска між розкладом і кнопками */}
          <View
            className="h-px bg-border"
            style={{ marginTop: vs(6), marginBottom: vs(11) }}
          />

          {/* Дії */}
          <View style={{ gap: vs(10) }}>
            <View className="flex-row" style={{ gap: vs(10) }}>
              <Pressable
                onPress={() => router.push("/programs")}
                className="flex-1 items-center rounded-2xl border border-lime active:opacity-70"
                style={{ paddingVertical: vs(13) }}
              >
                <Text className="font-sans-strong text-lime" style={{ fontSize: mvs(14) }}>
                  ПРОГРАМИ
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/routines")}
                className="flex-1 items-center rounded-2xl border border-lime active:opacity-70"
                style={{ paddingVertical: vs(13) }}
              >
                <Text className="font-sans-strong text-lime" style={{ fontSize: mvs(14) }}>
                  РУТИНИ
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/exercises")}
              className="items-center rounded-2xl border border-lime active:opacity-70"
              style={{ paddingVertical: vs(11) }}
            >
              <Text className="font-sans-strong text-lime" style={{ fontSize: mvs(14) }}>
                БІБЛІОТЕКА ВПРАВ
              </Text>
            </Pressable>

            <LimeGlow radius={16}>
              <Pressable
                onPress={startFreeWorkout}
                className="items-center rounded-2xl bg-lime active:opacity-80"
                style={{ paddingVertical: vs(14) }}
              >
                <Text
                  className="font-sans-strong tracking-[1px] text-on-lime"
                  style={{ fontSize: mvs(15) }}
                >
                  ПОЧАТИ ВІЛЬНЕ ТРЕНУВАННЯ
                </Text>
              </Pressable>
            </LimeGlow>
          </View>
        </View>
      </View>
    </View>
  );
}
