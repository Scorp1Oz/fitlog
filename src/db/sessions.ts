// Збереження завершеної сесії тренування у БД (sessions + session_sets).
import { bestE1rm, epley1rm } from "@/lib/strength";
import type { WorkoutExercise } from "@/workout/workout-store";

import { getDatabase } from "./database";

/**
 * Записує сесію та її виконані підходи в одній транзакції.
 * Зберігаємо лише підходи з completed=true і коректними числами.
 * Повертає id створеної сесії.
 */
export async function saveSession(
  profileId: number,
  startedAt: number,
  exercises: WorkoutExercise[],
  routineId: number | null = null
): Promise<number> {
  const db = getDatabase();
  let sessionId = 0;

  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      "INSERT INTO sessions (profile_id, routine_id, started_at, ended_at) VALUES (?, ?, ?, ?)",
      profileId,
      routineId,
      startedAt,
      Date.now()
    );
    sessionId = res.lastInsertRowId;

    for (const ex of exercises) {
      let setIndex = 0;
      for (const s of ex.sets) {
        if (!s.completed) continue;
        const weight = parseFloat(s.weight.replace(",", ".")) || 0;
        const reps = parseInt(s.reps, 10) || 0;
        await db.runAsync(
          "INSERT INTO session_sets (session_id, exercise_id, set_index, weight, reps, completed) VALUES (?, ?, ?, ?, ?, 1)",
          sessionId,
          ex.exerciseId,
          setIndex++,
          weight,
          reps
        );
      }
    }
  });

  return sessionId;
}

/** Скільки виконаних підходів у наборі вправ (для підсумку перед збереженням). */
export function countCompletedSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.completed).length,
    0
  );
}

// ───────────────────────── Історія тренувань ─────────────────────────

export type SessionSummary = {
  id: number;
  started_at: number;
  ended_at: number | null;
  exercise_count: number;
  set_count: number;
  volume: number; // сумарний тоннаж: Σ(вага × повтори)
  muscles: string | null; // англ. ключі м'язів через кому (для назви)
};

export type SessionExercise = {
  exercise_id: number;
  name: string;
  sets: { set_index: number; weight: number; reps: number }[];
};

/** Мітки часу початку всіх сесій у проміжку [from, to) — для підсвітки днів. */
export async function listWorkoutDates(
  profileId: number,
  from: number,
  to: number
): Promise<number[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ started_at: number }>(
    "SELECT started_at FROM sessions WHERE profile_id = ? AND started_at >= ? AND started_at < ? ORDER BY started_at",
    profileId,
    from,
    to
  );
  return rows.map((r) => r.started_at);
}

/**
 * Мітки часу всіх активностей (тренування + пробіжки) у проміжку [from, to) —
 * для обчислення стріку днів поспіль. Обʼєднуємо обидві таблиці.
 */
export async function listActivityDates(
  profileId: number,
  from: number,
  to: number
): Promise<number[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ started_at: number }>(
    `SELECT started_at FROM sessions WHERE profile_id = ? AND started_at >= ? AND started_at < ?
     UNION ALL
     SELECT started_at FROM runs WHERE profile_id = ? AND started_at >= ? AND started_at < ?`,
    profileId,
    from,
    to,
    profileId,
    from,
    to
  );
  return rows.map((r) => r.started_at);
}

/** Сесії конкретного дня з підсумком (для списку тренувань дня). */
export async function listSessionsByDay(
  profileId: number,
  dayStart: number,
  dayEnd: number
): Promise<SessionSummary[]> {
  const db = getDatabase();
  return db.getAllAsync<SessionSummary>(
    `SELECT s.id, s.started_at, s.ended_at,
            COUNT(DISTINCT ss.exercise_id) AS exercise_count,
            COUNT(ss.id) AS set_count,
            COALESCE(SUM(ss.weight * ss.reps), 0) AS volume,
            GROUP_CONCAT(DISTINCT e.primary_muscle) AS muscles
       FROM sessions s
       LEFT JOIN session_sets ss ON ss.session_id = s.id
       LEFT JOIN exercises e ON e.id = ss.exercise_id
      WHERE s.profile_id = ? AND s.started_at >= ? AND s.started_at < ?
      GROUP BY s.id
      ORDER BY s.started_at`,
    profileId,
    dayStart,
    dayEnd
  );
}

/**
 * Підходи цієї вправи з НАЙОСТАННІШОЇ збереженої сесії, де вона була —
 * щоб показати «минулого разу» під час логування. null, якщо ще не робив.
 */
