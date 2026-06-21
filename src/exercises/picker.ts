import { create } from "zustand";

// Спільний механізм вибору вправи з бібліотеки. Той, кому потрібна вправа,
// викликає request(cb) і відкриває /exercises?pick=1; бібліотека після тапу
// викликає fulfill(ex), що передає вибір у cb. Так і активне тренування, і
// редагування минулого користуються одним екраном-бібліотекою.
export type PickedExercise = { id: number; name: string };

type PickerState = {
  onPick: ((ex: PickedExercise) => void) | null;
  request: (cb: (ex: PickedExercise) => void) => void;
  fulfill: (ex: PickedExercise) => void;
};

export const usePicker = create<PickerState>((set, get) => ({
  onPick: null,
  request: (cb) => set({ onPick: cb }),
  fulfill: (ex) => {
    get().onPick?.(ex);
    set({ onPick: null });
  },
}));
