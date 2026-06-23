import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { StackHeader } from "@/components/StackHeader";
import { getRunDetail, type RunPoint, type RunSummary } from "@/db/runs";
import { formatLongDate, formatTime } from "@/lib/date";
import { formatDistance, formatPace } from "@/lib/geo";
import { mvs, vs } from "@/lib/responsive";
import { RunMap } from "@/run/RunMap";

function fmtElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [run, setRun] = useState<RunSummary | null>(null);
  const [points, setPoints] = useState<RunPoint[]>([]);

  useEffect(() => {
    const runId = Number(id);
    if (!runId) return;
    getRunDetail(runId).then(({ run, points }) => {
      setRun(run);
      setPoints(points);
    });
  }, [id]);

  const title = run ? formatLongDate(run.started_at) : "ПРОБІЖКА";
  const hasTrack = points.length >= 2;

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={title} />

      {/* Карта з маршрутом — вписана в межі треку. */}
      <View className="mx-4 mt-3 flex-1 overflow-hidden rounded-3xl border border-border">
        {hasTrack ? (
          <RunMap points={points} withRoute fitRoute />
        ) : (
          <View className="flex-1 items-center justify-center bg-surface px-6">
            <Text className="text-center font-sans text-text-muted">
              Для цієї пробіжки немає збереженого маршруту.
            </Text>
          </View>
        )}
      </View>

      {/* Підсумок */}
      <View className="px-4 pt-3" style={{ paddingBottom: vs(24) }}>
        {run ? (
          <Text className="mb-3 font-mono text-[11px] tracking-[2px] text-text-dim">
            {formatTime(run.started_at)}
          </Text>
        ) : null}
        <View className="flex-row justify-around rounded-2xl border border-border bg-surface py-4">
          <Stat
            label="ДИСТАНЦІЯ"
            value={run ? formatDistance(run.distance_m) : "—"}
          />
          <Stat label="ЧАС" value={run ? fmtElapsed(run.duration_s) : "—"} />
          <Stat label="ТЕМП" value={run ? formatPace(run.avg_pace) : "—"} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text
        className="font-display text-text"
        style={{ fontSize: mvs(26), lineHeight: mvs(28) }}
      >
        {value}
      </Text>
      <Text className="mt-1 font-mono text-[10px] tracking-[2px] text-text-dim">
        {label}
      </Text>
    </View>
  );
}
