import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/components/StackHeader";
import {
  getSessionDetail,
  replaceSessionSets,
  type SessionSummary,
} from "@/db/sessions";
import { usePicker } from "@/exercises/picker";
import { formatDuration, formatLongDate, formatTime } from "@/lib/date";
import { bestE1rm, formatSet, kg } from "@/lib/strength";
import { useTheme } from "@/theme/useTheme";

type EditSet = { weight: string; reps: string };
type EditExercise = { exerciseId: number; name: string; sets: EditSet[] };

const emptySet = (): EditSet => ({ weight: "", reps: "" });

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const requestPick = usePicker((s) => s.request);

  const [session, setSession] = useState<SessionSummary | null>(null);
  const [exercises, setExercises] = useState<EditExercise[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    getSessionDetail(Number(id)).then((d) => {
      setSession(d.session);
      setExercises(
        d.exercises.map((ex) => ({
          exerciseId: ex.exercise_id,
          name: ex.name,
          sets: ex.sets.map((s) => ({
            weight: String(s.weight),
            reps: String(s.reps),
          })),
        }))
      );
    });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Локальні правки (доступні лише в режимі редагування) ──
  const updateSet = (exIdx: number, setIdx: number, patch: Partial<EditSet>) =>
    setExercises((list) =>
      list.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, ...patch } : s
              ),
            }
          : ex
      )
    );
  const addSet = (exIdx: number) =>
    setExercises((list) =>
      list.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex
      )
    );
  const removeSet = (exIdx: number, setIdx: number) =>
    setExercises((list) =>
      list.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
      )
    );
  const removeExercise = (exIdx: number) =>
    setExercises((list) => list.filter((_, i) => i !== exIdx));
  const addExercise = () => {
    requestPick((ex) =>
      setExercises((list) => [
        ...list,
        { exerciseId: ex.id, name: ex.name, sets: [emptySet()] },
      ])
    );
    router.push("/exercises?pick=1");
  };

  const cancelEdit = () => {
    load(); // відкидаємо незбережене
    setEditing(false);
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    await replaceSessionSets(
      Number(id),
      exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets }))
    );
    setSaving(false);
    setEditing(false);
    load(); // оновлюємо перегляд свіжими даними
  };

  const exerciseE1rm = (ex: EditExercise) =>
    bestE1rm(
      ex.sets.map((s) => ({
        weight: parseFloat(s.weight.replace(",", ".")) || 0,
        reps: parseInt(s.reps, 10) || 0,
      }))
    );

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="ТРЕНУВАННЯ" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 8}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {session ? (
            <View className="mb-2">
              <Text className="font-display text-2xl text-text">
                {formatLongDate(session.started_at)}
              </Text>
              <Text className="mt-1 font-mono text-[11px] text-text-dim">
                {formatTime(session.started_at)} ·{" "}
                {formatDuration(
                  session.ended_at
                    ? session.ended_at - session.started_at
                    : null
                )}
              </Text>
            </View>
          ) : null}

          {exercises.map((ex, exIdx) => {
            const e1 = exerciseE1rm(ex);
            return (
              <View
                key={exIdx}
                className="mt-3 rounded-2xl border border-border bg-surface p-3"
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="flex-1 font-sans-strong text-text"
                    numberOfLines={1}
                  >
                    {ex.name}
                  </Text>
                  {e1 > 0 ? (
                    <Text className="mr-2 font-mono text-[11px] text-text-dim">
                      1ПМ ~{kg(e1)} кг
                    </Text>
                  ) : null}
                  {editing ? (
                    <Pressable
                      onPress={() => removeExercise(exIdx)}
                      hitSlop={8}
                      className="active:opacity-60"
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color={colors.textDim}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {editing ? (
                  <>
                    {/* Редагування: поля вводу */}
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
                          onChangeText={(t) =>
                            updateSet(exIdx, setIdx, { reps: t })
                          }
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={colors.textDim}
                          style={{ textAlign: "center" }}
                          className="mx-1 flex-1 rounded-lg bg-surface-2 px-2 py-2 font-sans text-text"
                        />
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
                  </>
                ) : (
                  /* Перегляд: текстом */
                  <View className="mt-3 gap-1.5">
                    {ex.sets.map((s, i) => (
                      <View key={i} className="flex-row items-center">
                        <Text className="w-8 font-mono text-text-dim">
                          {i + 1}
                        </Text>
                        <Text className="font-sans text-text">
                          {formatSet(
                            parseFloat(s.weight.replace(",", ".")) || 0,
                            parseInt(s.reps, 10) || 0
                          )}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {editing ? (
            <Pressable
              onPress={addExercise}
              className="mt-4 items-center rounded-2xl border border-lime py-3.5 active:opacity-70"
            >
              <Text className="font-sans-strong text-lime">
                + ДОДАТИ ВПРАВУ
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {/* Низ: керування режимом */}
        <View className="px-4" style={{ paddingBottom: insets.bottom + 12 }}>
          {editing ? (
            <View className="flex-row gap-3">
              <Pressable
                onPress={cancelEdit}
                disabled={saving}
                className="flex-1 items-center rounded-2xl border border-border py-4 active:opacity-70"
              >
                <Text className="font-sans-strong text-text-muted">
                  СКАСУВАТИ
                </Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                className="flex-1 items-center rounded-2xl bg-lime py-4 active:opacity-80"
              >
                <Text className="font-sans-strong text-on-lime">ЗБЕРЕГТИ</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setEditing(true)}
              className="items-center rounded-2xl border border-lime py-4 active:opacity-70"
            >
              <Text className="font-sans-strong text-base tracking-[1px] text-lime">
                РЕДАГУВАТИ
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
