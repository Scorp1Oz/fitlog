// Репозиторій профілів — уся робота з таблицею `profiles`.
// Повертає «чисті» об'єкти Profile (без хеша/солі).
import { generateSalt, hashPassword } from "@/auth/password";

import { getDatabase } from "./database";

export type Profile = {
  id: number;
  username: string; // логін (незмінний)
  display_name: string | null; // редаговане ім'я
  avatar_uri: string | null; // локальний URI фото або null
  created_at: number;
};

// Внутрішній рядок таблиці (з полями, які не віддаємо назовні).
type ProfileRow = Profile & {
  password_hash: string;
  password_salt: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    avatar_uri: row.avatar_uri,
    created_at: row.created_at,
  };
}

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
    avatar_uri: null,
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

  return toProfile(row);
}

/** Знайти профіль за id (для відновлення активного профілю при старті). */
export async function getProfileById(id: number): Promise<Profile | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ProfileRow>(
    "SELECT * FROM profiles WHERE id = ?",
    id
  );
  return row ? toProfile(row) : null;
}

/** Оновити ім'я та/або фото. Передавай лише те, що змінюєш. Повертає свіжий профіль. */
export async function updateProfile(
  id: number,
  fields: { displayName?: string | null; avatarUri?: string | null }
): Promise<Profile | null> {
  const db = getDatabase();
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (fields.displayName !== undefined) {
    sets.push("display_name = ?");
    values.push(fields.displayName);
  }
  if (fields.avatarUri !== undefined) {
    sets.push("avatar_uri = ?");
    values.push(fields.avatarUri);
  }

  if (sets.length > 0) {
    await db.runAsync(
      `UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`,
      ...values,
      id
    );
  }

  return getProfileById(id);
}
