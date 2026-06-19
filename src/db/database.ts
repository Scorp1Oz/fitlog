// Відкриття бази (один екземпляр на весь додаток) і її ініціалізація.
import * as SQLite from "expo-sqlite";

import { runMigrations } from "./runner";

const DB_NAME = "fitlog.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Відкриває БД (якщо ще не відкрита), вмикає потрібні PRAGMA й докочує міграції.
 * Безпечно викликати кілька разів — другий виклик поверне той самий екземпляр.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // WAL — швидший і надійніший режим запису; foreign_keys — вмикаємо перевірку
  // зовнішніх ключів (за замовчуванням у SQLite вона вимкнена).
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const version = await runMigrations(db);

  if (__DEV__) {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    console.log(
      `[db] ready, version = ${version}, tables: ${tables
        .map((t) => t.name)
        .join(", ")}`
    );
  }

  dbInstance = db;
  return db;
}

/** Доступ до вже відкритої БД поза React-деревом. Кидає помилку, якщо ще не init. */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error("initDatabase() ще не викликали");
  }
  return dbInstance;
}
