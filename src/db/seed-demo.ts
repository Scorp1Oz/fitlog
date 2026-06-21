// Показові плани тренувань (демо-контент) на основі двох гайдів:
// «Форма & Сила» (4 дні, повне тіло для початківиці) та «PPL+» (5 днів, split).
// Ідемпотентно: вправи додаються лише якщо їх ще немає (за name_uk),
// програми — лише якщо демо ще не засіяні. Вправи кладемо глобально
// (is_custom=0, profile_id=NULL), щоб вони з'явилися в бібліотеці.
import { getDatabase } from "./database";
import { createProgram } from "./programs";
import { createRoutine } from "./routines";

// Назва вправи (укр.) → ключ групи м'язів (як у free-exercise-db / translations).
const EXERCISE_MUSCLE: Record<string, string> = {
  "Присідання зі штангою": "quadriceps",
  "Румунська станова з гантелями": "hamstrings",
  "Зворотні випади з гантелями": "quadriceps",
  "Сідничний міст зі штангою": "glutes",
  "Відведення ноги в кабелі": "abductors",
  "Підйоми на носки стоячи": "calves",
  "Тяга верхнього блоку": "lats",
  "Тяга горизонтального блоку": "middle back",
  "Жим гантелей сидячи": "shoulders",
  "Бічні підйоми гантелей": "shoulders",
  "Підйоми на біцепс (гантелі)": "biceps",
  "Планка на передпліччях": "abdominals",
  "Жим ногами": "quadriceps",
  "Сумо-присідання з гантеллю": "glutes",
  "Згинання ніг (Leg Curl)": "hamstrings",
  "Сідничний міст на одній нозі": "glutes",
  "Зведення ніг у тренажері": "adductors",
  "Скручування на прес": "abdominals",
  "Жим гантелей лежачи похилий": "chest",
  "Кабельний кросовер": "chest",
  "Тяга гантелі в нахилі однією рукою": "lats",
  "Присідання з жимом (Thruster)": "quadriceps",
  "Bird-Dog (планка + підйом руки)": "abdominals",
  "Підйоми ніг лежачи": "abdominals",
  "Жим штанги лежачи похилий": "chest",
  "Жим гантелей лежачи": "chest",
  "Французький жим (EZ-штанга)": "triceps",
  "Кабельні розгинання на трицепс": "triceps",
  "Станова тяга": "lower back",
  "Підтягування": "lats",
  "Тяга штанги в нахилі": "middle back",
  "Підйоми штанги на біцепс": "biceps",
  "Зворотні розведення (Rear Delt Fly)": "shoulders",
  "Румунська станова на одній нозі": "hamstrings",
  "Arnold Press": "shoulders",
  "Підйоми перед собою (Front Raise)": "shoulders",
  "Віджимання на брусах": "chest",
  "Підтягування вузьким хватом": "lats",
  "Пуловер з гантеллю": "lats",
  "Молоткові підйоми (Hammer Curl)": "biceps",
  "Підйоми на біцепс на кабелі": "biceps",
};

// Рядок вправи в рутині: [назва, підходи, повт_від, повт_до].
type Item = [string, number, number, number];
type RoutineDef = { name: string; items: Item[] };
type ProgramDef = { name: string; days: { weekday: number; routine: string }[] };

