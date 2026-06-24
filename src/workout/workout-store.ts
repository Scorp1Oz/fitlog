// Стан активного («вільного») тренування. Живе в пам'яті, поки сесія не
// завершена або скасована. weight/reps — рядки (зручно для TextInput),
// парсимо їх лише при збереженні в БД.
import { create } from "zustand";

export type WorkoutSet = {
  weight: string;
  reps: string;
  completed: boolean;
};

export type WorkoutExercise = {
  exerciseId: number;
  name: string;
  sets: WorkoutSet[];
  // Цілі з рутини (лише для режиму 'routine' — підказки в runner'і).
  targetSets?: number;
  repLow?: number;
  repHigh?: number;
};

// Як почалася сесія: вільне тренування чи виконання рутини.
export type WorkoutMode = "free" | "routine";

type WorkoutState = {
  startedAt: number | null;
  mode: WorkoutMode;
  routineId: number | null;
  exercises: WorkoutExercise[];

  start: () => void;
  startFromRoutine: (
    routineId: number,
    items: {
      exerciseId: number;
      name: string;
      targetSets: number;
      repLow: number;
      repHigh: number;
    }[]
  ) => void;
  // Безумовний запуск рутини: скидає будь-яку поточну сесію й починає нову
  // (для випадку, коли користувач свідомо погодився втратити незавершене).
  replaceFromRoutine: (
    routineId: number,
    items: {
      exerciseId: number;
      name: string;
      targetSets: number;
      repLow: number;
      repHigh: number;
    }[]
  ) => void;
  cancel: () => void;
  isActive: () => boolean;

  addExercise: (e: { id: number; name: string }) => void;
  removeExercise: (exIdx: number) => void;

  addSet: (exIdx: number) => void;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<WorkoutSet>) => void;
  removeSet: (exIdx: number, setIdx: number) => void;
};

const emptySet = (): WorkoutSet => ({ weight: "", reps: "", completed: false });

// Свіжий стан рутинної сесії з елементів рутини (спільне для start/replace).
function buildRoutineSession(
  routineId: number,
  items: {
    exerciseId: number;
    name: string;
    targetSets: number;
    repLow: number;
    repHigh: number;
  }[]
) {
  return {
    startedAt: Date.now(),
    mode: "routine" as WorkoutMode,
    routineId,
    exercises: items.map((it) => ({
      exerciseId: it.exerciseId,
      name: it.name,
      targetSets: it.targetSets,
      repLow: it.repLow,
      repHigh: it.repHigh,
      // Стільки порожніх підходів, скільки в шаблоні (мінімум 1).
      sets: Array.from({ length: Math.max(1, it.targetSets) }, emptySet),
    })),
  };
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  startedAt: null,
  mode: "free",
  routineId: null,
  exercises: [],

  start: () => {
    // Якщо сесія вже триває — не скидаємо її.
    if (get().startedAt) return;
    set({ startedAt: Date.now(), mode: "free", routineId: null, exercises: [] });
  },

  startFromRoutine: (routineId, items) => {
    // Якщо сесія вже триває — не перезаписуємо її.
    if (get().startedAt) return;
    set(buildRoutineSession(routineId, items));
  },

  replaceFromRoutine: (routineId, items) => {
    // Безумовно: скидаємо поточну сесію й починаємо нову рутину.
    set(buildRoutineSession(routineId, items));
  },

  cancel: () =>
    set({ startedAt: null, mode: "free", routineId: null, exercises: [] }),

  isActive: () => get().startedAt !== null,

  addExercise: (e) =>
    set((s) => ({
      exercises: [
        ...s.exercises,
        // Один порожній підхід одразу — щоб було куди вписувати.
        { exerciseId: e.id, name: e.name, sets: [emptySet()] },
      ],
    })),

  removeExercise: (exIdx) =>
    set((s) => ({ exercises: s.exercises.filter((_, i) => i !== exIdx) })),

  addSet: (exIdx) =>
    set((s) => ({
      exercises: s.exercises.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex
      ),
    })),

  updateSet: (exIdx, setIdx, patch) =>
    set((s) => ({
      exercises: s.exercises.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((st, j) => {
                if (j !== setIdx) return st;
                const next = { ...st, ...patch };
                // Підхід виконаний, щойно вказані повтори. Вага опційна —
                // деякі вправи (підтягування, скрючування) без обтяження.
                next.completed = next.reps.trim() !== "";
                return next;
              }),
            }
          : ex
      ),
    })),

  removeSet: (exIdx, setIdx) =>
    set((s) => ({
      exercises: s.exercises.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
      ),
    })),
}));
