import { useEffect, useRef, useState } from "react";
import {
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { LimeGlow } from "@/components/LimeGlow";
import { useTheme } from "@/theme/useTheme";

const ITEM_H = 44;
const VISIBLE = 3; // показуємо 3 елементи, обраний — по центру

// Колесо-пікер: вертикальний свайп зі снапом, як у таймерах.
function Wheel({
  values,
  value,
  onChange,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const { colors } = useTheme();
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const i = Math.max(0, values.indexOf(value));
    requestAnimationFrame(() =>
      ref.current?.scrollTo({ y: i * ITEM_H, animated: false })
    );
    // лише при монтуванні
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(values.length - 1, i));
    if (values[clamped] !== value) onChange(values[clamped]);
  };

  return (
    <View style={{ height: ITEM_H * VISIBLE, width: 72 }}>
      {/* Смуга вибору по центру */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ITEM_H,
          height: ITEM_H,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
      >
        {values.map((v) => (
          <View
            key={v}
            style={{ height: ITEM_H }}
            className="items-center justify-center"
          >
            <Text
              className={`font-display text-3xl ${
                v === value ? "text-lime" : "text-text-dim"
              }`}
            >
              {String(v).padStart(2, "0")}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const MINUTES = Array.from({ length: 16 }, (_, i) => i); // 0..15
const SECONDS = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

export function RestMenu({
  visible,
  onClose,
  initialSeconds,
  onStart,
  defaultRest,
  onChangeDefault,
}: {
  visible: boolean;
  onClose: () => void;
  initialSeconds: number;
  onStart: (seconds: number) => void;
  defaultRest: number;
  onChangeDefault: (seconds: number) => void;
}) {
  const { colors } = useTheme();

  // Колесо: хвилини/секунди для запуску таймера.
  const [min, setMin] = useState(0);
  const [sec, setSec] = useState(0);

  // Стандартний час — вводом (mm:ss).
  const [dMin, setDMin] = useState("1");
  const [dSec, setDSec] = useState("30");

  useEffect(() => {
    if (!visible) return;
    setMin(Math.min(15, Math.floor(initialSeconds / 60)));
    // округлюємо секунди до кроку 5
    setSec(Math.round((initialSeconds % 60) / 5) * 5 || 0);
    setDMin(String(Math.floor(defaultRest / 60)));
    setDSec(String(defaultRest % 60).padStart(2, "0"));
  }, [visible, initialSeconds, defaultRest]);

  const commitDefault = (mStr: string, sStr: string) => {
    const total = (parseInt(mStr, 10) || 0) * 60 + (parseInt(sStr, 10) || 0);
    onChangeDefault(total);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center px-6">
        {/* Бекдроп позаду картки — тап повз закриває. Картка — звичайний View,
            щоб Pressable-предок не перехоплював свайп колеса. */}
        <Pressable
          onPress={onClose}
          className="absolute inset-0 bg-black/70"
        />
        <View className="w-full rounded-3xl border border-border bg-surface p-6">
          <Text className="font-mono text-[11px] tracking-[3px] text-lime">
            ЧАС ТАЙМЕРА
          </Text>

          {/* Колесо хв:сек */}
          <View className="mt-3 flex-row items-center justify-center gap-2">
            <Wheel values={MINUTES} value={min} onChange={setMin} />
            <Text className="font-display text-3xl text-text-muted">:</Text>
            <Wheel values={SECONDS} value={sec} onChange={setSec} />
          </View>

          <LimeGlow className="mt-2">
            <Pressable
              onPress={() => {
                const total = min * 60 + sec;
                if (total > 0) onStart(total);
                onClose();
              }}
              className="items-center rounded-2xl bg-lime py-3 active:opacity-80"
            >
              <Text className="font-sans-strong text-on-lime">ЗАПУСТИТИ</Text>
            </Pressable>
          </LimeGlow>

          <View className="my-5 h-px bg-border" />

          {/* Стандартний час між підходами — лише ввід */}
          <Text className="font-mono text-[11px] tracking-[3px] text-text-dim">
            СТАНДАРТНИЙ ЧАС МІЖ ПІДХОДАМИ
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            <TextInput
              value={dMin}
              onChangeText={(t) => {
                setDMin(t);
                commitDefault(t, dSec);
              }}
              keyboardType="number-pad"
              maxLength={2}
              placeholderTextColor={colors.textDim}
              style={{ textAlign: "center" }}
              className="w-16 rounded-lg bg-surface-2 px-2 py-2 font-display text-2xl text-text"
            />
            <Text className="font-display text-2xl text-text-muted">:</Text>
            <TextInput
              value={dSec}
              onChangeText={(t) => {
                setDSec(t);
                commitDefault(dMin, t);
              }}
              keyboardType="number-pad"
              maxLength={2}
              placeholderTextColor={colors.textDim}
              style={{ textAlign: "center" }}
              className="w-16 rounded-lg bg-surface-2 px-2 py-2 font-display text-2xl text-text"
            />
            <Text className="ml-1 font-mono text-[10px] text-text-dim">
              хв : сек
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
