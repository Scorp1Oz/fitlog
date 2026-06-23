// Збереження та читання пробіжок (runs + run_points).
import { paceSecPerKm } from "@/lib/geo";

import { getDatabase } from "./database";

export type RunPoint = { lat: number; lng: number; t: number };

export type RunSummary = {
  id: number;
  started_at: number;
  ended_at: number | null;
  distance_m: number;
  duration_s: number;
  avg_pace: number; // секунд на км
};

/**
 * Зберегти завершену пробіжку з її треком в одній транзакції.
 * avg_pace рахуємо тут із дистанції й часу. Повертає id пробіжки.
 */
export async function saveRun(
  profileId: number,
  run: {
    startedAt: number;
    endedAt: number;
    distanceM: number;
    durationS: number;
    points: RunPoint[];
  }
): Promise<number> {
  const db = getDatabase();
  let runId = 0;
  const pace = paceSecPerKm(run.distanceM, run.durationS);

  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO runs (profile_id, started_at, ended_at, distance_m, duration_s, avg_pace)
       VALUES (?, ?, ?, ?, ?, ?)`,
      profileId,
      run.startedAt,
      run.endedAt,
      run.distanceM,
      run.durationS,
      pace
    );
    runId = res.lastInsertRowId;

    let seq = 0;
    for (const p of run.points) {
      await db.runAsync(
        "INSERT INTO run_points (run_id, seq, lat, lng, t) VALUES (?, ?, ?, ?, ?)",
        runId,
        seq++,
        p.lat,
        p.lng,
        p.t
      );
    }
  });

  return runId;
}

/** Усі пробіжки профілю, найновіші зверху. */
export async function listRuns(profileId: number): Promise<RunSummary[]> {
  const db = getDatabase();
  return db.getAllAsync<RunSummary>(
    `SELECT id, started_at, ended_at, distance_m, duration_s, avg_pace
       FROM runs
      WHERE profile_id = ?
      ORDER BY started_at DESC`,
    profileId
  );
}

/** Мітки часу початку пробіжок у проміжку [from, to) — для підсвітки днів. */
export async function listRunDates(
  profileId: number,
  from: number,
  to: number
): Promise<number[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ started_at: number }>(
    "SELECT started_at FROM runs WHERE profile_id = ? AND started_at >= ? AND started_at < ? ORDER BY started_at",
    profileId,
    from,
    to
  );
  return rows.map((r) => r.started_at);
}

/** Пробіжки конкретного дня (для списку в календарі). */
export async function listRunsByDay(
  profileId: number,
  dayStart: number,
  dayEnd: number
): Promise<RunSummary[]> {
  const db = getDatabase();
  return db.getAllAsync<RunSummary>(
    `SELECT id, started_at, ended_at, distance_m, duration_s, avg_pace
       FROM runs
      WHERE profile_id = ? AND started_at >= ? AND started_at < ?
      ORDER BY started_at`,
    profileId,
    dayStart,
    dayEnd
  );
}

/** Пробіжка з її треком (для деталей/карти). */
export async function getRunDetail(runId: number): Promise<{
  run: RunSummary | null;
  points: RunPoint[];
}> {
  const db = getDatabase();
  const run = await db.getFirstAsync<RunSummary>(
    `SELECT id, started_at, ended_at, distance_m, duration_s, avg_pace
       FROM runs WHERE id = ?`,
    runId
  );
  const points = await db.getAllAsync<RunPoint>(
    "SELECT lat, lng, t FROM run_points WHERE run_id = ? ORDER BY seq",
    runId
  );
  return { run, points };
}

/** Видалити пробіжку разом із треком. */
export async function deleteRun(runId: number): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM run_points WHERE run_id = ?", runId);
    await db.runAsync("DELETE FROM runs WHERE id = ?", runId);
  });
}
