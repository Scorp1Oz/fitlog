import type { ReactNode } from "react";
import { View } from "react-native";

import { AuthScreen } from "./AuthScreen";
import { useAuth } from "./AuthContext";

// Якщо ніхто не залогінений — показуємо вхід/реєстрацію.
// Якщо профіль активний — пускаємо далі (там уже діє замок-біометрія).
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <View className="flex-1 bg-bg" />;
  }

  if (status === "signedOut") {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
