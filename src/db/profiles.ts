// Репозиторій профілів — уся робота з таблицею `profiles`.
// Повертає «чисті» об'єкти Profile (без хеша/солі).
import { generateSalt, hashPassword } from "@/auth/password";

import { getDatabase } from "./database";

export type Profile = {
  id: number;
  username: string;
  display_name: string | null;
  created_at: number;
};

// Внутрішній рядок таблиці (з полями, які не віддаємо назовні).
type ProfileRow = Profile & {
  password_hash: string;
  password_salt: string;
};

/** Чи існує профіль із таким іменем (для дружнього повідомлення при реєстрації). */
export async function usernameExists(username: string): Promise<boolean> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM profiles WHERE username = ?",
    username
  );
  return row !== null;
}

/** Створити профіль із хешованим паролем. Повертає створений профіль. */
export async function createProfile(
  username: string,
  password: string
): Promise<Profile> {
  const db = getDatabase();
  const salt = await generateSalt();
  const hash = await hashPassword(password, salt);
  const createdAt = Date.now();

  const result = await db.runAsync(
    "INSERT INTO profiles (username, display_name, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)",
    username,
    username,
    hash,
    salt,
    createdAt
  );

  return {
    id: result.lastInsertRowId,
    username,
    display_name: username,
    created_at: createdAt,
  };
}

/** Перевірити логін+пароль. Повертає профіль або null, якщо не збігається. */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<Profile | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ProfileRow>(
    "SELECT * FROM profiles WHERE username = ?",
    username
  );
  if (!row) return null;

  const hash = await hashPassword(password, row.password_salt);
  if (hash !== row.password_hash) return null;

  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    created_at: row.created_at,
  };
}

/** Знайти профіль за id (для відновлення активного профілю при старті). */
export async function getProfileById(id: number): Promise<Profile | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ProfileRow>(
    "SELECT * FROM profiles WHERE id = ?",
    id
  );
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    created_at: row.created_at,
  };
}
