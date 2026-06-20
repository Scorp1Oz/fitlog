import { ScrollView, Text, View } from "react-native";

import { MonthCalendar } from "@/components/MonthCalendar";

export function AnalyticsScreen() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 120,
      }}
    >
      <Text className="mb-3 font-mono text-[11px] tracking-[3px] text-lime">
        ІСТОРІЯ ТРЕНУВАНЬ
      </Text>
      <MonthCalendar />

      <View className="mt-3 flex-row items-center gap-2">
        <View className="h-3 w-3 rounded bg-lime" />
        <Text className="font-mono text-[10px] text-text-dim">
          день із тренуванням
        </Text>
      </View>
    </ScrollView>
  );
}
