// Тримає заплановане фонове сповіщення «відпочинок завершено» синхронним зі
// станом таймера: є дедлайн → планує, нема → скасовує, на виході — прибирає.
import { useEffect } from "react";

import { cancelRestDone, scheduleRestDone } from "@/lib/notify";

export function useRestNotification(restEndsAt: number | null): void {
  useEffect(() => {
    if (restEndsAt) {
      scheduleRestDone(restEndsAt);
    } else {
      cancelRestDone();
    }
    return () => {
      cancelRestDone();
    };
  }, [restEndsAt]);
}
