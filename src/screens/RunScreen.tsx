import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { useCurtain } from "@/components/CurtainOverlay";
import { LimeGlow } from "@/components/LimeGlow";
import { ScreenTitle } from "@/components/ScreenTitle";
import { saveRun } from "@/db/runs";
import { formatDistance, formatPace, paceSecPerKm } from "@/lib/geo";
import { mvs, vs } from "@/lib/responsive";
import { startRun, stopRun } from "@/run/run-control";
import { RunMap } from "@/run/RunMap";
import { useRunStore } from "@/run/run-store";

function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function RunScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const playCurtain = useCurtain((s) => s.play);

  const status = useRunStore((s) => s.status);
  const startedAt = useRunStore((s) => s.startedAt);
  const points = useRunStore((s) => s.points);
  const distanceM = useRunStore((s) => s.distanceM);
  const userPos = useRunStore((s) => s.userPos);

  const [now, setNow] = useState(Date.now());

  // Тік таймера лише під час пробіжки.
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  const running = status === "running";
  const elapsedMs = startedAt ? now - startedAt : 0;
  const elapsedS = Math.floor(elapsedMs / 1000);
  const pace = paceSecPerKm(distanceM, elapsedS);

  const onStart = async () => {
    const res = await startRun();
    if (!res.ok) {
      Alert.alert("Геолокація", res.error ?? "Не вдалося почати пробіжку.");
    }
  };

  const onStop = () => {
    // Завісу піднімаємо ОДРАЗУ: карта забігу лишається на екрані, поки лаймова
    // завіса йде вгору (≈0.7с) — без миготіння стандартним екраном кардіо.
    // Саму зупинку, збереження й перехід робимо вже під завісою.
    playCurtain(async () => {
      const data = await stopRun();
      if (data && data.points.length > 1 && profile) {
        // Збережена пробіжка зʼявиться в календарі (вкладка «Аналітика»).
        const id = await saveRun(profile.id, data);
        router.push(`/run-summary?id=${id}`);
      }
    });
  };

  // ── Активна пробіжка: карта на весь екран, показники — плаваючі бари ──
  if (running) {
    return (
      <View className="flex-1">
        {/* Карта-фон на всю площу (меню тим часом їде за екран) */}
        <View className="absolute inset-0 overflow-hidden">
          <RunMap points={points} withRoute />
        </View>

        {/* Живі показники — бари з напівпрозорим тлом і лаймовим контуром.
            Опускаємо нижче статус-бара/камери (safe-area top). */}
        <View
          pointerEvents="none"
          className="absolute inset-x-0 top-0 flex-row gap-2 px-3"
          style={{ paddingTop: insets.top + vs(10) }}
        >
          <StatBar label="ЧАС" value={fmtElapsed(elapsedMs)} />
          <StatBar label="ДИСТАНЦІЯ" value={formatDistance(distanceM)} />
          <StatBar label="ТЕМП" value={formatPace(pace)} />
        </View>

        {/* Стоп — плаваюча кнопка знизу (меню сховане), трохи піднята */}
        <View
          className="absolute inset-x-0 bottom-0 px-4"
          style={{ paddingBottom: insets.bottom + vs(28) }}
        >
          <Pressable
            onPress={onStop}
            className="items-center rounded-2xl bg-orange active:opacity-80"
            style={{
              paddingVertical: vs(14),
              boxShadow: "0px 6px 20px 0px rgba(0,0,0,0.45)",
            }}
          >
            <Text
              className="font-sans-strong tracking-[1px] text-on-lime"
              style={{ fontSize: mvs(15) }}
            >
              ЗАВЕРШИТИ ВІДРІЗОК
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Idle: карта-герой з тапом-стартом + компактні останні пробіжки ──
  return (
    <View className="flex-1">
      <ScreenTitle title="КАРДІО" />

      {/* Карта займає більшу частину екрана. Поверх неї — оверлей-кнопка:
          тап будь-де по мапі починає забіг. Оверлей також перехоплює
          жести, тож мапа в режимі очікування статична. Історія пробіжок —
          у календарі (вкладка «Аналітика»), як і тренування. */}
      <View
        className="mx-4 mt-2 flex-1 overflow-hidden rounded-3xl border border-border"
        style={{ marginBottom: vs(96) }}
      >
        <RunMap points={points} center={userPos} />

        <Pressable
          onPress={onStart}
          className="absolute inset-0 items-center justify-center active:opacity-90"
        >
          {/* Легкий скрим — щоб напис читався поверх будь-якого тла мапи. */}
          <View className="absolute inset-0 bg-black/30" />
          <LimeGlow radius={16}>
            <View
              className="items-center rounded-2xl bg-lime"
              style={{ paddingHorizontal: vs(28), paddingVertical: vs(14) }}
            >
              <Text
                className="font-sans-strong tracking-[1px] text-on-lime"
                style={{ fontSize: mvs(16) }}
              >
                ПОЧАТИ ВІДРІЗОК
              </Text>
            </View>
          </LimeGlow>
          <Text
            className="font-mono text-[10px] tracking-[2px] text-text"
            style={{ marginTop: vs(8) }}
          >
            ТОРКНИСЬ КАРТИ, ЩОБ ПОЧАТИ
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Плаваючий бар-показник поверх карти: напівпрозоре тло + лаймовий контур.
function StatBar({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-lime bg-black/45 py-2.5">
      <Text
        className="font-display text-text"
        style={{ fontSize: mvs(24), lineHeight: mvs(26) }}
      >
        {value}
      </Text>
      <Text className="mt-0.5 font-mono text-[9px] tracking-[2px] text-text-dim">
        {label}
      </Text>
    </View>
  );
}
