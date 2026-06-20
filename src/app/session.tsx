import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { StackHeader } from "@/components/StackHeader";
import {
  getSessionDetail,
  type SessionExercise,
  type SessionSummary,
} from "@/db/sessions";
import { formatDuration, formatLongDate, formatTime } from "@/lib/date";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);

  useEffect(() => {
    if (!id) return;
    getSessionDetail(Number(id)).then((d) => {
      setSession(d.session);
      setExercises(d.exercises);
    });
  }, [id]);

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="ТРЕНУВАННЯ" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {session ? (
          <View className="mb-4">
            <Text className="font-display text-2xl text-text">
              {formatLongDate(session.started_at)}
            </Text>
            <Text className="mt-1 font-mono text-[11px] text-text-dim">
              {formatTime(session.started_at)} ·{" "}
              {formatDuration(
                session.ended_at ? session.ended_at - session.started_at : null
              )}{" "}
              · {Math.round(session.volume)} кг
            </Text>
          </View>
        ) : null}

        {exercises.map((ex) => (
          <View
            key={ex.exercise_id}
            className="mb-3 rounded-2xl border border-border bg-surface p-4"
          >
            <Text className="font-sans-strong text-text">{ex.name}</Text>
            <View className="mt-3 gap-1.5">
              {ex.sets.map((s, i) => (
                <View key={i} className="flex-row items-center">
                  <Text className="w-8 font-mono text-text-dim">{i + 1}</Text>
                  <Text className="font-sans text-text">
                    {s.weight} кг × {s.reps}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {session && exercises.length === 0 ? (
          <Text className="px-4 py-10 text-center font-sans text-text-muted">
            У цьому тренуванні немає збережених підходів.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
