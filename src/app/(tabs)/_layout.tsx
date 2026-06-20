import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";

import { FloatingTabBar } from "@/components/FloatingTabBar";

// Headless-вкладки: TabSlot малює активний екран, прихований TabList оголошує
// маршрути, а наш FloatingTabBar дає власний вигляд перемикача.
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />

      {/* Оголошення маршрутів (сам список ховаємо — бар свій). */}
      <TabList style={{ display: "none" }}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="workout" href="/workout" />
        <TabTrigger name="settings" href="/settings" />
      </TabList>

      <FloatingTabBar />
    </Tabs>
  );
}
