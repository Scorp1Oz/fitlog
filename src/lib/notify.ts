// Локальні сповіщення для таймера відпочинку. Потрібні, щоб користувач почув
// сигнал «відпочинок завершено», навіть коли застосунок згорнутий — у цьому
// стані JS-таймер (setInterval) призупиняється системою, а заплановане
// сповіщення спрацьовує силами ОС (звук + вібрація).
import * as Notifications from "expo-notifications";

const CHANNEL = "rest";

// id поточного запланованого сповіщення — щоб скасувати при зміні/пропуску.
let pendingId: string | null = null;
let inited = false;

/**
 * Один раз на старті: обробник показу, Android-канал і запит дозволу.
 * Обробник спрацьовує ЛИШЕ коли застосунок на передньому плані — там сигнал
 * дає сам beep, тож банер/звук сповіщення глушимо, аби не дублювати.
 */
export async function initNotifications(): Promise<void> {
  if (inited) return;
  inited = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  try {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Відпочинок",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 150, 250],
      enableVibrate: true,
    });
    await Notifications.requestPermissionsAsync();
  } catch {
    // без дозволу/каналу просто не буде фонового сигналу — не критично
  }
}

/** Запланувати сигнал на момент закінчення відпочинку (мс epoch). */
export async function scheduleRestDone(endsAt: number): Promise<void> {
  await cancelRestDone();
  // Минулий час або майже зараз — планувати нічого.
  if (endsAt <= Date.now() + 500) return;
  try {
    pendingId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Відпочинок завершено",
        body: "Час до наступного підходу 💪",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: endsAt,
        channelId: CHANNEL,
      },
    });
  } catch {
    pendingId = null;
  }
}

/** Скасувати запланований сигнал (пропуск/скидання/вихід). */
export async function cancelRestDone(): Promise<void> {
  if (!pendingId) return;
  const id = pendingId;
  pendingId = null;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
