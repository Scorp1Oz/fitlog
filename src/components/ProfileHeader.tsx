import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { StreakModal } from "@/components/StreakModal";
import { getActiveProgram } from "@/db/programs";
import { listRunDates } from "@/db/runs";
import { listWorkoutDates } from "@/db/sessions";
import { toDateKey, todayWeekday } from "@/lib/date";
import { refreshStreakReminder } from "@/lib/reminders";
import { mvs } from "@/lib/responsive";
import { isStreakAlive } from "@/lib/streak";
import { Avatar } from "@/profile/Avatar";
import { getDisplayName } from "@/profile/profile-helpers";
import { ProfileModal } from "@/profile/ProfileModal";
import { useTheme } from "@/theme/useTheme";

// Останні ~рік активностей вистачає, щоб точно порахувати поточний стрік.
const STREAK_WINDOW_MS = 400 * 86_400_000;

// Постійна шапка над усіма вкладками. Тап по аватару/імені → модалка профілю,
// по вогнику → календар стріку, по шестерні → Налаштування.
export function ProfileHeader() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const name = getDisplayName(profile);
  const [modalOpen, setModalOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [alive, setAlive] = useState(false);

  // Перераховуємо стрік щоразу при поверненні на головну (після тренування/
  // пробіжки маршрут «/» знову у фокусі). Заодно переплановуємо нагадування.
  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      const now = Date.now();
      Promise.all([
        listWorkoutDates(profile.id, now - STREAK_WINDOW_MS, now + 86_400_000),
        listRunDates(profile.id, now - STREAK_WINDOW_MS, now + 86_400_000),
        getActiveProgram(profile.id),
      ])
        .then(([workouts, runs, program]) => {
          const days = new Set<string>();
          for (const t of workouts) days.add(toDateKey(new Date(t)));
          for (const t of runs) days.add(toDateKey(new Date(t)));
          const weekdays = program ? program.days.map((d) => d.weekday) : null;
          setAlive(isStreakAlive(days, weekdays));

          // Чи сьогодні «треба тренуватись» і ще не закрито — для нагадування.
          const doneToday = days.has(toDateKey(new Date()));
          const hasProgram = !!program && program.days.length > 0;
          const trainToday = hasProgram
            ? program.days.some((d) => d.weekday === todayWeekday())
            : true;
          refreshStreakReminder(!doneToday && trainToday);
        })
        .catch(() => setAlive(false));
    }, [profile])
  );

  return (
    <View
      className="flex-row items-center justify-between border-b border-border bg-bg px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      {/* Ліворуч: профіль + вогник-стрік одразу за іменем (стиль Duolingo). */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => setModalOpen(true)}
          className="flex-row items-center gap-3 active:opacity-70"
        >
          <Avatar uri={profile?.avatar_uri ?? null} name={name} size={40} />
          <View>
            <Text className="font-sans-strong text-base text-text">{name}</Text>
            <Text className="font-mono text-[10px] text-text-dim">
              @{profile?.username}
            </Text>
          </View>
        </Pressable>

        <StreakFlame
          alive={alive}
          activeColor={colors.lime}
          dimColor={colors.textDim}
          onPress={() => setStreakOpen(true)}
        />
      </View>

      <Pressable
        onPress={() => router.push("/settings")}
        hitSlop={8}
        accessibilityLabel="Налаштування"
        className="p-1 active:opacity-70"
      >
        <MaterialCommunityIcons
          name="cog-outline"
          size={24}
          color={colors.textDim}
        />
      </Pressable>

      <ProfileModal visible={modalOpen} onClose={() => setModalOpen(false)} />
      <StreakModal visible={streakOpen} onClose={() => setStreakOpen(false)} />
    </View>
  );
}

// Вогник стріку (без числа). Активний — лаймовий, із легким «диханням»;
// згаслий — приглушений сірий. Тап відкриває календар стріку.
function StreakFlame({
  alive,
  activeColor,
  dimColor,
  onPress,
}: {
  alive: boolean;
  activeColor: string;
  dimColor: string;
  onPress: () => void;
}) {
  const flame = useSharedValue(0);

  useEffect(() => {
    if (!alive) return;
    flame.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [alive, flame]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: alive ? 0.8 + flame.value * 0.2 : 1,
    transform: [{ scale: alive ? 0.94 + flame.value * 0.12 : 1 }],
  }));

  return (
    <Pressable onPress={onPress} hitSlop={10} className="active:opacity-60">
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons
          name={alive ? "fire" : "fire-off"}
          size={mvs(24)}
          color={alive ? activeColor : dimColor}
        />
      </Animated.View>
    </Pressable>
  );
}
