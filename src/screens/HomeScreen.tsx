import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useAuth } from "@/auth/AuthContext";
import { ScreenTitle } from "@/components/ScreenTitle";
import { getActiveProgram } from "@/db/programs";
import { listRunsByDay } from "@/db/runs";
import { listSessionsByDay } from "@/db/sessions";
import { MONTHS_GEN, WEEKDAYS_FULL, todayWeekday } from "@/lib/date";
import { formatDistance } from "@/lib/geo";
import { mvs, vs } from "@/lib/responsive";
import { kg } from "@/lib/strength";
import { useTheme } from "@/theme/useTheme";
import { useStartRoutine } from "@/workout/useStartRoutine";
import { useWorkoutStore } from "@/workout/workout-store";

type WeekStats = { workouts: number; tonnage: number; distanceM: number };

// Початок (Пн 00:00) і кінець поточного тижня — для зведення «цей тиждень».
function weekRange(): [number, number] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - todayWeekday());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return [start.getTime(), end.getTime()];
}

// Тоннаж із розділювачем тисяч: 12500 → «12 500».
function fmtTonnage(n: number): string {
  return kg(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function HomeScreen({ onGoToRun }: { onGoToRun?: () => void }) {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const startFreeWorkout = useWorkoutStore((s) => s.start);
  const startRoutine = useStartRoutine();

  // Рутина сьогоднішнього дня активної програми (null — нема рутини на сьогодні).
  const [todayRoutine, setTodayRoutine] = useState<{
    id: number;
    name: string;
  } | null>(null);
  // Чи взагалі обрана активна програма — щоб відрізнити «відпочинок за
  // розкладом» (програма є) від «програму не вибрано».
  const [hasProgram, setHasProgram] = useState(false);
  const [week, setWeek] = useState<WeekStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;

      getActiveProgram(profile.id).then((active) => {
        setHasProgram(!!active);
        const day = active?.days.find((d) => d.weekday === todayWeekday());
        setTodayRoutine(
          day ? { id: day.routine_id, name: day.routine_name } : null
        );
      });

      const [from, to] = weekRange();
      Promise.all([
        listSessionsByDay(profile.id, from, to),
        listRunsByDay(profile.id, from, to),
      ]).then(([sessions, runs]) => {
        setWeek({
          workouts: sessions.length,
          tonnage: sessions.reduce((n, s) => n + (s.volume ?? 0), 0),
          distanceM: runs.reduce((n, r) => n + r.distance_m, 0),
        });
      });
    }, [profile])
  );

  // Тап по герою:
  //   • є рутина дня        → запускаємо тренування за нею;
  //   • відпочинок (є прог.) → герой неактивний (тапати нема куди);
  //   • нема програми       → ведемо до вибору програми.
  const onPressToday = () => {
    if (todayRoutine) {
      startRoutine(todayRoutine.id);
    } else if (!hasProgram) {
      router.push("/programs");
    }
  };

  const onFreeWorkout = () => {
    startFreeWorkout(); // не скидає, якщо сесія вже триває
    router.push("/workout-session");
  };

  // Відпочинок за розкладом: програма є, але рутини на сьогодні немає.
  const isRest = hasProgram && !todayRoutine;

  // «ВІВТОРОК · 24 ЧЕРВНЯ» — кікер під заголовком.
  const today = new Date();
  const dateKicker = `${WEEKDAYS_FULL[todayWeekday()]} · ${today.getDate()} ${
    MONTHS_GEN[today.getMonth()]
  }`.toUpperCase();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: vs(120) }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle kicker={dateKicker} title="СЬОГОДНІ" />

      <View className="px-4" style={{ marginTop: vs(18), gap: vs(12) }}>
        {/* ── Герой: сьогоднішнє тренування / відпочинок ── */}
        <Animated.View entering={FadeInDown.duration(420).delay(60)}>
          <Pressable
            onPress={onPressToday}
            disabled={isRest}
            className={`overflow-hidden rounded-3xl border bg-surface ${
              isRest ? "border-border" : "border-lime active:opacity-80"
            }`}
            style={{ padding: vs(18) }}
          >
            <View className="flex-row items-center" style={{ gap: vs(6) }}>
              <MaterialCommunityIcons
                name={isRest ? "sleep" : "calendar-today"}
                size={mvs(13)}
                color={isRest ? colors.textDim : colors.lime}
              />
              <Text
                className="font-mono text-[10px] tracking-[2px]"
                style={{ color: isRest ? colors.textDim : colors.lime }}
              >
                {isRest ? "СЬОГОДНІ — ВІДПОЧИНОК" : "СЬОГОДНІШНЄ ТРЕНУВАННЯ"}
              </Text>
            </View>

            {todayRoutine ? (
              <>
                <Text
                  className="font-display text-text"
                  style={{ fontSize: mvs(26), marginTop: vs(10) }}
                  numberOfLines={2}
                >
                  {todayRoutine.name}
                </Text>
                <View
                  className="flex-row items-center self-start rounded-full bg-lime"
                  style={{
                    gap: vs(4),
                    marginTop: vs(14),
                    paddingHorizontal: vs(16),
                    paddingVertical: vs(8),
                  }}
                >
                  <MaterialCommunityIcons
                    name="play"
                    size={mvs(16)}
                    color={colors.onLime}
                  />
                  <Text
                    className="font-sans-strong tracking-[1px] text-on-lime"
                    style={{ fontSize: mvs(13) }}
                  >
                    ПОЧАТИ
                  </Text>
                </View>
              </>
            ) : isRest ? (
              <>
                <Text
                  className="font-display text-text"
                  style={{ fontSize: mvs(22), marginTop: vs(10) }}
                >
                  День відпочинку
                </Text>
                <Text
                  className="font-sans text-text-dim"
                  style={{ fontSize: mvs(13), marginTop: vs(4) }}
                >
                  За розкладом програми сьогодні тренування немає. Відновлюйся —
                  стрік не зіб'ється 💤
                </Text>
              </>
            ) : (
              <>
                <Text
                  className="font-display text-text"
                  style={{ fontSize: mvs(22), marginTop: vs(10) }}
                >
                  Програму не вибрано
                </Text>
                <Text
                  className="font-sans text-text-dim"
                  style={{ fontSize: mvs(13), marginTop: vs(4) }}
                >
                  Обери або створи програму, щоб бачити тренування дня.
                </Text>
                <View
                  className="flex-row items-center self-start rounded-full border border-lime"
                  style={{
                    gap: vs(4),
                    marginTop: vs(14),
                    paddingHorizontal: vs(16),
                    paddingVertical: vs(8),
                  }}
                >
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={mvs(15)}
                    color={colors.lime}
                  />
                  <Text
                    className="font-sans-strong tracking-[1px] text-lime"
                    style={{ fontSize: mvs(13) }}
                  >
                    ОБРАТИ ПРОГРАМУ
                  </Text>
                </View>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* ── Швидкі дії: вільне тренування + пробіжка ── */}
        <Animated.View
          entering={FadeInDown.duration(420).delay(140)}
          className="flex-row"
          style={{ gap: vs(12) }}
        >
          <QuickAction
            icon="lightning-bolt"
            label="Вільне"
            sub="тренування"
            color={colors.lime}
            onPress={onFreeWorkout}
          />
          <QuickAction
            icon="run-fast"
            label="Пробіжка"
            sub="кардіо"
            color={colors.lime}
            onPress={() => onGoToRun?.()}
          />
        </Animated.View>

        {/* ── Цей тиждень ── */}
        <Animated.View entering={FadeInDown.duration(420).delay(220)}>
          <Text
            className="font-mono text-[11px] tracking-[3px] text-text-dim"
            style={{ marginTop: vs(6), marginBottom: vs(10) }}
          >
            ЦЕЙ ТИЖДЕНЬ
          </Text>
          <View className="flex-row" style={{ gap: vs(10) }}>
            <WeekStat
              value={week ? String(week.workouts) : "—"}
              label="ТРЕНУВАНЬ"
            />
            <WeekStat
              value={week ? fmtTonnage(week.tonnage) : "—"}
              label="ТОННАЖ, КГ"
            />
            <WeekStat
              value={week ? formatDistance(week.distanceM) : "—"}
              label="ПРОБІГ"
            />
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

// Квадратна плитка швидкої дії: іконка + двоярусний підпис.
function QuickAction({
  icon,
  label,
  sub,
  color,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  sub: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-2xl border border-lime bg-surface active:opacity-70"
      style={{ padding: vs(14) }}
    >
      <MaterialCommunityIcons name={icon} size={mvs(26)} color={color} />
      <Text
        className="font-sans-strong text-text"
        style={{ fontSize: mvs(15), marginTop: vs(10) }}
      >
        {label}
      </Text>
      <Text
        className="font-mono text-[10px] tracking-[1px] text-text-dim"
        style={{ marginTop: vs(2) }}
      >
        {sub.toUpperCase()}
      </Text>
    </Pressable>
  );
}

// Плитка тижневого показника: велика цифра + моно-підпис.
function WeekStat({ value, label }: { value: string; label: string }) {
  return (
    <View
      className="flex-1 items-center rounded-2xl border border-border bg-surface"
      style={{ paddingVertical: vs(14) }}
    >
      <Text
        className="font-display text-lime"
        style={{ fontSize: mvs(22), lineHeight: mvs(24) }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        className="font-mono text-[9px] tracking-[1px] text-text-dim"
        style={{ marginTop: vs(4) }}
      >
        {label}
      </Text>
    </View>
  );
}
