import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { E1rmChart } from "@/components/E1rmChart";
import { StackHeader } from "@/components/StackHeader";
import { getExerciseById, type ExerciseDetail } from "@/db/exercises";
import {
  getExerciseProgress,
  getExerciseRecord,
  type ExerciseRecord,
} from "@/db/sessions";
import { tEquipment, tMuscle } from "@/exercises/translations";
import { formatShortDate } from "@/lib/date";
import { kg } from "@/lib/strength";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [ex, setEx] = useState<ExerciseDetail | null>(null);
  const [record, setRecord] = useState<ExerciseRecord | null>(null);
  const [progress, setProgress] = useState<{ date: number; e1rm: number }[]>([]);

  useEffect(() => {
    if (!id) return;
    const eid = Number(id);
    getExerciseById(eid).then(setEx);
    if (profile) {
      getExerciseRecord(profile.id, eid).then(setRecord);
      getExerciseProgress(profile.id, eid).then(setProgress);
    }
  }, [id, profile]);

  const title = ex?.name_uk?.trim() || ex?.name || "ВПРАВА";

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={title.toUpperCase()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Картинка + мета */}
        <View className="flex-row gap-3">
          {ex?.images[0] ? (
            <Image
              source={{ uri: ex.images[0] }}
              style={{ width: 88, height: 88, borderRadius: 8 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{ width: 88, height: 88, borderRadius: 8 }}
              className="bg-surface-2"
            />
          )}
          <View className="flex-1 justify-center">
            <Text className="font-mono text-[11px] text-text-dim">
              {tMuscle(ex?.primary_muscle ?? null)} ·{" "}
              {tEquipment(ex?.equipment ?? null)}
            </Text>
          </View>
        </View>

        {/* Рекорди */}
        <View className="mt-6 flex-row gap-3">
          <RecordCard
            label="ОЦІНКА 1ПМ"
            value={record?.bestE1rm ? `${kg(record.bestE1rm)} кг` : "—"}
            sub={record?.bestE1rmDate ? formatShortDate(record.bestE1rmDate) : ""}
          />
          <RecordCard
            label="МАКС. ВАГА"
            value={record?.bestWeight ? `${record.bestWeight} кг` : "—"}
            sub={
              record?.bestWeightDate ? formatShortDate(record.bestWeightDate) : ""
            }
          />
        </View>

        {/* Графік 1ПМ */}
        <Text className="mt-6 mb-2 font-mono text-[11px] tracking-[3px] text-lime">
          ПРОГРЕС 1ПМ
        </Text>
        {progress.length >= 2 ? (
          <View className="rounded-2xl border border-border bg-surface p-2">
            <E1rmChart values={progress.map((p) => p.e1rm)} />
          </View>
        ) : (
          <Text className="font-sans text-text-muted">
            Замало даних для графіка — потрібно щонайменше два тренування з цією
            вправою.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function RecordCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="font-mono text-[10px] tracking-[2px] text-text-dim">
        {label}
      </Text>
      <Text className="mt-1 font-display text-2xl text-lime">{value}</Text>
      {sub ? (
        <Text className="mt-0.5 font-mono text-[10px] text-text-dim">{sub}</Text>
      ) : null}
    </View>
  );
}