export async function getLastExerciseSets(
  profileId: number,
  exerciseId: number
): Promise<{ date: number; sets: { weight: number; reps: number }[] } | null> {
  const db = getDatabase();
  const last = await db.getFirstAsync<{ id: number; started_at: number }>(
    `SELECT s.id, s.started_at
       FROM sessions s
       JOIN session_sets ss ON ss.session_id = s.id AND ss.exercise_id = ?
      WHERE s.profile_id = ?
      ORDER BY s.started_at DESC
      LIMIT 1`,
    exerciseId,
    profileId
  );
  if (!last) return null;

  const sets = await db.getAllAsync<{ weight: number; reps: number }>(
    `SELECT weight, reps FROM session_sets
      WHERE session_id = ? AND exercise_id = ?
      ORDER BY set_index`,
    last.id,
    exerciseId
  );
  return { date: last.started_at, sets };
}

/** Видалити сесію разом із її підходами. */
export async function deleteSession(sessionId: number): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM session_sets WHERE session_id = ?",
      sessionId
    );
    await db.runAsync("DELETE FROM sessions WHERE id = ?", sessionId);
  });
}

/** Повністю переписати підходи сесії (редагування минулого тренування). */
export async function replaceSessionSets(
  sessionId: number,
  exercises: { exerciseId: number; sets: { weight: string; reps: string }[] }[]
): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM session_sets WHERE session_id = ?",
      sessionId
    );
    for (const ex of exercises) {
      let i = 0;
      for (const s of ex.sets) {
        const w = parseFloat(s.weight.replace(",", ".")) || 0;
        const r = parseInt(s.reps, 10) || 0;
        if (r <= 0) continue; // без повторів — не підхід; вага може бути 0
        await db.runAsync(
          "INSERT INTO session_sets (session_id, exercise_id, set_index, weight, reps, completed) VALUES (?, ?, ?, ?, ?, 1)",
          sessionId,
          ex.exerciseId,
          i++,
          w,
          r
        );
      }
    }
  });
}

// ───────────────────────── Рекорди / прогрес ─────────────────────────

export type ExerciseRecord = {
  bestE1rm: number;
  bestE1rmDate: number | null;
  bestWeight: number;
  bestWeightDate: number | null;
};

/** Рекорди по вправі (оцінка 1ПМ і макс. вага) з усієї історії профілю. */
export async function getExerciseRecord(
  profileId: number,
  exerciseId: number
): Promise<ExerciseRecord | null> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{
    weight: number;
    reps: number;
    started_at: number;
  }>(
    `SELECT ss.weight, ss.reps, s.started_at
       FROM session_sets ss
       JOIN sessions s ON s.id = ss.session_id
      WHERE s.profile_id = ? AND ss.exercise_id = ? AND ss.weight > 0 AND ss.reps > 0`,
    profileId,
    exerciseId
  );
  if (rows.length === 0) return null;

  const rec: ExerciseRecord = {
    bestE1rm: 0,
    bestE1rmDate: null,
    bestWeight: 0,
    bestWeightDate: null,
  };
  for (const r of rows) {
    const e = epley1rm(r.weight, r.reps);
    if (e > rec.bestE1rm) {
      rec.bestE1rm = e;
      rec.bestE1rmDate = r.started_at;
    }
    if (r.weight > rec.bestWeight) {
      rec.bestWeight = r.weight;
      rec.bestWeightDate = r.started_at;
    }
  }
  return rec;
}

export type SessionRecord = {
  exercise_id: number;
  name: string;
  weight: number; // підхід із найкращим 1ПМ цієї сесії
  reps: number;
  e1rm: number; // найкращий 1ПМ цієї сесії
  prior_e1rm: number; // найкращий 1ПМ до цієї сесії (0 — вперше)
  is_pr: boolean;
};

