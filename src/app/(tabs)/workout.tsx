import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Workout() {
  const router = useRouter();

  return (
    <View className="flex-1 px-4 pt-6">
      {/* Головна дія — почати тренування без рутини */}
      <Pressable
        onPress={() => {
          // TODO: екран активної сесії (вільне тренування)
        }}
        className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
      >
        <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
          ПОЧАТИ ВІЛЬНЕ ТРЕНУВАННЯ
        </Text>
      </Pressable>

      <View className="my-6 h-px bg-border" />

      {/* Секція рутин */}
      <Text className="font-mono text-[11px] tracking-[3px] text-lime">
        РУТИНИ
      </Text>

      <View className="flex-1 items-center justify-center">
        <Text className="text-center font-sans text-text-muted">
          Рутин ще немає.
        </Text>
        <Text className="mt-1 text-center font-sans text-sm text-text-dim">
          Створи першу, щоб тренуватись за планом.
        </Text>
      </View>

      {/* Дії над нижнім меню */}
      <View className="mb-4 h-px bg-border" />
      <View className="mb-28 gap-3">
        <Pressable
          onPress={() => {
            // TODO: екран створення рутини
          }}
          className="items-center rounded-2xl border border-lime py-3.5 active:opacity-70"
        >
          <Text className="font-sans-strong text-lime">СТВОРИТИ РУТИНУ</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/exercises")}
          className="items-center rounded-2xl border border-lime py-3.5 active:opacity-70"
        >
          <Text className="font-sans-strong text-lime">БІБЛІОТЕКА ВПРАВ</Text>
        </Pressable>
      </View>
    </View>
  );
}
