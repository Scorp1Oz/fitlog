import { Modal, Pressable, Text, View } from "react-native";
import { create } from "zustand";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmState = {
  options: ConfirmOptions | null;
  resolver: ((v: boolean) => void) | null;
  ask: (o: ConfirmOptions) => Promise<boolean>;
  _close: (v: boolean) => void;
};

// Імперативний темний діалог замість нативного Alert. ask(...) → Promise<bool>.
export const useConfirm = create<ConfirmState>((set, get) => ({
  options: null,
  resolver: null,
  ask: (o) =>
    new Promise<boolean>((resolve) => set({ options: o, resolver: resolve })),
  _close: (v) => {
    get().resolver?.(v);
    set({ options: null, resolver: null });
  },
}));

export function ConfirmDialog() {
  const options = useConfirm((s) => s.options);
  const close = useConfirm((s) => s._close);

  return (
    <Modal
      visible={!!options}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => close(false)}
    >
      <Pressable
        onPress={() => close(false)}
        className="flex-1 items-center justify-center bg-black/70 px-8"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-3xl border border-border bg-surface p-6"
        >
          <Text className="font-display text-xl text-text">
            {options?.title}
          </Text>
          {options?.message ? (
            <Text className="mt-2 font-sans text-text-muted">
              {options.message}
            </Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={() => close(false)}
              className="flex-1 items-center rounded-2xl border border-border py-3 active:opacity-70"
            >
              <Text className="font-sans-strong text-text-muted">
                {options?.cancelText ?? "Скасувати"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => close(true)}
              className={`flex-1 items-center rounded-2xl py-3 active:opacity-80 ${
                options?.destructive ? "bg-orange" : "bg-lime"
              }`}
            >
              <Text
                className={`font-sans-strong ${
                  options?.destructive ? "text-text" : "text-on-lime"
                }`}
              >
                {options?.confirmText ?? "Підтвердити"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
