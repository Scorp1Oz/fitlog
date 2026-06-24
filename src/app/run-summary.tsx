import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckPop } from "@/components/CheckPop";
import { LimeGlow } from "@/components/LimeGlow";
import { getRunDetail, type RunPoint, type RunSummary } from "@/db/runs";
import { formatDistance, formatPace } from "@/lib/geo";
import { mvs, vs } from "@/lib/responsive";
import { RunMap } from "@/run/RunMap";
import { useTheme } from "@/theme/useTheme";

function fmtElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export default function RunSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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

  const hasTrack = points.length >= 2;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 16 }}>
      <View className="flex-1 px-4" style={{ paddingBottom: vs(12) }}>
        <View className="items-center">
          <CheckPop
            name="run-fast"
            size={mvs(48)}
            color={colors.lime}
            delay={1150}
            slideIn
          />
          <Text
            className="mt-2 font-display text-text"
            style={{ fontSize: mvs(30) }}
          >
            ПРОБІЖКА ЗАВЕРШЕНА
          </Text>
        </View>

        {/* Підсумкові цифри */}
        <View className="mt-6 flex-row justify-around rounded-2xl border border-border bg-surface py-4">
          <Stat
            label="ДИСТАНЦІЯ"
            value={run ? formatDistance(run.distance_m) : "—"}
          />
          <Stat label="ЧАС" value={run ? fmtElapsed(run.duration_s) : "—"} />
          <Stat label="ТЕМП" value={run ? formatPace(run.avg_pace) : "—"} />
        </View>

        {/* Карта з маршрутом */}
        <View className="mt-6 flex-1 overflow-hidden rounded-3xl border border-border">
          {hasTrack ? (
            <RunMap points={points} withRoute fitRoute />
          ) : (
            <View className="flex-1 items-center justify-center bg-surface px-6">
              <Text className="text-center font-sans text-text-muted">
                Маршрут не записався — замало точок GPS.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <LimeGlow>
          <Pressable
            onPress={() => router.replace("/")}
            className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
          >
            <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
              ГОТОВО
            </Text>
          </Pressable>
        </LimeGlow>
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
