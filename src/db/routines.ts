// Рутини (шаблони тренувань): CRUD над routines + routine_exercises.
// Таблиці створені в міграції v1. Похідні дані (к-сть вправ) — запитами.
import { getDatabase } from "./database";

// Один рядок рутини у списку (з похідною к-стю вправ).
export type RoutineSummary = {
  id: number;
  name: string | null;
  created_at: number | null;
  exercise_count: number;
};

// Вправа всередині рутини (шаблон, без ваги — лише цілі).
export type RoutineExercise = {
  exercise_id: number;
  name: string;
  position: number;
  target_sets: number | null;
  rep_low: number | null;
  rep_high: number | null;
};

// Вхідні дані вправи при збереженні (з форми редагування).
export type RoutineExerciseInput = {
  exerciseId: number;
  targetSets: number;
  repLow: number;
  repHigh: number;
};

/** Усі рутини профілю з к-стю вправ, найновіші зверху. */
export async function listRoutines(
  profileId: number
): Promise<RoutineSummary[]> {
  const db = getDatabase();
  return db.getAllAsync<RoutineSummary>(
    `SELECT r.id, r.name, r.created_at,
            COUNT(re.id) AS exercise_count
       FROM routines r
       LEFT JOIN routine_exercises re ON re.routine_id = r.id
      WHERE r.profile_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC`,
    profileId
  );
}

/** Рутина + її вправи (назви укр., якщо є), упорядковані за position. */
export async function getRoutineDetail(routineId: number): Promise<{
  routine: { id: number; name: string | null } | null;
  exercises: RoutineExercise[];
}> {
  const db = getDatabase();
  const routine = await db.getFirstAsync<{ id: number; name: string | null }>(
    "SELECT id, name FROM routines WHERE id = ?",
    routineId
  );

  const exercises = await db.getAllAsync<RoutineExercise>(
    `SELECT re.exercise_id, re.position, re.target_sets, re.rep_low, re.rep_high,
            COALESCE(NULLIF(e.name_uk, ''), e.name) AS name
       FROM routine_exercises re
       LEFT JOIN exercises e ON e.id = re.exercise_id
      WHERE re.routine_id = ?
      ORDER BY re.position`,
    routineId
  );

  return { routine, exercises };
}

// Вставка рядків вправ рутини (спільна для create/update, у транзакції).
async function insertRoutineExercises(
  db: ReturnType<typeof getDatabase>,
  routineId: number,
  exercises: RoutineExerciseInput[]
): Promise<void> {
  let pos = 0;
  for (const ex of exercises) {
    await db.runAsync(
      `INSERT INTO routine_exercises
         (routine_id, exercise_id, position, target_sets, rep_low, rep_high)
       VALUES (?, ?, ?, ?, ?, ?)`,
      routineId,
      ex.exerciseId,
      pos++,
      ex.targetSets,
      ex.repLow,
      ex.repHigh
    );
  }
}

/** Створити рутину з вправами. Повертає id нової рутини. */
export async function createRoutine(
  profileId: number,
  name: string,
  exercises: RoutineExerciseInput[]
): Promise<number> {
  const db = getDatabase();
  let routineId = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      "INSERT INTO routines (profile_id, name, created_at) VALUES (?, ?, ?)",
      profileId,
      name,
      Date.now()
    );
    routineId = res.lastInsertRowId;
    await insertRoutineExercises(db, routineId, exercises);
  });
  return routineId;
}

/** Оновити назву й повністю переписати вправи рутини. */
export async function updateRoutine(
  routineId: number,
  name: string,
  exercises: RoutineExerciseInput[]
): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "UPDATE routines SET name = ? WHERE id = ?",
      name,
      routineId
    );
    await db.runAsync(
      "DELETE FROM routine_exercises WHERE routine_id = ?",
      routineId
    );
    await insertRoutineExercises(db, routineId, exercises);
  });
}

/** Видалити рутину разом з її вправами. */
export async function deleteRoutine(routineId: number): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM routine_exercises WHERE routine_id = ?",
      routineId
    );
    await db.runAsync("DELETE FROM routines WHERE id = ?", routineId);
  });
}
