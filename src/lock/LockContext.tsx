// React Context зберігає стан замка в одному місці й дає до нього доступ
// будь-якому екрану через хук useLock(). Це вбудований у React механізм
// спільного стану (перед тим, як на кроці 3 з'явиться Zustand).
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  authenticate,
  canUseBiometrics,
  isLockEnabled,
  setLockEnabled,
} from "./lock-storage";

// checking — ще визначаємось; locked — показуємо екран-замок; unlocked — впускаємо.
type LockStatus = "checking" | "locked" | "unlocked";

type LockValue = {
  status: LockStatus;
  enabled: boolean; // стан перемикача «замок при вході»
  biometricsAvailable: boolean; // чи є чим автентифікуватись на цьому пристрої
  unlock: () => Promise<boolean>; // запит біометрії; true = успіх
  enter: () => void; // пройти без біометрії (браузер/запасний шлях)
  lockNow: () => void; // заблокувати вручну (для тесту)
  setEnabled: (value: boolean) => Promise<void>;
};

const LockContext = createContext<LockValue | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LockStatus>("checking");
  const [enabled, setEnabledState] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // При старті: читаємо прапорець і можливості пристрою, вирішуємо — блокувати чи ні.
  useEffect(() => {
    (async () => {
      const [on, bio] = await Promise.all([isLockEnabled(), canUseBiometrics()]);
      setEnabledState(on);
      setBiometricsAvailable(bio);
      // Блокуємо лише якщо замок увімкнено І є чим розблокувати.
      setStatus(on && bio ? "locked" : "unlocked");
    })();
  }, []);

  const unlock = async (): Promise<boolean> => {
    const ok = await authenticate();
    if (ok) setStatus("unlocked");
    return ok;
  };

  const enter = () => setStatus("unlocked");

  const lockNow = () => setStatus("locked");

  const setEnabled = async (value: boolean) => {
    await setLockEnabled(value);
    setEnabledState(value);
  };

  return (
    <LockContext.Provider
      value={{
        status,
        enabled,
        biometricsAvailable,
        unlock,
        enter,
        lockNow,
        setEnabled,
      }}
    >
      {children}
    </LockContext.Provider>
  );
}

// Зручний хук. Кидає помилку, якщо його викликали поза <LockProvider>.
export function useLock(): LockValue {
  const ctx = useContext(LockContext);
  if (!ctx) {
    throw new Error("useLock має використовуватись усередині <LockProvider>");
  }
  return ctx;
}
