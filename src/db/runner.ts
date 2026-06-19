// Міграційний раннер на PRAGMA user_version.
// user_version — ціле число, вбудоване в сам файл БД. Новий файл = 0.
// Ми тримаємо в ньому «до якої версії схеми вже докотились».
import type { SQLiteDatabase } from "expo-sqlite";

import { migrations } from "./migrations";

export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let currentVersion = row?.user_version ?? 0;

  // Беремо лише ще не застосовані міграції, у порядку зростання версій.
  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    // Кожну міграцію — атомарно: або вся схема + нова версія, або нічого.
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      // PRAGMA не приймає параметри (?), тож підставляємо НАШЕ ціле напряму
      // (не користувацький ввід — ін'єкція неможлива).
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    currentVersion = migration.version;
  }

  return currentVersion;
}
