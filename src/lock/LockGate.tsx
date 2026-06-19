import type { ReactNode } from "react";
import { View } from "react-native";

import { LockScreen } from "./LockScreen";
import { useLock } from "./LockContext";

// «Ворота»: вирішують, що показати — екран-замок чи сам додаток.
export function LockGate({ children }: { children: ReactNode }) {
  const { status } = useLock();

  // Поки визначаємось (читаємо прапорець) — тримаємо чорний фон без миготіння.
  if (status === "checking") {
    return <View className="flex-1 bg-bg" />;
  }

  if (status === "locked") {
    return <LockScreen />;
  }

  return <>{children}</>;
}
