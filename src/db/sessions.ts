// Збереження завершеної сесії тренування у БД (sessions + session_sets).
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
  exercises: WorkoutExercise[]
): Promise<number> {
  const db = getDatabase();
  let sessionId = 0;

  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      "INSERT INTO sessions (profile_id, started_at, ended_at) VALUES (?, ?, ?)",
      profileId,
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
