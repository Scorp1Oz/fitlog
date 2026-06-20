// Українські назви місяців і формати дат/часу для історії тренувань.

// Називний відмінок — для заголовка календаря («ЧЕРВЕНЬ 2026»).
export const MONTHS_NOM = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

// Родовий відмінок — для дати («21 червня 2026»).
export const MONTHS_GEN = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// 'YYYY-MM-DD' за локальним часом (для передачі дня в параметрах маршруту).
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Парсинг 'YYYY-MM-DD' у локальну дату (північ того дня).
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// «21 червня 2026»
export function formatLongDate(ts: number | Date): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

// «21:30»
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// «1 год 5 хв» / «45 хв» / «—» якщо невідомо.
export function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return "—";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h} год ${m} хв`;
  return `${m} хв`;
}
