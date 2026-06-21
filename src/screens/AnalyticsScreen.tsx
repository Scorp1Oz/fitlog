import { Pressable, ScrollView, Text, View } from "react-native";

import { MonthCalendar } from "@/components/MonthCalendar";
import { ScreenTitle } from "@/components/ScreenTitle";

export function AnalyticsScreen() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <ScreenTitle title="АНАЛІТИКА" />

      <View className="mt-6 px-4">
        <Text className="mb-3 font-mono text-[11px] tracking-[3px] text-lime">
          ІСТОРІЯ ТРЕНУВАНЬ
        </Text>

        {/* Трохи вужчий календар — по центру (клітинки aspect-square, тож меншає
            і висота). */}
        <View style={{ width: "90%", alignSelf: "center" }}>
          <MonthCalendar />
        </View>

      <View className="mt-3 flex-row items-center gap-2">
        <View className="h-3 w-3 rounded bg-lime" />
        <Text className="font-mono text-[10px] text-text-dim">
          день із тренуванням
        </Text>
      </View>

      {/* Розділи аналітики */}
      <View className="mt-6 flex-row gap-3">
        <Pressable
          onPress={() => {
            // TODO: екран аналізу (об'єм/тоннаж, тренди)
          }}
          className="flex-1 items-center rounded-2xl border border-lime py-5 active:opacity-70"
        >
          <Text className="font-sans-strong text-lime">АНАЛІЗ</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            // TODO: екран «Тіло» (вага + графік, заміри, фото)
          }}
          className="flex-1 items-center rounded-2xl border border-lime py-5 active:opacity-70"
        >
          <Text className="font-sans-strong text-lime">ТІЛО</Text>
        </Pressable>
      </View>
      </View>
    </ScrollView>
  );
}
