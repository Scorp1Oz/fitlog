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
};

type WorkoutState = {
  startedAt: number | null;
  exercises: WorkoutExercise[];

  start: () => void;
  cancel: () => void;
  isActive: () => boolean;

  addExercise: (e: { id: number; name: string }) => void;
  removeExercise: (exIdx: number) => void;

  addSet: (exIdx: number) => void;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<WorkoutSet>) => void;
  removeSet: (exIdx: number, setIdx: number) => void;
};

const emptySet = (): WorkoutSet => ({ weight: "", reps: "", completed: false });

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  startedAt: null,
  exercises: [],

  start: () => {
    // Якщо сесія вже триває — не скидаємо її.
    if (get().startedAt) return;
    set({ startedAt: Date.now(), exercises: [] });
  },

  cancel: () => set({ startedAt: null, exercises: [] }),

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
              sets: ex.sets.map((st, j) =>
                j === setIdx ? { ...st, ...patch } : st
              ),
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
