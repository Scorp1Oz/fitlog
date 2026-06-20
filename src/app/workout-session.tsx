import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { countCompletedSets, saveSession } from "@/db/sessions";
import { useTheme } from "@/theme/useTheme";
import { RestTimer } from "@/workout/RestTimer";
import { useWorkoutStore } from "@/workout/workout-store";

const REST_SECONDS = 90;

// Тривалість тренування: m:ss, а від години — h:mm:ss.
function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export default function WorkoutSession() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile } = useAuth();

  const startedAt = useWorkoutStore((s) => s.startedAt);
  const exercises = useWorkoutStore((s) => s.exercises);
  const cancel = useWorkoutStore((s) => s.cancel);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);

  const [now, setNow] = useState(Date.now());
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  // true, коли вже самі ініціюємо вихід (завершення/скасування) — щоб
  // ефект-вартовий нижче не зробив другий router.back().
  const leavingRef = useRef(false);

  // Один тік на секунду для таймера тренування і відпочинку.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Закінчився відпочинок — ховаємо панель.
  useEffect(() => {
    if (restEndsAt && now >= restEndsAt) setRestEndsAt(null);
  }, [now, restEndsAt]);

  // Захист: якщо екран відкрили без активної сесії (не через нашу кнопку) —
  // повертаємось назад. Якщо вихід ініціювали ми самі — не дублюємо back.
  useEffect(() => {
    if (!startedAt && !leavingRef.current) router.back();
  }, [startedAt, router]);

  if (!startedAt) return null;

  // Єдина точка виходу: позначаємо намір, чистимо стор, вертаємось раз.
  const leave = () => {
    leavingRef.current = true;
    cancel();
    router.back();
  };

  const restRemaining = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : 0;

  const onToggleSet = (exIdx: number, setIdx: number, completed: boolean) => {
    updateSet(exIdx, setIdx, { completed: !completed });
    // Позначили виконаним → запускаємо відпочинок.
    if (!completed) setRestEndsAt(Date.now() + REST_SECONDS * 1000);
  };

  const adjustRest = (delta: number) =>
    setRestEndsAt((end) =>
      Math.max(Date.now(), (end ?? Date.now()) + delta * 1000)
    );

  const onCancel = () => {
    Alert.alert("Скасувати тренування?", "Незбережені підходи зникнуть.", [
      { text: "Ні", style: "cancel" },
      {
        text: "Скасувати",
        style: "destructive",
        onPress: leave,
      },
    ]);
  };

  const onFinish = () => {
    const done = countCompletedSets(exercises);
    if (done === 0) {
      Alert.alert(
        "Немає виконаних підходів",
        "Завершити без збереження тренування?",
        [
          { text: "Назад", style: "cancel" },
          { text: "Відкинути", style: "destructive", onPress: leave },
        ]
      );
      return;
    }
    if (!profile) return;
    saveSession(profile.id, startedAt, exercises)
      .then(leave)
      .catch((e) => Alert.alert("Помилка збереження", String(e)));
  };

  return (
    <View className="flex-1 bg-bg">
      {/* Шапка з таймером */}
      <View
        className="flex-row items-center justify-between border-b border-border bg-bg px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={onCancel} hitSlop={8} className="active:opacity-60">
          <Text className="font-sans text-text-muted">Скасувати</Text>
        </Pressable>
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons
            name="timer-outline"
            size={16}
            color={colors.lime}
          />
          <Text className="font-mono text-base text-text">
            {fmtElapsed(now - startedAt)}
          </Text>
        </View>
        <View className="w-16" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 8}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {exercises.length === 0 ? (
            <View className="mt-24 items-center">
              <Text className="text-center font-sans text-text-dim">
                Додай першу вправу, щоб почати.
              </Text>
            </View>
          ) : (
            exercises.map((ex, exIdx) => (
              <View
                key={exIdx}
                className="mt-4 rounded-2xl border border-border bg-surface p-3"
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="flex-1 font-sans-strong text-text"
                    numberOfLines={1}
                  >
                    {ex.name}
                  </Text>
                  <Pressable
                    onPress={() => removeExercise(exIdx)}
                    hitSlop={8}
                    className="pl-2 active:opacity-60"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color={colors.textDim}
                    />
                  </Pressable>
                </View>

                {/* Заголовки колонок */}
                <View className="mt-3 flex-row items-center">
                  <Text className="w-8 font-mono text-[10px] text-text-dim">
                    #
                  </Text>
                  <Text className="flex-1 text-center font-mono text-[10px] text-text-dim">
                    КГ
                  </Text>
                  <Text className="flex-1 text-center font-mono text-[10px] text-text-dim">
                    ПОВТ.
                  </Text>
                  <View className="w-9" />
                  <View className="w-7" />
                </View>

                {ex.sets.map((st, setIdx) => (
                  <View key={setIdx} className="mt-2 flex-row items-center">
                    <Text className="w-8 font-mono text-text-muted">
                      {setIdx + 1}
                    </Text>
                    <TextInput
                      value={st.weight}
                      onChangeText={(t) =>
                        updateSet(exIdx, setIdx, { weight: t })
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      style={{ textAlign: "center" }}
                      className="mx-1 flex-1 rounded-lg bg-surface-2 px-2 py-2 font-sans text-text"
                    />
                    <TextInput
                      value={st.reps}
                      onChangeText={(t) => updateSet(exIdx, setIdx, { reps: t })}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                      style={{ textAlign: "center" }}
                      className="mx-1 flex-1 rounded-lg bg-surface-2 px-2 py-2 font-sans text-text"
                    />
                    <Pressable
                      onPress={() => onToggleSet(exIdx, setIdx, st.completed)}
                      hitSlop={4}
                      className="w-9 items-center active:opacity-60"
                    >
                      <MaterialCommunityIcons
                        name={
                          st.completed
                            ? "checkbox-marked"
                            : "checkbox-blank-outline"
                        }
                        size={24}
                        color={st.completed ? colors.lime : colors.textDim}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => removeSet(exIdx, setIdx)}
                      hitSlop={4}
                      className="w-7 items-center active:opacity-60"
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={16}
                        color={colors.textDim}
                      />
                    </Pressable>
                  </View>
                ))}

                <Pressable
                  onPress={() => addSet(exIdx)}
                  className="mt-3 items-center rounded-xl border border-border py-2 active:opacity-70"
                >
                  <Text className="font-mono text-[11px] tracking-[1px] text-text-muted">
                    + ПІДХІД
                  </Text>
                </Pressable>
              </View>
            ))
          )}

          <Pressable
            onPress={() => router.push("/exercises?pick=1")}
            className="mt-4 items-center rounded-2xl border border-lime py-3.5 active:opacity-70"
          >
            <Text className="font-sans-strong text-lime">+ ДОДАТИ ВПРАВУ</Text>
          </Pressable>
        </ScrollView>

        {/* Низ: відпочинок + завершення */}
        <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
          {restEndsAt ? (
            <RestTimer
              remaining={restRemaining}
              onAdjust={adjustRest}
              onSkip={() => setRestEndsAt(null)}
            />
          ) : null}
          <Pressable
            onPress={onFinish}
            className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
          >
            <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
              ЗАВЕРШИТИ
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
