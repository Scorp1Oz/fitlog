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
import { LimeGlow } from "@/components/LimeGlow";
import {
  countCompletedSets,
  getLastExerciseSets,
  saveSession,
} from "@/db/sessions";
import { formatShortDate } from "@/lib/date";
import { mvs, vs } from "@/lib/responsive";
import { formatSetShort, formatTarget } from "@/lib/strength";
import { useTheme } from "@/theme/useTheme";
import { RestBar } from "@/workout/RestBar";
import { RestMenu } from "@/workout/RestMenu";
import { useRestSettings } from "@/workout/rest-settings";
import { useRestNotification } from "@/workout/useRestNotification";
import { useWorkoutStore } from "@/workout/workout-store";

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

export default function RoutineRun() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const playCurtain = useCurtain((s) => s.play);
  const confirm = useConfirm((s) => s.ask);

  const startedAt = useWorkoutStore((s) => s.startedAt);
  const mode = useWorkoutStore((s) => s.mode);
  const routineId = useWorkoutStore((s) => s.routineId);
  const exercises = useWorkoutStore((s) => s.exercises);
  const cancel = useWorkoutStore((s) => s.cancel);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);

  const beep = useAudioPlayer(require("../../assets/beep.wav"));

  const defaultRest = useRestSettings((s) => s.defaultRest);
  const muted = useRestSettings((s) => s.muted);
  const setMuted = useRestSettings((s) => s.setMuted);
  const setDefaultRest = useRestSettings((s) => s.setDefaultRest);
  const hydrateSettings = useRestSettings((s) => s.hydrate);

  // Поточна вправа в послідовності.
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [history, setHistory] = useState<Record<number, LastSets>>({});
  const leavingRef = useRef(false);

  // Тік таймера.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  // «Минулого разу» для кожної вправи (один раз).
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

  // Кінець відпочинку — біп.
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

  // Фонове сповіщення «відпочинок завершено» — працює і при згорнутому застосунку.
  useRestNotification(restEndsAt);

  // Захист: екран має сенс лише для активної рутинної сесії.
  useEffect(() => {
    if ((!startedAt || mode !== "routine") && !leavingRef.current) {
      router.back();
    }
  }, [startedAt, mode, router]);

  if (!startedAt || mode !== "routine") return null;

  const total = exercises.length;
  const ex = exercises[Math.min(index, total - 1)];
  const exIdx = Math.min(index, total - 1);
  const hist = history[ex.exerciseId];
  const isLast = exIdx >= total - 1;
  const target = formatTarget(
    ex.targetSets ?? null,
    ex.repLow ?? null,
    ex.repHigh ?? null
  );

  const leave = () => {
    leavingRef.current = true;
    cancel();
    router.back();
  };

  const restRemaining = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : 0;

  // Зміна поля підходу. Свіжо-виконаний підхід запускає відпочинок.
  const changeSet = (
    setIdx: number,
    patch: { weight?: string; reps?: string }
  ) => {
    const cur = ex.sets[setIdx];
    const wasDone = cur.reps.trim() !== "";
    const willDone = { ...cur, ...patch }.reps.trim() !== "";
    updateSet(exIdx, setIdx, patch);
    if (!wasDone && willDone) setRestEndsAt(Date.now() + defaultRest * 1000);
  };

  const stepWeight = (setIdx: number, delta: number) => {
    const cur = parseFloat(ex.sets[setIdx].weight.replace(",", ".")) || 0;
    changeSet(setIdx, { weight: String(Math.max(0, cur + delta)) });
  };
  const stepReps = (setIdx: number, delta: number) => {
    const cur = parseInt(ex.sets[setIdx].reps, 10) || 0;
    changeSet(setIdx, { reps: String(Math.max(0, cur + delta)) });
  };

  const adjustRest = (delta: number) =>
    setRestEndsAt((end) =>
      Math.max(Date.now(), (end ?? Date.now()) + delta * 1000)
    );
  const restartRest = () => setRestEndsAt(Date.now() + defaultRest * 1000);
  const skipRest = () => setRestEndsAt(null);

  const goPrev = () => {
    if (exIdx > 0) setIndex(exIdx - 1);
  };
  const goNext = () => {
    if (!isLast) setIndex(exIdx + 1);
  };

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
    saveSession(profile.id, startedAt, exercises, routineId)
      .then((id) => {
        leavingRef.current = true;
        playCurtain(() => {
          cancel();
          router.replace(`/workout-summary?id=${id}`);
        });
      })
      .catch((e) => Alert.alert("Помилка збереження", String(e)));
  };

  // Скільки підходів цієї вправи вже виконано (для прогресу картки).
  const doneInExercise = ex.sets.filter((s) => s.completed).length;

  return (
    <View className="flex-1 bg-bg">
      {/* Шапка: скасувати · таймер · прогрес вправ */}
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
        <Text className="w-16 text-right font-mono text-sm text-text-muted">
          {exIdx + 1} / {total}
        </Text>
      </View>

      {/* Смуга прогресу по вправах */}
      <View className="h-1 flex-row bg-surface-2">
        {exercises.map((_, i) => (
          <View
            key={i}
            className={`h-full flex-1 ${
              i <= exIdx ? "bg-lime" : "bg-transparent"
            } ${i > 0 ? "ml-px" : ""}`}
          />
        ))}
      </View>

      {/* Постійна панель відпочинку */}
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
          {/* Картка поточної вправи */}
          <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <Text
              className="font-display text-text"
              style={{ fontSize: mvs(26), lineHeight: mvs(28) }}
              numberOfLines={2}
            >
              {ex.name}
            </Text>

            {/* Ціль + прогрес підходів */}
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="font-mono text-xs tracking-[1px] text-lime">
                {target || "ЦІЛЬ НЕ ЗАДАНА"}
              </Text>
              <Text className="font-mono text-[11px] text-text-dim">
                {doneInExercise}/{ex.sets.length} викон.
              </Text>
            </View>

            {/* Минулого разу */}
            {hist ? (
              <Text
                className="mt-2 font-mono text-[10px] text-text-dim"
                numberOfLines={1}
              >
                Минулого разу ({formatShortDate(hist.date)}):{" "}
                {hist.sets
                  .map((s) => formatSetShort(s.weight, s.reps))
                  .join(" · ")}
              </Text>
            ) : null}

            {/* Заголовки колонок */}
            <View className="mt-4 flex-row items-center">
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
                <View className="w-6 items-center">
                  <MaterialCommunityIcons
                    name={st.completed ? "check-circle" : "circle-outline"}
                    size={16}
                    color={st.completed ? colors.lime : colors.faint}
                  />
                </View>

                {/* Вага */}
                <View className="mx-1 flex-1 flex-row items-center rounded-lg bg-surface-2">
                  <Pressable
                    onPress={() => stepWeight(setIdx, -5)}
                    hitSlop={4}
                    className="px-2 py-2 active:opacity-50"
                  >
                    <Text className="font-mono text-xs text-text-muted">−5</Text>
                  </Pressable>
                  <TextInput
                    value={st.weight}
                    onChangeText={(t) => changeSet(setIdx, { weight: t })}
                    keyboardType="decimal-pad"
                    placeholder={
                      hist?.sets[setIdx] ? String(hist.sets[setIdx].weight) : "0"
                    }
                    placeholderTextColor={colors.textDim}
                    style={{ textAlign: "center" }}
                    className="flex-1 py-2 font-sans text-text"
                  />
                  <Pressable
                    onPress={() => stepWeight(setIdx, 5)}
                    hitSlop={4}
                    className="px-2 py-2 active:opacity-50"
                  >
                    <Text className="font-mono text-xs text-text-muted">+5</Text>
                  </Pressable>
                </View>

                {/* Повтори */}
                <View className="mx-1 flex-1 flex-row items-center rounded-lg bg-surface-2">
                  <Pressable
                    onPress={() => stepReps(setIdx, -1)}
                    hitSlop={4}
                    className="px-2 py-2 active:opacity-50"
                  >
                    <Text className="font-mono text-xs text-text-muted">−1</Text>
                  </Pressable>
                  <TextInput
                    value={st.reps}
                    onChangeText={(t) => changeSet(setIdx, { reps: t })}
                    keyboardType="number-pad"
                    placeholder={
                      hist?.sets[setIdx]
                        ? String(hist.sets[setIdx].reps)
                        : ex.repLow
                          ? String(ex.repLow)
                          : "0"
                    }
                    placeholderTextColor={colors.textDim}
                    style={{ textAlign: "center" }}
                    className="flex-1 py-2 font-sans text-text"
                  />
                  <Pressable
                    onPress={() => stepReps(setIdx, 1)}
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

            {/* Додатковий підхід дозволено (дроп-сет / поганий день) */}
            <Pressable
              onPress={() => addSet(exIdx)}
              className="mt-3 items-center rounded-xl border border-border py-2 active:opacity-70"
            >
              <Text className="font-mono text-[11px] tracking-[1px] text-text-muted">
                + ПІДХІД
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Низ: навігація між вправами / завершення */}
        <View
          className="flex-row gap-3 px-4 pt-2"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            onPress={goPrev}
            disabled={exIdx === 0}
            className={`flex-1 flex-row items-center justify-center gap-1 rounded-2xl border ${
              exIdx === 0 ? "border-border" : "border-border active:opacity-70"
            }`}
            style={{ paddingVertical: vs(14) }}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={mvs(20)}
              color={exIdx === 0 ? colors.faint : colors.textMuted}
            />
            <Text
              className={`font-sans-strong ${
                exIdx === 0 ? "text-text-dim" : "text-text-muted"
              }`}
              style={{ fontSize: mvs(14) }}
            >
              Назад
            </Text>
          </Pressable>

          {isLast ? (
            <LimeGlow className="flex-[1.4]">
              <Pressable
                onPress={onFinish}
                className="w-full items-center rounded-2xl bg-lime active:opacity-80"
                style={{ paddingVertical: vs(14) }}
              >
                <Text
                  className="font-sans-strong tracking-[1px] text-on-lime"
                  style={{ fontSize: mvs(15) }}
                >
                  ЗАВЕРШИТИ
                </Text>
              </Pressable>
            </LimeGlow>
          ) : (
            <LimeGlow className="flex-[1.4]">
              <Pressable
                onPress={goNext}
                className="w-full flex-row items-center justify-center gap-1 rounded-2xl bg-lime active:opacity-80"
                style={{ paddingVertical: vs(14) }}
              >
                <Text
                  className="font-sans-strong tracking-[1px] text-on-lime"
                  style={{ fontSize: mvs(15) }}
                >
                  ДАЛІ
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={mvs(20)}
                  color={colors.onLime}
                />
              </Pressable>
            </LimeGlow>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