const ROUTINES: RoutineDef[] = [
  // ── «Форма & Сила» (Леся) ──
  {
    name: "Низ тіла — Сідниці & Ноги",
    items: [
      ["Присідання зі штангою", 4, 10, 12],
      ["Румунська станова з гантелями", 3, 12, 12],
      ["Зворотні випади з гантелями", 3, 10, 10],
      ["Сідничний міст зі штангою", 4, 15, 15],
      ["Відведення ноги в кабелі", 3, 15, 15],
      ["Підйоми на носки стоячи", 3, 20, 20],
    ],
  },
  {
    name: "Верх тіла — Спина & Руки",
    items: [
      ["Тяга верхнього блоку", 4, 10, 12],
      ["Тяга горизонтального блоку", 3, 12, 12],
      ["Жим гантелей сидячи", 3, 12, 12],
      ["Бічні підйоми гантелей", 3, 15, 15],
      ["Підйоми на біцепс (гантелі)", 3, 12, 12],
      ["Планка на передпліччях", 3, 30, 45],
    ],
  },
  {
    name: "Низ тіла+ — Сідниці & Стегна",
    items: [
      ["Жим ногами", 4, 12, 15],
      ["Сумо-присідання з гантеллю", 3, 15, 15],
      ["Згинання ніг (Leg Curl)", 3, 15, 15],
      ["Сідничний міст на одній нозі", 3, 12, 12],
      ["Зведення ніг у тренажері", 3, 15, 15],
      ["Скручування на прес", 3, 15, 20],
    ],
  },
  {
    name: "Все тіло — Груди & Кор",
    items: [
      ["Жим гантелей лежачи похилий", 4, 12, 12],
      ["Кабельний кросовер", 3, 15, 15],
      ["Тяга гантелі в нахилі однією рукою", 3, 12, 12],
      ["Присідання з жимом (Thruster)", 3, 12, 12],
      ["Bird-Dog (планка + підйом руки)", 3, 10, 10],
      ["Підйоми ніг лежачи", 3, 15, 15],
    ],
  },

  // ── «PPL+» ──
  {
    name: "PUSH — Груди · Плечі · Трицепс",
    items: [
      ["Жим штанги лежачи похилий", 4, 6, 8],
      ["Жим гантелей лежачи", 3, 8, 10],
      ["Жим гантелей сидячи", 4, 8, 10],
      ["Бічні підйоми гантелей", 3, 12, 15],
      ["Французький жим (EZ-штанга)", 3, 10, 12],
      ["Кабельні розгинання на трицепс", 3, 12, 15],
    ],
  },
  {
    name: "PULL — Спина · Біцепс · Дельти",
    items: [
      ["Станова тяга", 4, 5, 6],
      ["Підтягування", 4, 6, 10],
      ["Тяга штанги в нахилі", 3, 8, 10],
      ["Тяга гантелі в нахилі однією рукою", 3, 10, 12],
      ["Підйоми штанги на біцепс", 3, 8, 12],
      ["Зворотні розведення (Rear Delt Fly)", 3, 15, 15],
    ],
  },
  {
    name: "LEGS — Ноги",
    items: [
      ["Присідання зі штангою", 4, 5, 8],
      ["Жим ногами", 3, 10, 12],
      ["Румунська станова на одній нозі", 3, 10, 10],
      ["Згинання ніг (Leg Curl)", 3, 12, 15],
      ["Підйоми на носки стоячи", 4, 15, 20],
    ],
  },
  {
    name: "PUSH+ — Об'єм",
    items: [
      ["Жим гантелей лежачи похилий", 4, 8, 10],
      ["Кабельний кросовер", 3, 12, 15],
      ["Arnold Press", 3, 10, 12],
      ["Підйоми перед собою (Front Raise)", 3, 12, 12],
      ["Віджимання на брусах", 3, 8, 12],
    ],
  },
  {
    name: "PULL+ — Об'єм",
    items: [
      ["Тяга горизонтального блоку", 4, 10, 12],
      ["Підтягування вузьким хватом", 3, 8, 12],
      ["Пуловер з гантеллю", 3, 12, 15],
      ["Молоткові підйоми (Hammer Curl)", 3, 10, 12],
      ["Підйоми на біцепс на кабелі", 3, 12, 15],
    ],
  },
];

const PROGRAMS: ProgramDef[] = [
  {
    name: "Форма & Сила (4 дні)",
    days: [
      { weekday: 0, routine: "Низ тіла — Сідниці & Ноги" },
      { weekday: 1, routine: "Верх тіла — Спина & Руки" },
      { weekday: 3, routine: "Низ тіла+ — Сідниці & Стегна" },
      { weekday: 4, routine: "Все тіло — Груди & Кор" },
    ],
  },
  {
    name: "PPL+ (5 днів)",
    days: [
      { weekday: 0, routine: "PUSH — Груди · Плечі · Трицепс" },
      { weekday: 1, routine: "PULL — Спина · Біцепс · Дельти" },
      { weekday: 3, routine: "LEGS — Ноги" },
      { weekday: 4, routine: "PUSH+ — Об'єм" },
      { weekday: 6, routine: "PULL+ — Об'єм" },
    ],
  },
];

/** Знайти вправу за name_uk або створити її глобально. Повертає id. */
async function ensureExercise(name: string): Promise<number> {
  const db = getDatabase();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM exercises WHERE name_uk = ? LIMIT 1",
    name
  );
  if (existing) return existing.id;

  const muscle = EXERCISE_MUSCLE[name] ?? null;
  const res = await db.runAsync(
    `INSERT INTO exercises
       (name, name_uk, primary_muscle, equipment, category, level, images, is_custom, profile_id)
     VALUES (?, ?, ?, NULL, 'strength', 'beginner', '[]', 0, NULL)`,
    name,
    name,
    muscle
  );
  return res.lastInsertRowId;
}

/**
 * Засіяти показові плани для профілю. Повертає false, якщо їх уже додано
 * (нічого не робить), true — якщо щойно створено.
 */
export async function seedDemoPlans(profileId: number): Promise<boolean> {
  const db = getDatabase();

  // Уже засіяно? (за назвами програм)
  const names = PROGRAMS.map((p) => p.name);
  const placeholders = names.map(() => "?").join(",");
  const found = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM programs WHERE profile_id = ? AND name IN (${placeholders})`,
    profileId,
    ...names
  );
  if (found) return false;

  // Рутини (з гарантованими вправами) → мапа назва→id.
  const routineId = new Map<string, number>();
  for (const def of ROUTINES) {
    const items = [];
    for (const [name, sets, low, high] of def.items) {
      items.push({
        exerciseId: await ensureExercise(name),
        targetSets: sets,
        repLow: low,
        repHigh: high,
      });
    }
    routineId.set(def.name, await createRoutine(profileId, def.name, items));
  }

  // Програми з розкладом, що посилається на щойно створені рутини.
  for (const p of PROGRAMS) {
    const days = p.days
      .map((d) => ({ weekday: d.weekday, routineId: routineId.get(d.routine)! }))
      .filter((d) => d.routineId != null);
    await createProgram(profileId, p.name, days);
  }

  return true;
}
