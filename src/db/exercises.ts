import type { SQLiteDatabase } from "expo-sqlite";

import { getDatabase } from "./database";

// Картинки не вшиваємо — тягнемо за URL (expo-image кешує).
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

type RawExercise = {
  name: string;
  primaryMuscles: string[];
  equipment: string | null;
  category: string | null;
  level: string | null;
  images: string[];
};

export type ExerciseListItem = {
  id: number;
  name: string;
  name_uk: string | null;
  primary_muscle: string | null;
  equipment: string | null;
  preview: string | null; // перша картинка
};

/**
 * Засів вправ із вшитого JSON. Ідемпотентний: якщо таблиця вже непорожня —
 * нічого не робить. require у тілі — щоб ~1МБ JSON не висів у пам'яті після
 * першого запуску.
 */
export async function seedExercises(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM exercises"
  );
  if ((row?.c ?? 0) > 0) return;

  const data = require("../../assets/exercises.json") as RawExercise[];

  await db.withTransactionAsync(async () => {
    const stmt = await db.prepareAsync(
      "INSERT INTO exercises (name, name_uk, primary_muscle, equipment, category, level, images, is_custom) VALUES (?, NULL, ?, ?, ?, ?, ?, 0)"
    );
    try {
      for (const e of data) {
        const images = JSON.stringify(
          (e.images ?? []).map((path) => IMAGE_BASE + path)
        );
        await stmt.executeAsync(
          e.name,
          e.primaryMuscles?.[0] ?? null,
          e.equipment || null,
          e.category ?? null,
          e.level ?? null,
          images
        );
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });

  if (__DEV__) console.log(`[db] seeded ${data.length} exercises`);
}

/** Список вправ із пошуком і фільтром по групі м'язів. */
export async function listExercises(
  opts: { search?: string; muscle?: string | null } = {}
): Promise<ExerciseListItem[]> {
  const db = getDatabase();
  const where: string[] = [];
  const params: string[] = [];

  if (opts.search?.trim()) {
    where.push("(name LIKE ? OR IFNULL(name_uk, '') LIKE ?)");
    const like = `%${opts.search.trim()}%`;
    params.push(like, like);
  }
  if (opts.muscle) {
    where.push("primary_muscle = ?");
    params.push(opts.muscle);
  }

  const sql = `SELECT id, name, name_uk, primary_muscle, equipment, images
               FROM exercises
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY name`;
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    name_uk: string | null;
    primary_muscle: string | null;
    equipment: string | null;
    images: string | null;
  }>(sql, ...params);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    name_uk: r.name_uk,
    primary_muscle: r.primary_muscle,
    equipment: r.equipment,
    preview: r.images ? (JSON.parse(r.images)[0] ?? null) : null,
  }));
}

/** Створити власну вправу (is_custom=1). Повертає id. */
export async function createCustomExercise(
  profileId: number,
  data: { name: string; muscle: string | null; imageUri: string | null }
): Promise<number> {
  const db = getDatabase();
  const images = JSON.stringify(data.imageUri ? [data.imageUri] : []);
  const res = await db.runAsync(
    `INSERT INTO exercises
       (name, name_uk, primary_muscle, equipment, category, level, images, is_custom, profile_id)
     VALUES (?, ?, ?, NULL, NULL, NULL, ?, 1, ?)`,
    data.name,
    data.name, // name_uk = введене (зазвичай українською)
    data.muscle,
    images,
    profileId
  );
  return res.lastInsertRowId;
}

/** Групи м'язів, що реально присутні (для чипів-фільтрів). */
export async function listMuscleGroups(): Promise<string[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ m: string }>(
    "SELECT DISTINCT primary_muscle AS m FROM exercises WHERE primary_muscle IS NOT NULL ORDER BY m"
  );
  return rows.map((r) => r.m);
}
