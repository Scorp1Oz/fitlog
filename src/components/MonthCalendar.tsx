import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { listRunDates } from "@/db/runs";
import { listWorkoutDates } from "@/db/sessions";
import { MONTHS_NOM, toDateKey, WEEKDAYS_SHORT } from "@/lib/date";
import { useTheme } from "@/theme/useTheme";

// Календар місяця: дні з тренуваннями підсвічені лаймом, тап по них → день.
export function MonthCalendar() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0–11
  const [days, setDays] = useState<Set<number>>(new Set());

  const load = useCallback(() => {
    if (!profile) return;
    const from = new Date(year, month, 1).getTime();
    const to = new Date(year, month + 1, 1).getTime();
    // Підсвічуємо дні, де є тренування АБО пробіжки.
    Promise.all([
      listWorkoutDates(profile.id, from, to),
      listRunDates(profile.id, from, to),
    ]).then(([workouts, runs]) => {
      const s = new Set<number>();
      for (const t of workouts) s.add(new Date(t).getDate());
      for (const t of runs) s.add(new Date(t).getDate());
      setDays(s);
    });
  }, [profile, year, month]);

  // Перезавантаження при зміні місяця та при поверненні на екран.
  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(load);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Сітка: понеділок першим. Порожні комірки перед 1-м числом.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isToday = (d: number) =>
    year === today.getFullYear() &&
    month === today.getMonth() &&
    d === today.getDate();

  const openDay = (d: number) => {
    router.push(`/day?date=${toDateKey(new Date(year, month, d))}`);
  };

  return (
    <View>
      {/* Шапка: місяць + навігація */}
      <View className="flex-row items-center justify-between">
        <Pressable onPress={prevMonth} hitSlop={8} className="p-1 active:opacity-60">
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={colors.textMuted}
          />
        </Pressable>
        <Text className="font-display text-xl tracking-[1px] text-text">
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
            if (d === null) {
              return <View key={di} className="aspect-square flex-1" />;
            }
            const has = days.has(d);
            return (
              <View key={di} className="aspect-square flex-1 p-0.5">
                <Pressable
                  onPress={() => (has ? openDay(d) : undefined)}
                  disabled={!has}
                  className={`flex-1 items-center justify-center rounded-full ${
                    has
                      ? "bg-lime"
                      : isToday(d)
                        ? "border border-lime"
                        : ""
                  } active:opacity-70`}
                >
                  <Text
                    className={`font-sans text-sm ${
                      has
                        ? "text-on-lime"
                        : isToday(d)
                          ? "text-lime"
                          : "text-text-muted"
                    }`}
                  >
                    {d}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
