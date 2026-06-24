import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { LimeGlow } from "@/components/LimeGlow";
import { StackHeader } from "@/components/StackHeader";
import {
  createRoutine,
  getRoutineDetail,
  updateRoutine,
} from "@/db/routines";
import { usePicker } from "@/exercises/picker";
import { useTheme } from "@/theme/useTheme";

// Рядок вправи у формі. rep*-поля — рядки (зручно для TextInput),
// парсимо при збереженні. targetSets — число (керується кнопками ±).
type EditExercise = {
  exerciseId: number;
  name: string;
  targetSets: number;
  repLow: string;
  repHigh: string;
};

export default function RoutineEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routineId = id ? Number(id) : null;
  const requestPick = usePicker((s) => s.request);

  const [name, setName] = useState("");
  const [items, setItems] = useState<EditExercise[]>([]);
  const [busy, setBusy] = useState(false);

  // Редагування наявної рутини — підвантажуємо її один раз.
  useEffect(() => {
    if (!routineId) return;
    getRoutineDetail(routineId).then((d) => {
      setName(d.routine?.name ?? "");
      setItems(
        d.exercises.map((ex) => ({
          exerciseId: ex.exercise_id,
          name: ex.name,
          targetSets: ex.target_sets ?? 3,
          repLow: ex.rep_low ? String(ex.rep_low) : "",
          repHigh: ex.rep_high ? String(ex.rep_high) : "",
        }))
      );
    });
  }, [routineId]);

  const addExercise = () => {
    // Функціональний апдейт — щоб не загубити стан, поки були на бібліотеці.
    requestPick((ex) =>
      setItems((prev) =>
        // Не додаємо дубль тієї ж вправи.
        prev.some((p) => p.exerciseId === ex.id)
          ? prev
          : [
              ...prev,
              {
                exerciseId: ex.id,
                name: ex.name,
                targetSets: 3,
                repLow: "8",
                repHigh: "12",
              },
            ]
      )
    );
    router.push("/exercises?pick=1");
  };

  const removeExercise = (exerciseId: number) =>
    setItems((prev) => prev.filter((p) => p.exerciseId !== exerciseId));

  const stepSets = (exerciseId: number, delta: number) =>
    setItems((prev) =>
      prev.map((p) =>
        p.exerciseId === exerciseId
          ? { ...p, targetSets: Math.max(1, p.targetSets + delta) }
          : p
      )
    );

  const setReps = (exerciseId: number, patch: Partial<EditExercise>) =>
    setItems((prev) =>
      prev.map((p) => (p.exerciseId === exerciseId ? { ...p, ...patch } : p))
    );

  const save = async () => {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert("Назва", "Вкажи назву рутини.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Вправи", "Додай хоча б одну вправу.");
      return;
    }
    setBusy(true);
    const payload = items.map((it) => {
      const lo = parseInt(it.repLow, 10) || 0;
      const hi = parseInt(it.repHigh, 10) || 0;
      return {
        exerciseId: it.exerciseId,
        targetSets: it.targetSets,
        repLow: lo,
        // Якщо верх не вказано — дорівнює низу (фіксована к-сть повторів).
        repHigh: hi || lo,
      };
    });
    try {
      if (routineId) {
        await updateRoutine(routineId, name.trim(), payload);
      } else {
        await createRoutine(profile.id, name.trim(), payload);
      }
      router.back();
    } catch (e) {
      Alert.alert("Помилка збереження", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title={routineId ? "РЕДАГУВАННЯ" : "НОВА РУТИНА"} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Назва */}
        <View className="gap-2">
          <Text className="font-mono text-[10px] tracking-[2px] text-text">
            НАЗВА
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Напр. Груди + трицепс"
            placeholderTextColor={colors.textDim}
            className="rounded-md border-b border-border bg-surface px-3 py-3 font-sans text-text"
          />
        </View>

        {/* Вправи */}
        <Text className="mb-2 mt-6 font-mono text-[10px] tracking-[2px] text-text">
          ВПРАВИ
        </Text>

        {items.map((it) => (
          <View
            key={it.exerciseId}
            className="mb-3 rounded-2xl border border-border bg-surface p-3"
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="flex-1 font-sans-strong text-text"
                numberOfLines={1}
              >
                {it.name}
              </Text>
              <Pressable
                onPress={() => removeExercise(it.exerciseId)}
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

            <View className="mt-3 flex-row items-center gap-3">
              {/* Підходи: −[N]+ */}
              <View className="items-center">
                <Text className="mb-1 font-mono text-[10px] text-text-dim">
                  ПІДХОДИ
                </Text>
                <View className="flex-row items-center rounded-lg bg-surface-2">
                  <Pressable
                    onPress={() => stepSets(it.exerciseId, -1)}
                    hitSlop={4}
                    className="px-3 py-2 active:opacity-50"
                  >
                    <Text className="font-mono text-sm text-text-muted">−</Text>
                  </Pressable>
                  <Text className="w-6 text-center font-sans text-text">
                    {it.targetSets}
                  </Text>
                  <Pressable
                    onPress={() => stepSets(it.exerciseId, 1)}
                    hitSlop={4}
                    className="px-3 py-2 active:opacity-50"
                  >
                    <Text className="font-mono text-sm text-text-muted">+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Повтори: від–до */}
              <View className="flex-1 items-center">
                <Text className="mb-1 font-mono text-[10px] text-text-dim">
                  ПОВТОРИ
                </Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={it.repLow}
                    onChangeText={(t) =>
                      setReps(it.exerciseId, { repLow: t })
                    }
                    keyboardType="number-pad"
                    placeholder="8"
                    placeholderTextColor={colors.textDim}
                    style={{ textAlign: "center" }}
                    className="w-14 rounded-lg bg-surface-2 py-2 font-sans text-text"
                  />
                  <Text className="font-mono text-text-dim">–</Text>
                  <TextInput
                    value={it.repHigh}
                    onChangeText={(t) =>
                      setReps(it.exerciseId, { repHigh: t })
                    }
                    keyboardType="number-pad"
                    placeholder="12"
                    placeholderTextColor={colors.textDim}
                    style={{ textAlign: "center" }}
                    className="w-14 rounded-lg bg-surface-2 py-2 font-sans text-text"
                  />
                </View>
              </View>
            </View>
          </View>
        ))}

        <Pressable
          onPress={addExercise}
          className="mt-1 items-center rounded-2xl border border-lime py-3.5 active:opacity-70"
        >
          <Text className="font-sans-strong text-lime">+ ДОДАТИ ВПРАВУ</Text>
        </Pressable>

        <LimeGlow className="mt-8">
          <Pressable
            onPress={save}
            disabled={busy}
            className="items-center rounded-2xl bg-lime py-4 active:opacity-80"
          >
            <Text className="font-sans-strong text-base tracking-[1px] text-on-lime">
              ЗБЕРЕГТИ РУТИНУ
            </Text>
          </Pressable>
        </LimeGlow>
      </ScrollView>
    </View>
  );
}
