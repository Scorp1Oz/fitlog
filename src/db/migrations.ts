// Усі міграції бази даних. Кожна — крок «з версії N-1 у версію N».
// Правило: лише ДОДАВАННЯ (нові таблиці/стовпці), ніколи руйнівні зміни —
// щоб історія користувача переживала оновлення додатку.
import type { SQLiteDatabase } from "expo-sqlite";

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
];
