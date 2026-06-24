import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { getActiveProgram } from "@/db/programs";
import { listRunDates } from "@/db/runs";
import { listWorkoutDates } from "@/db/sessions";
import { MONTHS_NOM, toDateKey, WEEKDAYS_SHORT } from "@/lib/date";
import { mvs } from "@/lib/responsive";
import { classifyDay, computeStreak, type DayMark } from "@/lib/streak";
import { useTheme } from "@/theme/useTheme";

// ~рік активностей вистачає, щоб точно порахувати поточний стрік.
const STREAK_WINDOW_MS = 400 * 86_400_000;

// Відмінювання «день/дні/днів».
function plural(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "день";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "дні";
  return "днів";
}

export function StreakModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [activity, setActivity] = useState<Set<string>>(new Set());
  const [trainingWeekdays, setTrainingWeekdays] = useState<number[] | null>(
    null
  );

  // Завантажуємо широке вікно активностей (для лічильника й календаря) +
  // розклад активної програми. Оновлюємо щоразу при відкритті модалки.
  const load = useCallback(() => {
    if (!profile) return;
    const now = Date.now();
    Promise.all([
      listWorkoutDates(profile.id, now - STREAK_WINDOW_MS, now + 86_400_000),
      listRunDates(profile.id, now - STREAK_WINDOW_MS, now + 86_400_000),
      getActiveProgram(profile.id),
    ]).then(([workouts, runs, program]) => {
      const s = new Set<string>();
      for (const t of workouts) s.add(toDateKey(new Date(t)));
      for (const t of runs) s.add(toDateKey(new Date(t)));
      setActivity(s);
      setTrainingWeekdays(program ? program.days.map((d) => d.weekday) : null);
    });
  }, [profile]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const streak = computeStreak(activity, trainingWeekdays);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // Сітка місяця (понеділок першим).
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const openDay = (d: number) => {
    onClose();
    router.push(`/day?date=${toDateKey(new Date(year, month, d))}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/70 px-6"
        onPress={onClose}
      >
        {/* Зупиняємо проброс тапу, щоб тап по картці не закривав модалку. */}
        <Pressable
          className="w-full rounded-3xl border border-border bg-surface p-5"
          onPress={() => {}}
        >
          {/* Шапка: великий вогник + лічильник */}
          <View className="items-center" style={{ marginBottom: mvs(14) }}>
            <MaterialCommunityIcons
              name={streak > 0 ? "fire" : "fire-off"}
              size={mvs(44)}
              color={streak > 0 ? colors.lime : colors.textDim}
            />
            <Text
              className="font-display text-text"
              style={{ fontSize: mvs(30), marginTop: mvs(4) }}
            >
              {streak > 0 ? `${streak} ${plural(streak)} поспіль` : "Стрік згас"}
            </Text>
            <Text className="mt-1 font-mono text-[10px] tracking-[2px] text-text-dim">
              {streak > 0 ? "ТАК ТРИМАТИ" : "ПОЧНИ СЬОГОДНІ"}
            </Text>
          </View>

          {/* Місяць + навігація */}
          <View className="flex-row items-center justify-between">
            <Pressable onPress={prevMonth} hitSlop={8} className="p-1 active:opacity-60">
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={colors.textMuted}
              />
            </Pressable>
            <Text className="font-display text-lg tracking-[1px] text-text">
              {MONTHS_NOM[month].toUpperCase()} {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={8} className="p-1 active:opacity-60">
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          {/* Дні тижня */}
          <View className="mt-3 flex-row">
            {WEEKDAYS_SHORT.map((w) => (
              <View key={w} className="flex-1 items-center">
                <Text className="font-mono text-[10px] text-text-dim">{w}</Text>
              </View>
            ))}
          </View>

          {/* Сітка днів */}
          {weeks.map((week, wi) => (
            <View key={wi} className="mt-1 flex-row">
              {week.map((d, di) => {
                if (d === null)
                  return <View key={di} className="aspect-square flex-1" />;
                const date = new Date(year, month, d);
                const mark = classifyDay(date, activity, trainingWeekdays);
                return (
                  <View key={di} className="aspect-square flex-1 p-0.5">
                    <DayCell
                      day={d}
                      mark={mark}
                      colors={colors}
                      onPress={mark === "done" ? () => openDay(d) : undefined}
                    />
                  </View>
                );
              })}
            </View>
          ))}

          {/* Легенда */}
          <View
            className="mt-4 flex-row items-center justify-center"
            style={{ gap: mvs(14) }}
          >
            <Legend>
              <MaterialCommunityIcons name="fire" size={12} color={colors.lime} />
              <Text className="font-mono text-[9px] text-text-dim"> активність</Text>
            </Legend>
            <Legend>
              <View className="h-2 w-2 rounded-full bg-faint" />
              <Text className="font-mono text-[9px] text-text-dim"> відпочинок</Text>
            </Legend>
            <Legend>
              <View className="h-2 w-2 rounded-full border border-orange" />
              <Text className="font-mono text-[9px] text-text-dim"> пропуск</Text>
            </Legend>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return <View className="flex-row items-center">{children}</View>;
}

// Клітинка дня: вогник для активних, нейтральна крапка для відпочинку,
// контур для пропусків, обведення для «сьогодні».
function DayCell({
  day,
  mark,
  colors,
  onPress,
}: {
  day: number;
  mark: DayMark;
  colors: { lime: string; onLime: string; orange: string; textDim: string };
  onPress?: () => void;
}) {
  if (mark === "done") {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1 items-center justify-center rounded-full bg-lime active:opacity-70"
      >
        <MaterialCommunityIcons name="fire" size={mvs(15)} color={colors.onLime} />
      </Pressable>
    );
  }

  const ring =
    mark === "today"
      ? "border border-lime"
      : mark === "missed"
        ? "border border-orange/40"
        : "";
  const textColor =
    mark === "today"
      ? "text-lime"
      : mark === "rest"
        ? "text-text-dim"
        : "text-text-muted";

  return (
    <View className={`flex-1 items-center justify-center rounded-full ${ring}`}>
      <Text className={`font-sans text-sm ${textColor}`}>{day}</Text>
    </View>
  );
}
