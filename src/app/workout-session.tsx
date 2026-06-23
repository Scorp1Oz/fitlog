import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
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
import { useConfirm } from "@/components/ConfirmDialog";
import { useCurtain } from "@/components/CurtainOverlay";
import { usePicker } from "@/exercises/picker";
import {
  countCompletedSets,
  getLastExerciseSets,
  saveSession,
} from "@/db/sessions";
import { formatShortDate } from "@/lib/date";
import { mvs, vs } from "@/lib/responsive";
import { formatSetShort } from "@/lib/strength";
import { useTheme } from "@/theme/useTheme";
import { RestBar } from "@/workout/RestBar";
import { RestMenu } from "@/workout/RestMenu";
import { useRestSettings } from "@/workout/rest-settings";
import { useRestNotification } from "@/workout/useRestNotification";
import { useWorkoutStore } from "@/workout/workout-store";

// «минулого разу» для вправи: дата + підходи (null — ще не робив).
type LastSets = { date: number; sets: { weight: number; reps: number }[] } | null;

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
  const playCurtain = useCurtain((s) => s.play);
  const confirm = useConfirm((s) => s.ask);

  const requestPick = usePicker((s) => s.request);

  const startedAt = useWorkoutStore((s) => s.startedAt);
  const exercises = useWorkoutStore((s) => s.exercises);
  const cancel = useWorkoutStore((s) => s.cancel);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);

  const beep = useAudioPlayer(require("../../assets/beep.wav"));

  const defaultRest = useRestSettings((s) => s.defaultRest);
  const muted = useRestSettings((s) => s.muted);
  const setMuted = useRestSettings((s) => s.setMuted);
  const setDefaultRest = useRestSettings((s) => s.setDefaultRest);
  const hydrateSettings = useRestSettings((s) => s.hydrate);

  const [now, setNow] = useState(Date.now());
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Кеш «минулого разу» по exerciseId. undefined — ще не вантажили.
  const [history, setHistory] = useState<Record<number, LastSets>>({});
  // true, коли вже самі ініціюємо вихід (завершення/скасування) — щоб
  // ефект-вартовий нижче не зробив другий router.back().
  const leavingRef = useRef(false);

  // Один тік на секунду для таймера тренування і відпочинку.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Підтягуємо збережені налаштування таймера.
  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  // Підвантажуємо «минулого разу» для кожної доданої вправи (один раз).
  useEffect(() => {
    if (!profile) return;
    for (const ex of exercises) {
      if (history[ex.exerciseId] === undefined) {
        getLastExerciseSets(profile.id, ex.exerciseId).then((res) =>
          setHistory((h) => ({ ...h, [ex.exerciseId]: res }))
        );
      }
    }
  }, [exercises, profile, history]);

  // Закінчився відпочинок — біп і скидання відліку.
  useEffect(() => {
    if (restEndsAt && now >= restEndsAt) {
      setRestEndsAt(null);
      if (!muted) {
        try {
          beep.seekTo(0);
          beep.play();
        } catch {
          // звук не критичний
        }
      }
    }
  }, [now, restEndsAt, beep, muted]);

  // Фонове сповіщення: сигнал «відпочинок завершено» спрацює, навіть коли
  // застосунок згорнутий (JS-таймер у фоні стоїть).
  useRestNotification(restEndsAt);

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

  // Зміна поля підходу. Якщо підхід щойно став повним (є вага й повтори) —
  // запускаємо відпочинок. Саме «виконано» виставляє стор автоматично.
  const changeSet = (
    exIdx: number,
    setIdx: number,
    patch: { weight?: string; reps?: string }
  ) => {
    const cur = exercises[exIdx].sets[setIdx];
    const next = { ...cur, ...patch };
    // Підхід стає виконаним за наявності повторів (вага опційна).
    const wasDone = cur.reps.trim() !== "";
    const willDone = next.reps.trim() !== "";
    updateSet(exIdx, setIdx, patch);
    if (!wasDone && willDone) setRestEndsAt(Date.now() + defaultRest * 1000);
  };

  // Кнопки ±: крок 5 кг для ваги, 1 для повторів. Не нижче 0.
  const stepWeight = (exIdx: number, setIdx: number, delta: number) => {
    const cur = parseFloat(exercises[exIdx].sets[setIdx].weight.replace(",", ".")) || 0;
    const val = Math.max(0, cur + delta);
    changeSet(exIdx, setIdx, { weight: String(val) });
  };
  const stepReps = (exIdx: number, setIdx: number, delta: number) => {
    const cur = parseInt(exercises[exIdx].sets[setIdx].reps, 10) || 0;
    const val = Math.max(0, cur + delta);
    changeSet(exIdx, setIdx, { reps: String(val) });
  };

  const adjustRest = (delta: number) =>
    setRestEndsAt((end) =>
      Math.max(Date.now(), (end ?? Date.now()) + delta * 1000)
    );
  const restartRest = () =>
    setRestEndsAt(Date.now() + defaultRest * 1000);
  const skipRest = () => setRestEndsAt(null);

  const onCancel = async () => {
    const ok = await confirm({
      title: "Скасувати тренування?",
      message: "Незбережені підходи зникнуть.",
      confirmText: "Скасувати",
      cancelText: "Ні",
      destructive: true,
    });
    if (ok) leave();
  };

  const onFinish = async () => {
    const done = countCompletedSets(exercises);
    if (done === 0) {
      const ok = await confirm({
        title: "Немає виконаних підходів",
        message: "Завершити без збереження тренування?",
        confirmText: "Відкинути",
        cancelText: "Назад",
        destructive: true,
      });
      if (ok) leave();
      return;
    }
    if (!profile) return;
    saveSession(profile.id, startedAt, exercises)
      .then((id) => {
        leavingRef.current = true;
        // Лаймова завіса піднімається; коли перекрила екран — навігуємо під нею.
        playCurtain(() => {
          cancel();
          router.replace(`/workout-summary?id=${id}`);
        });
      })
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

      {/* Постійна панель відпочинку — завжди зверху вправ */}
      <RestBar
        remaining={restRemaining}
        active={restEndsAt !== null}
        muted={muted}
        onAdjust={adjustRest}
        onRestart={restartRest}
        onSkip={skipRest}
        onToggleMute={() => setMuted(!muted)}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <RestMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        initialSeconds={restEndsAt ? restRemaining : defaultRest}
        onStart={(s) => setRestEndsAt(Date.now() + s * 1000)}
        defaultRest={defaultRest}
        onChangeDefault={setDefaultRest}
      />

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
            exercises.map((ex, exIdx) => {
              const hist = history[ex.exerciseId];
              return (
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

                {/* Минулого разу */}
                {hist ? (
                  <Text
                    className="mt-1 font-mono text-[10px] text-text-dim"
                    numberOfLines={1}
                  >
                    Минулого разу ({formatShortDate(hist.date)}):{" "}
                    {hist.sets
                      .map((s) => formatSetShort(s.weight, s.reps))
                      .join(" · ")}
                  </Text>
                ) : null}

                {/* Заголовки колонок */}
                <View className="mt-3 flex-row items-center">
                  <View className="w-6" />
                  <Text className="mx-1 flex-1 text-center font-mono text-[10px] text-text-dim">
                    КГ
                  </Text>
                  <Text className="mx-1 flex-1 text-center font-mono text-[10px] text-text-dim">
                    ПОВТ.
                  </Text>
                  <View className="w-6" />
                </View>

                {ex.sets.map((st, setIdx) => (
                  <View key={setIdx} className="mt-2 flex-row items-center">
                    {/* Індикатор виконання (виставляється автоматично) */}
                    <View className="w-6 items-center">
                      <MaterialCommunityIcons
                        name={st.completed ? "check-circle" : "circle-outline"}
                        size={16}
                        color={st.completed ? colors.lime : colors.faint}
                      />
                    </View>

                    {/* Вага: −5 [поле] +5 */}
                    <View className="mx-1 flex-1 flex-row items-center rounded-lg bg-surface-2">
                      <Pressable
                        onPress={() => stepWeight(exIdx, setIdx, -5)}
                        hitSlop={4}
                        className="px-2 py-2 active:opacity-50"
                      >
                        <Text className="font-mono text-xs text-text-muted">−5</Text>
                      </Pressable>
                      <TextInput
                        value={st.weight}
                        onChangeText={(t) => changeSet(exIdx, setIdx, { weight: t })}
                        keyboardType="decimal-pad"
                        placeholder={
                          hist?.sets[setIdx] ? String(hist.sets[setIdx].weight) : "0"
                        }
                        placeholderTextColor={colors.textDim}
                        style={{ textAlign: "center" }}
                        className="flex-1 py-2 font-sans text-text"
                      />
                      <Pressable
                        onPress={() => stepWeight(exIdx, setIdx, 5)}
                        hitSlop={4}
                        className="px-2 py-2 active:opacity-50"
                      >
                        <Text className="font-mono text-xs text-text-muted">+5</Text>
                      </Pressable>
                    </View>

                    {/* Повтори: −1 [поле] +1 */}
                    <View className="mx-1 flex-1 flex-row items-center rounded-lg bg-surface-2">
                      <Pressable
                        onPress={() => stepReps(exIdx, setIdx, -1)}
                        hitSlop={4}
                        className="px-2 py-2 active:opacity-50"
                      >
                        <Text className="font-mono text-xs text-text-muted">−1</Text>
                      </Pressable>
                      <TextInput
                        value={st.reps}
                        onChangeText={(t) => changeSet(exIdx, setIdx, { reps: t })}
                        keyboardType="number-pad"
                        placeholder={
                          hist?.sets[setIdx] ? String(hist.sets[setIdx].reps) : "0"
                        }
                        placeholderTextColor={colors.textDim}
                        style={{ textAlign: "center" }}
                        className="flex-1 py-2 font-sans text-text"
                      />
                      <Pressable
                        onPress={() => stepReps(exIdx, setIdx, 1)}
                        hitSlop={4}
                        className="px-2 py-2 active:opacity-50"
                      >
                        <Text className="font-mono text-xs text-text-muted">+1</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => removeSet(exIdx, setIdx)}
                      hitSlop={4}
                      className="w-6 items-center active:opacity-60"
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
              );
            })
          )}

          <Pressable
            onPress={() => {
              requestPick((ex) => addExercise(ex));
              router.push("/exercises?pick=1");
            }}
            className="mt-4 items-center rounded-2xl border border-lime active:opacity-70"
            style={{ paddingVertical: vs(12) }}
          >
            <Text className="font-sans-strong text-lime" style={{ fontSize: mvs(14) }}>
              + ДОДАТИ ВПРАВУ
            </Text>
          </Pressable>
        </ScrollView>

        {/* Низ: завершення */}
        <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
          <Pressable
            onPress={onFinish}
            className="items-center rounded-2xl bg-lime active:opacity-80"
            style={{ paddingVertical: vs(14) }}
          >
            <Text
              className="font-sans-strong tracking-[1px] text-on-lime"
              style={{ fontSize: mvs(15) }}
            >
              ЗАВЕРШИТИ
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