/** Які рекорди побито в конкретній сесії (для екрана завершення). */
export async function getSessionRecords(
  sessionId: number
): Promise<SessionRecord[]> {
  const db = getDatabase();
  const head = await db.getFirstAsync<{
    profile_id: number;
    started_at: number;
  }>("SELECT profile_id, started_at FROM sessions WHERE id = ?", sessionId);
  if (!head) return [];

  const rows = await db.getAllAsync<{
    exercise_id: number;
    weight: number;
    reps: number;
    name: string | null;
  }>(
    `SELECT ss.exercise_id, ss.weight, ss.reps,
            COALESCE(NULLIF(e.name_uk, ''), e.name) AS name
       FROM session_sets ss
       LEFT JOIN exercises e ON e.id = ss.exercise_id
      WHERE ss.session_id = ? AND ss.weight > 0 AND ss.reps > 0`,
    sessionId
  );

  // Найкращий підхід (за 1ПМ) у цій сесії — по кожній вправі.
  const best = new Map<number, SessionRecord>();
  for (const r of rows) {
    const e = epley1rm(r.weight, r.reps);
    const cur = best.get(r.exercise_id);
    if (!cur || e > cur.e1rm) {
      best.set(r.exercise_id, {
        exercise_id: r.exercise_id,
        name: r.name ?? "Вправа",
        weight: r.weight,
        reps: r.reps,
        e1rm: e,
        prior_e1rm: 0,
        is_pr: false,
      });
    }
  }

  // Порівнюємо з історією ДО цієї сесії.
  const records = [...best.values()];
  for (const rec of records) {
    const prior = await db.getAllAsync<{ weight: number; reps: number }>(
      `SELECT ss.weight, ss.reps
         FROM session_sets ss
         JOIN sessions s ON s.id = ss.session_id
        WHERE s.profile_id = ? AND ss.exercise_id = ?
          AND s.started_at < ? AND ss.weight > 0 AND ss.reps > 0`,
      head.profile_id,
      rec.exercise_id,
      head.started_at
    );
    rec.prior_e1rm = bestE1rm(prior);
    rec.is_pr = rec.e1rm > rec.prior_e1rm;
  }

  return records;
}

/** Прогрес оцінки 1ПМ по сесіях (для графіка деталей вправи). */
export async function getExerciseProgress(
  profileId: number,
  exerciseId: number
): Promise<{ date: number; e1rm: number }[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{
    started_at: number;
    weight: number;
    reps: number;
  }>(
    `SELECT s.started_at, ss.weight, ss.reps
       FROM session_sets ss
       JOIN sessions s ON s.id = ss.session_id
      WHERE s.profile_id = ? AND ss.exercise_id = ? AND ss.weight > 0 AND ss.reps > 0
      ORDER BY s.started_at`,
    profileId,
    exerciseId
  );

  // Найкращий 1ПМ кожної сесії.
  const bySession = new Map<number, number>();
  for (const r of rows) {
    const e = epley1rm(r.weight, r.reps);
    const cur = bySession.get(r.started_at) ?? 0;
    if (e > cur) bySession.set(r.started_at, e);
  }
  return [...bySession.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([date, e1rm]) => ({ date, e1rm }));
}

/** Деталі сесії: вправи зі своїми підходами (назви — укр., якщо є). */
export async function getSessionDetail(sessionId: number): Promise<{
  session: SessionSummary | null;
  exercises: SessionExercise[];
}> {
  const db = getDatabase();
  const session = await db.getFirstAsync<SessionSummary>(
    `SELECT s.id, s.started_at, s.ended_at,
            COUNT(DISTINCT ss.exercise_id) AS exercise_count,
            COUNT(ss.id) AS set_count,
            COALESCE(SUM(ss.weight * ss.reps), 0) AS volume
       FROM sessions s
       LEFT JOIN session_sets ss ON ss.session_id = s.id
      WHERE s.id = ?
      GROUP BY s.id`,
    sessionId
  );

  const rows = await db.getAllAsync<{
    exercise_id: number;
    set_index: number;
    weight: number;
    reps: number;
    name: string | null;
  }>(
    `SELECT ss.exercise_id, ss.set_index, ss.weight, ss.reps,
            COALESCE(NULLIF(e.name_uk, ''), e.name) AS name
       FROM session_sets ss
       LEFT JOIN exercises e ON e.id = ss.exercise_id
      WHERE ss.session_id = ?
      ORDER BY ss.exercise_id, ss.set_index`,
    sessionId
  );

  // Групуємо підходи за вправою, зберігаючи порядок появи.
  const byExercise = new Map<number, SessionExercise>();
  for (const r of rows) {
    let ex = byExercise.get(r.exercise_id);
    if (!ex) {
      ex = { exercise_id: r.exercise_id, name: r.name ?? "Вправа", sets: [] };
      byExercise.set(r.exercise_id, ex);
    }
    ex.sets.push({ set_index: r.set_index, weight: r.weight, reps: r.reps });
  }

  return { session, exercises: [...byExercise.values()] };
}
