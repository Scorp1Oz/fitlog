// Локальні нагадування-мотиватори:
//   • стрік — увечері того дня, коли «треба тренуватись», але ще не закрито
//     (планується щоразу, коли застосунок у фокусі: refreshStreakReminder);
//   • легкі щоденні нагадування про тренування та пробіжку у випадковий час
//     із випадковим текстом (scheduleDailyNudges — раз на старті застосунку).
//
// Стабільні identifier'и дають «заміну» розкладу: повторне планування з тим
// самим id перезаписує попереднє, тож нагадування не множаться.
import * as Notifications from "expo-notifications";

const CHANNEL = "reminders";

// Два вікна нагадування про стрік: раннє «час тренуватись» і пізнє з
// пропозицією домашнього тренування (бо ввечері в зал уже мало хто піде).
const STREAK_EARLY_ID = "fitlog-streak-early";
const STREAK_LATE_ID = "fitlog-streak-late";
const NUDGE_WORKOUT_ID = "fitlog-nudge-workout";
const NUDGE_RUN_ID = "fitlog-nudge-run";

// Раннє вікно (16:00–17:59): ще встигаєш у зал/на пробіжку.
const STREAK_EARLY_MSGS = [
  "Сьогодні ще немає тренування — не дай вогнику згаснути!",
  "Твій стрік чекає. Встигаєш потренуватись 🔥",
  "Час рухатись: закрий день, поки ще світло.",
  "Не рви ланцюжок — заплануй тренування на сьогодні.",
];

// Пізнє вікно (19:00–20:59): пропонуємо коротке домашнє тренування.
// TODO: коли додамо домашні тренування — вести нотифікацію одразу до них.
const STREAK_LATE_MSGS = [
  "Ще не пізно! Коротке домашнє тренування врятує стрік 🏠",
  "У зал уже не варто — зроби кілька вправ удома й закрий день.",
  "15 хвилин удома > згаслий вогник. Підтримай стрік 🔥",
  "Без обладнання, прямо вдома — встигни закрити день.",
];

const WORKOUT_MSGS = [
  "Маленьке тренування сьогодні — великий результат завтра 💪",
  "Час навантажити м'язи. Навіть коротко — це прогрес.",
  "Гантелі сумують. Зроби кілька підходів!",
  "Сильніший за вчора — почни тренування.",
];

const RUN_MSGS = [
  "Гарна погода для пробіжки 🏃 Виходь на кілька кілометрів.",
  "Кардіо очищує голову. Як щодо легкого забігу?",
  "Навіть 2 км — це краще, ніж диван.",
  "Кросівки на тебе чекають. Час на пробіжку!",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

let channelReady = false;
async function ensureChannel(): Promise<void> {
  if (channelReady) return;
  channelReady = true;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Нагадування",
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: true,
    });
  } catch {
    // без каналу нагадування просто не з'являться — не критично
  }
}

// Epoch (мс) сьогодні о hh:mm.
function todayAt(hour: number, minute: number): number {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

// Запланувати одноразове нагадування про стрік на сьогодні о at (epoch мс).
// Якщо час уже минув — нічого не ставимо.
async function scheduleStreakAt(
  id: string,
  title: string,
  body: string,
  at: number
): Promise<void> {
  if (at <= Date.now() + 60_000) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: "default" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: CHANNEL,
      },
    });
  } catch {
    // планування не вдалось — ігноруємо
  }
}

/**
 * Перепланувати нагадування про стрік на сьогодні (два вікна):
 *   • 16:00–17:59 — «час тренуватись»;
 *   • 19:00–20:59 — пропозиція домашнього тренування, якщо ще не закрито.
 * @param pending true — день «треба закрити», ще немає активності.
 * Якщо false — обидва нагадування знімаються.
 */
export async function refreshStreakReminder(pending: boolean): Promise<void> {
  await ensureChannel();
  // Знімаємо попередні (зокрема якщо стрік уже закрито сьогодні).
  for (const id of [STREAK_EARLY_ID, STREAK_LATE_ID]) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // нема чого скасовувати
    }
  }
  if (!pending) return;

  await scheduleStreakAt(
    STREAK_EARLY_ID,
    "Не загуби вогник 🔥",
    pick(STREAK_EARLY_MSGS),
    todayAt(16 + randInt(2), randInt(60)) // 16:00–17:59
  );
  await scheduleStreakAt(
    STREAK_LATE_ID,
    "Стрік під загрозою 🏠",
    pick(STREAK_LATE_MSGS),
    todayAt(19 + randInt(2), randInt(60)) // 19:00–20:59
  );
}

// Щоденне нагадування у випадковий час із денного вікна (9:00–20:59).
async function scheduleDaily(
  id: string,
  title: string,
  body: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: "default" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9 + randInt(12),
        minute: randInt(60),
        channelId: CHANNEL,
      },
    });
  } catch {
    // планування не вдалось — ігноруємо
  }
}

/**
 * Легкі щоденні нагадування про тренування та пробіжку. Час і текст
 * перевипадковлюються при кожному виклику (на старті застосунку).
 */
export async function scheduleDailyNudges(): Promise<void> {
  await ensureChannel();
  await scheduleDaily(
    NUDGE_WORKOUT_ID,
    "Час потренуватись 💪",
    pick(WORKOUT_MSGS)
  );
  await scheduleDaily(NUDGE_RUN_ID, "Як щодо пробіжки? 🏃", pick(RUN_MSGS));
}
