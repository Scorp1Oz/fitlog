import "../../global.css";

import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { AuthGate } from "@/auth/AuthGate";
import { AuthProvider } from "@/auth/AuthContext";
import { DbProvider } from "@/db/DbProvider";
import { LockGate } from "@/lock/LockGate";
import { LockProvider } from "@/lock/LockContext";
import { colors } from "@/theme/colors";

// Не ховати екран-заставку, поки шрифти не завантажились.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Ключі цього об'єкта стають значеннями fontFamily (і нашими токенами шрифтів).
  const [loaded, error] = useFonts({
    BebasNeue_400Regular,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Поки шрифти вантажаться — нічого не показуємо (заставка лишається видимою).
  if (!loaded && !error) {
    return null;
  }

  // Ховаємо стандартний світлий заголовок навігації — робитимемо власні
  // темні шапки на кожному екрані за дизайн-системою.
  return (
    <DbProvider>
      <AuthProvider>
        <LockProvider>
          <StatusBar style="light" />
          <AuthGate>
            <LockGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "slide_from_right",
                  // Темний фон навігатора — інакше під час переходу проблискує
                  // стандартний білий фон екрана.
                  contentStyle: { backgroundColor: colors.bg },
                }}
              />
            </LockGate>
          </AuthGate>
        </LockProvider>
      </AuthProvider>
    </DbProvider>
  );
}
