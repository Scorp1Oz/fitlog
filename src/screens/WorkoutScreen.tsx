import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useWorkoutStore } from "@/workout/workout-store";

export function WorkoutScreen() {
  const router = useRouter();
  const start = useWorkoutStore((s) => s.start);

  const startFreeWorkout = () => {
    start(); // не скидає, якщо сесія вже триває
    router.push("/workout-session");
  };

  return (
    <View className="flex-1 px-4 pt-3">
      {/* Заголовок екрана */}
      <Text className="text-center font-display text-2xl text-text">
        ТРЕНУВАННЯ
      </Text>
      <View className="mt-2 h-px bg-border" />

      {/* Активна програма — займає основну висоту */}
      <Text className="mt-5 text-center font-mono text-[11px] tracking-[3px] text-lime">
        АКТИВНА ПРОГРАМА
      </Text>
      <View className="flex-1 items-center justify-center">
        <Text className="text-center font-sans text-text-dim">
          Активна програма ще не вибрана
        </Text>
      </View>

      <View className="mb-4 h-px bg-border" />

      {/* Дії над нижнім меню */}
      <View className="mb-28 gap-3">
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => {
              // TODO: екран програм
            }}
            className="flex-1 items-center rounded-2xl border border-lime py-5 active:opacity-70"
          >
            <Text className="font-sans-strong text-lime">ПРОГРАМИ</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              // TODO: екран рутин (зокрема створення)
            }}
            className="flex-1 items-center rounded-2xl border border-lime py-5 active:opacity-70"
          >
            <Text className="font-sans-strong text-lime">РУТИНИ</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/exercises")}
          className="items-center rounded-2xl border border-lime py-3.5 active:opacity-70"
        >
          <Text className="font-sans-strong text-lime">БІБЛІОТЕКА ВПРАВ</Text>
        </Pressable>

        <Pressable
          onPress={startFreeWorkout}
          className="items-center rounded-2xl bg-lime py-5 active:opacity-80"
        >
          <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
            ПОЧАТИ ВІЛЬНЕ ТРЕНУВАННЯ
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
