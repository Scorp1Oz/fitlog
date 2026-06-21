// Усі міграції бази даних. Кожна — крок «з версії N-1 у версію N».
// Правило: лише ДОДАВАННЯ (нові таблиці/стовпці), ніколи руйнівні зміни —
// щоб історія користувача переживала оновлення додатку.
import type { SQLiteDatabase } from "expo-sqlite";

import { translateExerciseName } from "@/exercises/exercise-names";

export type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

export const migrations: Migration[] = [
  {
    // v1 — початкова схема. Профілі закладені одразу: кожен набір даних
    // (рутини, сесії, підходи) належить конкретному profile_id.
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          display_name TEXT,
          password_hash TEXT,
          password_salt TEXT,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE exercises (
          id INTEGER PRIMARY KEY,
          name TEXT,
          name_uk TEXT,
          primary_muscle TEXT,
          equipment TEXT,
          category TEXT,
          level TEXT,
          images TEXT,
          is_custom INTEGER DEFAULT 0,
          profile_id INTEGER
        );

        CREATE TABLE routines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profile_id INTEGER NOT NULL,
          name TEXT,
          created_at INTEGER
        );

        CREATE TABLE routine_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          routine_id INTEGER NOT NULL,
          exercise_id INTEGER NOT NULL,
          position INTEGER,
          target_sets INTEGER,
          rep_low INTEGER,
          rep_high INTEGER
        );

        CREATE TABLE sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profile_id INTEGER NOT NULL,
          routine_id INTEGER,
          started_at INTEGER,
          ended_at INTEGER,
          notes TEXT
        );

        CREATE TABLE session_sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          exercise_id INTEGER NOT NULL,
          set_index INTEGER,
          weight REAL,
          reps INTEGER,
          type TEXT DEFAULT 'normal',
          completed INTEGER DEFAULT 1
        );

        CREATE INDEX idx_routines_profile ON routines(profile_id);
        CREATE INDEX idx_sessions_profile ON sessions(profile_id);
        CREATE INDEX idx_session_sets_session ON session_sets(session_id);
      `);
    },
  },

  {
    // v2 — фото профілю. Ім'я вже є (display_name), логін — username.
    version: 2,
    up: async (db) => {
      await db.execAsync("ALTER TABLE profiles ADD COLUMN avatar_uri TEXT;");
    },
  },

  {
    // v3 — програми: впорядкований розклад рутин по днях тижня. День без
    // рядка в program_days = відпочинок. Активна програма (одна) — на профілі.
    version: 3,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE programs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profile_id INTEGER NOT NULL,
          name TEXT,
          created_at INTEGER
        );

        CREATE TABLE program_days (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          program_id INTEGER NOT NULL,
          weekday INTEGER NOT NULL,   -- 0=Пн … 6=Нд
          routine_id INTEGER NOT NULL
        );

        CREATE INDEX idx_programs_profile ON programs(profile_id);
        CREATE INDEX idx_program_days_program ON program_days(program_id);

        ALTER TABLE profiles ADD COLUMN active_program_id INTEGER;
      `);
    },
  },

  {
    // v4 — український переклад назв базових вправ (name_uk). Беком для БД,
    // засіяних до появи перекладача; нові інсталяції отримують name_uk одразу
    // в seedExercises. Англійська name лишається — для перемикача мови.
    version: 4,
    up: async (db) => {
      const rows = await db.getAllAsync<{ id: number; name: string }>(
        "SELECT id, name FROM exercises WHERE name_uk IS NULL AND is_custom = 0"
      );
      for (const r of rows) {
        await db.runAsync(
          "UPDATE exercises SET name_uk = ? WHERE id = ?",
          translateExerciseName(r.name),
          r.id
        );
      }
    },
  },
];
