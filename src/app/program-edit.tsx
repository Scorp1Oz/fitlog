import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { LimeGlow } from "@/components/LimeGlow";
import { StackHeader } from "@/components/StackHeader";
import { createProgram, getProgramDetail, updateProgram } from "@/db/programs";
import { listRoutines, type RoutineSummary } from "@/db/routines";
import { WEEKDAYS_FULL } from "@/lib/date";
import { useTheme } from "@/theme/useTheme";

// Призначена на день рутина (або null — відпочинок).
type DayPick = { routineId: number; name: string } | null;

export default function ProgramEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const programId = id ? Number(id) : null;

  const [name, setName] = useState("");
  // Розклад: для кожного дня тижня (0=Пн … 6=Нд) — рутина або відпочинок.
  const [schedule, setSchedule] = useState<DayPick[]>(() =>
    Array(7).fill(null)
  );
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Доступні рутини для вибору.
  useEffect(() => {
    if (!profile) return;
    listRoutines(profile.id).then(setRoutines);
  }, [profile]);

  // Редагування наявної програми — підвантажуємо розклад.
  useEffect(() => {
    if (!programId) return;
    getProgramDetail(programId).then((d) => {
      setName(d.program?.name ?? "");
      const next: DayPick[] = Array(7).fill(null);
      for (const day of d.days) {
        next[day.weekday] = {
          routineId: day.routine_id,
          name: day.routine_name,
        };
      }
      setSchedule(next);
    });
  }, [programId]);

  const pickForDay = (weekday: number, pick: DayPick) => {
    setSchedule((prev) => prev.map((d, i) => (i === weekday ? pick : d)));
    setEditingDay(null);
  };

  const save = async () => {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert("Назва", "Вкажи назву програми.");
      return;
    }
    const days = schedule
      .map((d, weekday) => (d ? { weekday, routineId: d.routineId } : null))
      .filter((d): d is { weekday: number; routineId: number } => d !== null);
    if (days.length === 0) {
      Alert.alert("Розклад", "Признач хоча б один тренувальний день.");
      return;
    }
    setBusy(true);
    try {
      if (programId) {
        await updateProgram(programId, name.trim(), days);
      } else {
        await createProgram(profile.id, name.trim(), days);
      }
      router.back();
    } catch (e) {
      Alert.alert("Помилка збереження", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={programId ? "РЕДАГУВАННЯ" : "НОВА ПРОГРАМА"} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Назва */}
        <View className="gap-2">
          <Text className="font-mono text-[10px] tracking-[2px] text-text">
            НАЗВА
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Напр. Push / Pull / Legs"
            placeholderTextColor={colors.textDim}
            className="rounded-md border-b border-border bg-surface px-3 py-3 font-sans text-text"
          />
        </View>

        {/* Розклад тижня */}
        <Text className="mb-2 mt-6 font-mono text-[10px] tracking-[2px] text-text">
          РОЗКЛАД ТИЖНЯ
        </Text>

        {WEEKDAYS_FULL.map((label, weekday) => {
          const pick = schedule[weekday];
          return (
            <Pressable
              key={weekday}
              onPress={() => setEditingDay(weekday)}
              className="mb-2 flex-row items-center rounded-xl border border-border bg-surface px-4 py-3 active:opacity-80"
            >
              <Text className="w-28 font-sans-strong text-text">{label}</Text>
              <Text
                className={`flex-1 font-sans ${
                  pick ? "text-lime" : "text-text-dim"
                }`}
                numberOfLines={1}
              >
                {pick ? pick.name : "Відпочинок"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color={colors.textDim}
              />
            </Pressable>
          );
        })}

        <LimeGlow className="mt-8">
          <Pressable
            onPress={save}
            disabled={busy}
            className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
          >
            <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
              ЗБЕРЕГТИ ПРОГРАМУ
            </Text>
          </Pressable>
        </LimeGlow>
      </ScrollView>

      {/* Вибір рутини на день. Бекдроп — окремий Pressable ПОЗАДУ картки. */}
      {editingDay !== null ? (
        <View className="absolute inset-0 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/70"
            onPress={() => setEditingDay(null)}
          />
          <View className="rounded-t-3xl border-t border-border bg-surface pb-8 pt-4">
            <Text className="mb-3 px-5 font-display text-2xl text-text">
              {WEEKDAYS_FULL[editingDay]}
            </Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {/* Відпочинок */}
              <Pressable
                onPress={() => pickForDay(editingDay, null)}
                className="flex-row items-center gap-3 px-5 py-3 active:opacity-70"
              >
                <MaterialCommunityIcons
                  name="sleep"
                  size={20}
                  color={colors.textMuted}
                />
                <Text className="font-sans text-text-muted">Відпочинок</Text>
              </Pressable>

              <View className="mx-5 h-px bg-border" />

              {routines.length === 0 ? (
                <Text className="px-5 py-4 font-sans text-text-dim">
                  Немає рутин. Спершу створи рутину на вкладці «Рутини».
                </Text>
              ) : (
                routines.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() =>
                      pickForDay(editingDay, {
                        routineId: r.id,
                        name: r.name || "Без назви",
                      })
                    }
                    className="flex-row items-center justify-between px-5 py-3 active:opacity-70"
                  >
                    <Text className="flex-1 font-sans text-text" numberOfLines={1}>
                      {r.name || "Без назви"}
                    </Text>
                    <Text className="font-mono text-[11px] text-text-dim">
                      {r.exercise_count} впр.
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}
