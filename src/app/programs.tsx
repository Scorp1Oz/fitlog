import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { StackHeader } from "@/components/StackHeader";
import {
  getActiveProgramId,
  listPrograms,
  type ProgramSummary,
} from "@/db/programs";
import { seedDemoPlans } from "@/db/seed-demo";
import { useTheme } from "@/theme/useTheme";

export default function ProgramsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();

  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const reload = useCallback(() => {
    if (!profile) return;
    Promise.all([
      listPrograms(profile.id),
      getActiveProgramId(profile.id),
    ]).then(([list, active]) => {
      setPrograms(list);
      setActiveId(active);
      setLoaded(true);
    });
  }, [profile]);

  useFocusEffect(reload);

  const loadDemos = async () => {
    if (!profile || seeding) return;
    setSeeding(true);
    try {
      const added = await seedDemoPlans(profile.id);
      if (added) reload();
      else Alert.alert("Показові плани", "Їх уже додано.");
    } catch (e) {
      Alert.alert("Помилка", String(e));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="ПРОГРАМИ" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {loaded && programs.length === 0 ? (
          <View className="mt-24 items-center gap-2">
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={40}
              color={colors.faint}
            />
            <Text className="text-center font-sans text-text-dim">
              Ще немає програм. Склади тижневий розклад зі своїх рутин.
            </Text>
          </View>
        ) : (
          programs.map((p) => {
            const isActive = p.id === activeId;
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/program-detail?id=${p.id}`)}
                className={`mb-3 flex-row items-center rounded-2xl border bg-surface p-4 active:opacity-80 ${
                  isActive ? "border-lime" : "border-border"
                }`}
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="font-sans-strong text-base text-text"
                      numberOfLines={1}
                    >
                      {p.name || "Без назви"}
                    </Text>
                    {isActive ? (
                      <View className="rounded-full bg-lime px-2 py-0.5">
                        <Text className="font-mono text-[9px] tracking-[1px] text-on-lime">
                          АКТИВНА
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="mt-1 font-mono text-[11px] text-text-dim">
                    {p.day_count}{" "}
                    {p.day_count === 1 ? "день" : "дн."} на тиждень
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textDim}
                />
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View className="gap-3 px-4 pt-2 pb-8">
        <Pressable
          onPress={loadDemos}
          disabled={seeding}
          className="items-center rounded-2xl border border-lime py-3.5 active:opacity-70"
        >
          <Text className="font-sans-strong text-lime">
            {seeding ? "ДОДАЮ…" : "ПОКАЗОВІ ПЛАНИ"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/program-edit")}
          className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
        >
          <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
            + НОВА ПРОГРАМА
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
