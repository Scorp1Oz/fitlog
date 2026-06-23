import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { StackHeader } from "@/components/StackHeader";
import {
  deleteRun,
  listRunsByDay,
  type RunSummary,
} from "@/db/runs";
import {
  deleteSession,
  listSessionsByDay,
  type SessionSummary,
} from "@/db/sessions";
import { tMuscle } from "@/exercises/translations";
import {
  formatDuration,
  formatLongDate,
  formatTime,
  fromDateKey,
} from "@/lib/date";
import { formatDistance, formatPace } from "@/lib/geo";
import { useTheme } from "@/theme/useTheme";

// Назва тренування = перелік опрацьованих груп м'язів («Прес, Біцепс, Груди»).
function sessionTitle(muscles: string | null): string {
  if (!muscles) return "Тренування";
  const parts = muscles.split(",").filter(Boolean).map(tMuscle);
  return parts.length > 0 ? parts.join(", ") : "Тренування";
}

// Запис дня: або тренування, або пробіжка — в одному списку, по часу.
type DayItem =
  | { kind: "session"; at: number; session: SessionSummary }
  | { kind: "run"; at: number; run: RunSummary };

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const confirm = useConfirm((s) => s.ask);
  const [items, setItems] = useState<DayItem[]>([]);

  const reload = useCallback(() => {
    if (!profile || !date) return;
    const day = fromDateKey(date);
    const start = day.getTime();
    const end = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate() + 1
    ).getTime();
    Promise.all([
      listSessionsByDay(profile.id, start, end),
      listRunsByDay(profile.id, start, end),
    ]).then(([sessions, runs]) => {
      const merged: DayItem[] = [
        ...sessions.map(
          (s): DayItem => ({ kind: "session", at: s.started_at, session: s })
        ),
        ...runs.map((r): DayItem => ({ kind: "run", at: r.started_at, run: r })),
      ];
      merged.sort((a, b) => a.at - b.at);
      setItems(merged);
    });
  }, [profile, date]);

  // Оновлюємо при поверненні (після редагування) і при відкритті.
  useFocusEffect(reload);

  const confirmDeleteSession = async (id: number) => {
    const ok = await confirm({
      title: "Видалити тренування?",
      message: "Цю дію не можна скасувати.",
      confirmText: "Видалити",
      destructive: true,
    });
    if (ok) deleteSession(id).then(reload);
  };

  const confirmDeleteRun = async (id: number) => {
    const ok = await confirm({
      title: "Видалити пробіжку?",
      message: "Цю дію не можна скасувати.",
      confirmText: "Видалити",
      destructive: true,
    });
    if (ok) deleteRun(id).then(reload);
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={date ? formatLongDate(fromDateKey(date)) : "ДЕНЬ"} />

      <FlatList
        data={items}
        keyExtractor={(it) => `${it.kind}-${it.kind === "session" ? it.session.id : it.run.id}`}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) =>
          item.kind === "session" ? (
            <SessionRow
              session={item.session}
              colors={colors}
              onOpen={() => router.push(`/session?id=${item.session.id}`)}
              onDelete={() => confirmDeleteSession(item.session.id)}
            />
          ) : (
            <RunRow
              run={item.run}
              colors={colors}
              onOpen={() => router.push(`/run-detail?id=${item.run.id}`)}
              onDelete={() => confirmDeleteRun(item.run.id)}
            />
          )
        }
        ListEmptyComponent={
          <Text className="px-4 py-10 text-center font-sans text-text-muted">
            Немає записів цього дня.
          </Text>
        }
      />
    </View>
  );
}

// ── Картка тренування ──
function SessionRow({
  session,
  colors,
  onOpen,
  onDelete,
}: {
  session: SessionSummary;
  colors: ReturnType<typeof useTheme>["colors"];
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="flex-row items-center rounded-2xl border border-border bg-surface">
      <Pressable
        onPress={onOpen}
        className="flex-1 flex-row items-center p-4 active:opacity-70"
      >
        <MaterialCommunityIcons
          name="dumbbell"
          size={20}
          color={colors.textMuted}
          style={{ marginRight: 12 }}
        />
        <View className="flex-1">
          <Text className="font-sans-strong text-text" numberOfLines={2}>
            {sessionTitle(session.muscles)}
          </Text>
          <Text className="mt-1 font-mono text-[11px] text-text-dim">
            {formatTime(session.started_at)} ·{" "}
            {formatDuration(
              session.ended_at ? session.ended_at - session.started_at : null
            )}
          </Text>
          <Text className="mt-1 font-sans text-sm text-text-muted">
            {session.exercise_count} вправ · {session.set_count} підходів ·{" "}
            {Math.round(session.volume)} кг
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.textDim}
        />
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        className="px-4 py-4 active:opacity-60"
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={20}
          color={colors.textDim}
        />
      </Pressable>
    </View>
  );
}

// ── Картка пробіжки ──
function RunRow({
  run,
  colors,
  onOpen,
  onDelete,
}: {
  run: RunSummary;
  colors: ReturnType<typeof useTheme>["colors"];
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="flex-row items-center rounded-2xl border border-border bg-surface">
      <Pressable
        onPress={onOpen}
        className="flex-1 flex-row items-center p-4 active:opacity-70"
      >
        <MaterialCommunityIcons
          name="run-fast"
          size={20}
          color={colors.lime}
          style={{ marginRight: 12 }}
        />
        <View className="flex-1">
          <Text className="font-sans-strong text-text">Пробіжка</Text>
          <Text className="mt-1 font-mono text-[11px] text-text-dim">
            {formatTime(run.started_at)} · {formatDuration(run.duration_s * 1000)}
          </Text>
          <Text className="mt-1 font-sans text-sm text-text-muted">
            {formatDistance(run.distance_m)} · {formatPace(run.avg_pace)}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.textDim}
        />
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        className="px-4 py-4 active:opacity-60"
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={20}
          color={colors.textDim}
        />
      </Pressable>
    </View>
  );
}
