// Єдина точка запуску тренування за рутиною з усіх екранів (головна, екран
// тренувань, деталі рутини). Розв'язує конфлікт «вже є активна сесія»:
//   • та сама рутина вже йде        → просто відкриваємо runner (продовжити);
//   • інша/вільна сесія активна      → питаємо дозвіл і замінюємо її;
//   • сесії немає                    → одразу починаємо.
// Без цього незавершена вільна сесія мовчки блокувала старт рутини.
import { useRouter } from "expo-router";

import { useConfirm } from "@/components/ConfirmDialog";
import { getRoutineDetail } from "@/db/routines";

import { useWorkoutStore } from "./workout-store";

export function useStartRoutine() {
  const router = useRouter();
  const confirm = useConfirm((s) => s.ask);

  return async (routineId: number) => {
    const store = useWorkoutStore.getState();

    // Та сама рутина вже триває — повертаємось у неї, нічого не скидаючи.
    if (
      store.startedAt &&
      store.mode === "routine" &&
      store.routineId === routineId
    ) {
      router.push("/routine-run");
      return;
    }

    // Активна інша сесія (вільна або інша рутина) — питаємо перед втратою.
    if (store.startedAt) {
      const ok = await confirm({
        title: "Незавершене тренування",
        message:
          "Поточну сесію буде втрачено без збереження. Почати цю рутину?",
        confirmText: "Почати",
        cancelText: "Ні",
        destructive: true,
      });
      if (!ok) return;
    }

    const d = await getRoutineDetail(routineId);
    store.replaceFromRoutine(
      routineId,
      d.exercises.map((ex) => ({
        exerciseId: ex.exercise_id,
        name: ex.name,
        targetSets: ex.target_sets ?? 1,
        repLow: ex.rep_low ?? 0,
        repHigh: ex.rep_high ?? 0,
      }))
    );
    router.push("/routine-run");
  };
}
