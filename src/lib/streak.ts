// Логіка «стріку» — днів поспіль із виконаним планом (вогник, як у Duolingo).
//
// Два режими:
//   • НЕМАЄ активної програми — стрік тримається на будь-якій активності
//     (вільне тренування АБО пробіжка). День без активності рве стрік.
//   • Є активна програма — у пріоритеті розклад: дні відпочинку (де програма
//     не призначила тренування) НЕ рвуть стрік, а тренувальні дні треба
//     «закрити» будь-якою активністю. Сьогодні ще не закрите — стрік живий до
//     півночі (день не скінчився).
import { toDateKey } from "./date";

const DAY_MS = 86_400_000;

// День тижня з понеділка: 0=Пн … 6=Нд.
function weekdayMon(d: Date): number {
  return (d.getDay() + 6) % 7;
}

// Статус дня для календаря стріку.
export type DayMark =
  | "done" // була активність → вогник
  | "rest" // день відпочинку за розкладом → нейтрально, стрік не рветься
  | "missed" // тренувальний день у минулому без активності → пропущено
  | "today" // сьогодні, ще не закрите
  | "none"; // (без програми) минулий день без активності — порожньо/пропуск

/**
 * Стрік: скільки днів поспіль виконано план, рахуючи від сьогодні назад.
 * @param activityDays множина ключів днів (toDateKey) з активністю.
 * @param trainingWeekdays дні тижня з тренуваннями активної програми
 *        (0=Пн…6=Нд) або null/[] якщо програми немає.
 */
export function computeStreak(
  activityDays: Set<string>,
  trainingWeekdays: number[] | null
): number {
  const training = new Set(trainingWeekdays ?? []);
  const hasProgram = training.size > 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  let first = true; // перший крок — сьогодні (день ще не скінчився)

  // Обмеження кроків — запобіжник від нескінченного циклу.
  for (let i = 0; i < 1000; i++) {
    const key = toDateKey(cursor);
    const active = activityDays.has(key);
    const isTraining = hasProgram ? training.has(weekdayMon(cursor)) : true;

    if (active) {
      streak++; // активність завжди зараховує день
    } else if (isTraining) {
      // Потрібен, але не закритий день.
      if (first) {
        // Сьогодні ще не закрите — не рвемо, але й не рахуємо.
      } else {
        break; // пропущений тренувальний день — стрік обірвано
      }
    }
    // else: день відпочинку без активності — нейтрально, йдемо далі.

    first = false;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }

  return streak;
}

/**
 * Чи «живий» зараз стрік (для підсвітки вогника). True, якщо стрік > 0.
 */
export function isStreakAlive(
  activityDays: Set<string>,
  trainingWeekdays: number[] | null
): boolean {
  return computeStreak(activityDays, trainingWeekdays) > 0;
}

/**
 * Статус конкретного дня для календаря стріку.
 * @param date день, що класифікуємо.
 * @param activityDays множина ключів днів з активністю.
 * @param trainingWeekdays розклад програми (0=Пн…6=Нд) або null.
 */
export function classifyDay(
  date: Date,
  activityDays: Set<string>,
  trainingWeekdays: number[] | null
): DayMark {
  const training = new Set(trainingWeekdays ?? []);
  const hasProgram = training.size > 0;

  const key = toDateKey(date);
  if (activityDays.has(key)) return "done";

  const todayKey = toDateKey(new Date());
  if (key === todayKey) return "today";

  // Майбутні дні трактуємо як «сьогодні» (ще попереду) — без позначки пропуску.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (date.getTime() > startOfToday.getTime()) return "today";

  if (hasProgram) {
    return training.has(weekdayMon(date)) ? "missed" : "rest";
  }
  return "none";
}
