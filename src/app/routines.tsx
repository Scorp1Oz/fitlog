import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { LimeGlow } from "@/components/LimeGlow";
import { StackHeader } from "@/components/StackHeader";
import { listRoutines, type RoutineSummary } from "@/db/routines";
import { useTheme } from "@/theme/useTheme";

export default function RoutinesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();

  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Перезавантажуємо при кожному фокусі — після створення/редагування/видалення
  // повертаємось саме сюди.
  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      listRoutines(profile.id).then((r) => {
        setRoutines(r);
        setLoaded(true);
      });
    }, [profile])
  );

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="РУТИНИ" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {loaded && routines.length === 0 ? (
          <View className="mt-24 items-center gap-2">
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={40}
              color={colors.faint}
            />
            <Text className="text-center font-sans text-text-dim">
              Ще немає рутин. Створи шаблон тренування, щоб починати в один тап.
            </Text>
          </View>
        ) : (
          routines.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/routine-detail?id=${r.id}`)}
              className="mb-3 flex-row items-center rounded-2xl border border-border bg-surface p-4 active:opacity-80"
            >
              <View className="flex-1">
                <Text
                  className="font-sans-strong text-base text-text"
                  numberOfLines={1}
                >
                  {r.name || "Без назви"}
                </Text>
                <Text className="mt-1 font-mono text-[11px] text-text-dim">
                  {r.exercise_count}{" "}
                  {r.exercise_count === 1 ? "вправа" : "вправ"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textDim}
              />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Низ: створити нову рутину */}
      <View className="px-4 pt-2 pb-8">
        <LimeGlow>
          <Pressable
            onPress={() => router.push("/routine-edit")}
            className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
          >
            <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
              + НОВА РУТИНА
            </Text>
          </Pressable>
        </LimeGlow>
      </View>
    </View>
  );
}
