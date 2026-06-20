import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { View } from "react-native";

import { FloatingTabBar } from "@/components/FloatingTabBar";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ScreenBackground } from "@/components/ScreenBackground";

// Headless-вкладки: постійна шапка (ProfileHeader) над активним екраном (TabSlot),
// прихований TabList оголошує маршрути, FloatingTabBar — наш перемикач.
export default function TabsLayout() {
  return (
    <Tabs>
      <View className="flex-1 bg-bg">
        <ScreenBackground />
        <ProfileHeader />
        <View className="flex-1">
          <TabSlot />
        </View>
      </View>

      <TabList style={{ display: "none" }}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="workout" href="/workout" />
        <TabTrigger name="analytics" href="/analytics" />
        <TabTrigger name="run" href="/run" />
      </TabList>

      <FloatingTabBar />
    </Tabs>
  );
}
