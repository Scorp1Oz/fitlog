import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { StackHeader } from "@/components/StackHeader";
import {
  deleteProgram,
  getActiveProgramId,
  getProgramDetail,
  setActiveProgram,
  type ProgramDay,
} from "@/db/programs";
import { WEEKDAYS_FULL, todayWeekday } from "@/lib/date";
import { useTheme } from "@/theme/useTheme";

export default function ProgramDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = Number(id);
  const confirm = useConfirm((s) => s.ask);

  const [name, setName] = useState<string | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [isActive, setIsActive] = useState(false);

  const today = todayWeekday();

  useFocusEffect(
    useCallback(() => {
      if (!profile || !programId) return;
      Promise.all([
        getProgramDetail(programId),
        getActiveProgramId(profile.id),
      ]).then(([d, activeId]) => {
        setName(d.program?.name ?? null);
        setDays(d.days);
        setIsActive(activeId === programId);
      });
    }, [profile, programId])
  );

  // Швидкий доступ до рутини за днем тижня.
  const byWeekday = new Map(days.map((d) => [d.weekday, d]));

  const toggleActive = async () => {
    if (!profile) return;
    await setActiveProgram(profile.id, isActive ? null : programId);
    setIsActive(!isActive);
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: "Видалити програму?",
      message: "Розклад буде видалено. Рутини й історія не зміняться.",
      confirmText: "Видалити",
      cancelText: "Ні",
      destructive: true,
    });
    if (ok) {
      await deleteProgram(programId);
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={(name || "ПРОГРАМА").toUpperCase()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Дії редагування / видалення */}
        <View className="mb-4 flex-row gap-3">
          <Pressable
            onPress={() => router.push(`/program-edit?id=${programId}`)}
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
          РОЗКЛАД ТИЖНЯ
        </Text>

        {WEEKDAYS_FULL.map((label, weekday) => {
          const day = byWeekday.get(weekday);
          const isToday = weekday === today;
          return (
            <View
              key={weekday}
              className={`mb-2 flex-row items-center rounded-xl border bg-surface px-4 py-3 ${
                isToday ? "border-lime" : "border-border"
              }`}
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
              {isToday ? (
                <Text className="font-mono text-[9px] tracking-[1px] text-lime">
                  СЬОГОДНІ
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Низ: зробити активною / активна */}
      <View className="px-4 pt-2 pb-8">
        <Pressable
          onPress={toggleActive}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-80 ${
            isActive ? "border border-lime" : "bg-lime"
          }`}
        >
          {isActive ? (
            <>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={colors.lime}
              />
              <Text className="font-sans-strong text-base tracking-[1px] text-lime">
                АКТИВНА — ПРИБРАТИ
              </Text>
            </>
          ) : (
            <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
              ЗРОБИТИ АКТИВНОЮ
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
