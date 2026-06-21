import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getSessionDetail,
  getSessionRecords,
  type SessionRecord,
  type SessionSummary,
} from "@/db/sessions";
import { formatDuration } from "@/lib/date";
import { kg } from "@/lib/strength";
import { useTheme } from "@/theme/useTheme";

export default function WorkoutSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [session, setSession] = useState<SessionSummary | null>(null);
  const [records, setRecords] = useState<SessionRecord[]>([]);

  useEffect(() => {
    if (!id) return;
    const sid = Number(id);
    getSessionDetail(sid).then((d) => setSession(d.session));
    getSessionRecords(sid).then(setRecords);
  }, [id]);

  const prs = records.filter((r) => r.is_pr);
  const duration = session?.ended_at
    ? session.ended_at - session.started_at
    : null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 16 }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <View className="items-center">
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={48}
            color={colors.lime}
          />
          <Text className="mt-2 font-display text-3xl text-text">
            ТРЕНУВАННЯ ЗАВЕРШЕНО
          </Text>
        </View>

        {/* Підсумкові цифри */}
        <View className="mt-6 flex-row justify-around rounded-2xl border border-border bg-surface py-4">
          <Stat label="ЧАС" value={formatDuration(duration)} />
          <Stat label="ТОННАЖ" value={`${kg(session?.volume ?? 0)} кг`} />
          <Stat label="ПІДХОДІВ" value={String(session?.set_count ?? 0)} />
        </View>

        {/* Рекорди */}
        {prs.length > 0 ? (
          <View className="mt-6">
            <View className="mb-2 flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="trophy-variant"
                size={14}
                color={colors.lime}
              />
              <Text className="font-mono text-[11px] tracking-[3px] text-lime">
                НОВІ РЕКОРДИ
              </Text>
            </View>
            {prs.map((r) => (
              <View
                key={r.exercise_id}
                className="mb-2 rounded-2xl border border-lime bg-surface p-4"
              >
                <Text className="font-sans-strong text-text">{r.name}</Text>
                <Text className="mt-1 font-sans text-text-muted">
                  {kg(r.e1rm)} кг · 1ПМ{" "}
                  <Text className="text-text-dim">
                    ({r.weight} кг × {r.reps})
                  </Text>
                </Text>
                <Text className="mt-1 font-mono text-[11px] text-lime">
                  {r.prior_e1rm > 0
                    ? `+${kg(r.e1rm - r.prior_e1rm)} кг до попереднього`
                    : "перший результат"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mt-6 text-center font-sans text-text-muted">
            Рекордів цього разу немає — стабільність теж прогрес.
          </Text>
        )}

        {/* Усі вправи з оцінкою 1ПМ */}
        {records.length > 0 ? (
          <View className="mt-6">
            <Text className="mb-2 font-mono text-[11px] tracking-[3px] text-text-dim">
              ОЦІНКА 1ПМ
            </Text>
            {records.map((r) => (
              <View
                key={r.exercise_id}
                className="flex-row items-center justify-between border-b border-border py-2.5"
              >
                <Text className="flex-1 font-sans text-text" numberOfLines={1}>
                  {r.name}
                </Text>
                <Text className="font-mono text-text-muted">
                  {kg(r.e1rm)} кг
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable
          onPress={() => router.replace("/")}
          className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
        >
          <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
            ГОТОВО
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="font-display text-2xl text-text">{value}</Text>
      <Text className="mt-1 font-mono text-[10px] tracking-[2px] text-text-dim">
        {label}
      </Text>
    </View>
  );
}
