// Програми: розклад рутин по днях тижня (weekday 0=Пн … 6=Нд).
// День без рядка в program_days = відпочинок. Активна програма (одна на
// профіль) зберігається в profiles.active_program_id.
import { getDatabase } from "./database";

export type ProgramSummary = {
  id: number;
  name: string | null;
  created_at: number | null;
  day_count: number; // скільки днів тижня зайнято тренуваннями
};

// Один тренувальний день програми з назвою прив'язаної рутини.
export type ProgramDay = {
  weekday: number; // 0=Пн … 6=Нд
  routine_id: number;
  routine_name: string;
};

// Вхідні дані дня при збереженні.
export type ProgramDayInput = { weekday: number; routineId: number };

/** Усі програми профілю з к-стю тренувальних днів, найновіші зверху. */
export async function listPrograms(
  profileId: number
): Promise<ProgramSummary[]> {
  const db = getDatabase();
  return db.getAllAsync<ProgramSummary>(
    `SELECT p.id, p.name, p.created_at,
            COUNT(pd.id) AS day_count
       FROM programs p
       LEFT JOIN program_days pd ON pd.program_id = p.id
      WHERE p.profile_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
    profileId
  );
}

/** Програма + її дні (з назвами рутин), упорядковані за днем тижня. */
export async function getProgramDetail(programId: number): Promise<{
  program: { id: number; name: string | null } | null;
  days: ProgramDay[];
}> {
  const db = getDatabase();
  const program = await db.getFirstAsync<{ id: number; name: string | null }>(
    "SELECT id, name FROM programs WHERE id = ?",
    programId
  );

  const days = await db.getAllAsync<ProgramDay>(
    `SELECT pd.weekday, pd.routine_id,
            COALESCE(r.name, 'Без назви') AS routine_name
       FROM program_days pd
       LEFT JOIN routines r ON r.id = pd.routine_id
      WHERE pd.program_id = ?
      ORDER BY pd.weekday`,
    programId
  );

  return { program, days };
}

async function insertProgramDays(
  db: ReturnType<typeof getDatabase>,
  programId: number,
  days: ProgramDayInput[]
): Promise<void> {
  for (const d of days) {
    await db.runAsync(
      "INSERT INTO program_days (program_id, weekday, routine_id) VALUES (?, ?, ?)",
      programId,
      d.weekday,
      d.routineId
    );
  }
}

/** Створити програму з розкладом. Повертає id нової програми. */
export async function createProgram(
  profileId: number,
  name: string,
  days: ProgramDayInput[]
): Promise<number> {
  const db = getDatabase();
  let programId = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      "INSERT INTO programs (profile_id, name, created_at) VALUES (?, ?, ?)",
      profileId,
      name,
      Date.now()
    );
    programId = res.lastInsertRowId;
    await insertProgramDays(db, programId, days);
  });
  return programId;
}

/** Оновити назву й повністю переписати розклад програми. */
export async function updateProgram(
  programId: number,
  name: string,
  days: ProgramDayInput[]
): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "UPDATE programs SET name = ? WHERE id = ?",
      name,
      programId
    );
    await db.runAsync(
      "DELETE FROM program_days WHERE program_id = ?",
      programId
    );
    await insertProgramDays(db, programId, days);
  });
}

/** Видалити програму з розкладом. Якщо була активною — скидаємо активність. */
export async function deleteProgram(programId: number): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM program_days WHERE program_id = ?",
      programId
    );
    await db.runAsync("DELETE FROM programs WHERE id = ?", programId);
    await db.runAsync(
      "UPDATE profiles SET active_program_id = NULL WHERE active_program_id = ?",
      programId
    );
  });
}

/** Зробити програму активною (або скинути активну, передавши null). */
export async function setActiveProgram(
  profileId: number,
  programId: number | null
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    "UPDATE profiles SET active_program_id = ? WHERE id = ?",
    programId,
    profileId
  );
}

/** id активної програми профілю (null — не вибрана). */
export async function getActiveProgramId(
  profileId: number
): Promise<number | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ active_program_id: number | null }>(
    "SELECT active_program_id FROM profiles WHERE id = ?",
    profileId
  );
  return row?.active_program_id ?? null;
}

/** Активна програма з розкладом (для блоку на екрані Тренування). null — немає. */
export async function getActiveProgram(profileId: number): Promise<{
  id: number;
  name: string | null;
  days: ProgramDay[];
} | null> {
  const activeId = await getActiveProgramId(profileId);
  if (!activeId) return null;
  const { program, days } = await getProgramDetail(activeId);
  if (!program) return null;
  return { id: program.id, name: program.name, days };
}
