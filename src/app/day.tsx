import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { StackHeader } from "@/components/StackHeader";
import { listSessionsByDay, type SessionSummary } from "@/db/sessions";
import { tMuscle } from "@/exercises/translations";
import {
  formatDuration,
  formatLongDate,
  formatTime,
  fromDateKey,
} from "@/lib/date";
import { useTheme } from "@/theme/useTheme";

// Назва тренування = перелік опрацьованих груп м'язів («Прес, Біцепс, Груди»).
function sessionTitle(muscles: string | null): string {
  if (!muscles) return "Тренування";
  const parts = muscles.split(",").filter(Boolean).map(tMuscle);
  return parts.length > 0 ? parts.join(", ") : "Тренування";
}

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    if (!profile || !date) return;
    const day = fromDateKey(date);
    const start = day.getTime();
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
    listSessionsByDay(profile.id, start, end).then(setSessions);
  }, [profile, date]);

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={date ? formatLongDate(fromDateKey(date)) : "ДЕНЬ"} />

      <FlatList
        data={sessions}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/session?id=${item.id}`)}
            className="flex-row items-center rounded-2xl border border-border bg-surface p-4 active:opacity-70"
          >
            <View className="flex-1">
              <Text className="font-sans-strong text-text" numberOfLines={2}>
                {sessionTitle(item.muscles)}
              </Text>
              <Text className="mt-1 font-mono text-[11px] text-text-dim">
                {formatTime(item.started_at)} ·{" "}
                {formatDuration(
                  item.ended_at ? item.ended_at - item.started_at : null
                )}
              </Text>
              <Text className="mt-1 font-sans text-sm text-text-muted">
                {item.exercise_count} вправ · {item.set_count} підходів ·{" "}
                {Math.round(item.volume)} кг
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={colors.textDim}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="px-4 py-10 text-center font-sans text-text-muted">
            Немає тренувань цього дня.
          </Text>
        }
      />
    </View>
  );
}
