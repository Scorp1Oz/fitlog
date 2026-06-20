// Хешування пароля. Ніколи не зберігаємо пароль у відкритому вигляді —
// лише випадкову сіль і SHA-256(сіль + пароль).
//
// Чесне застереження: SHA-256 із сіллю — це базовий рівень. Для справжнього
// серверного захисту використовують повільні алгоритми (bcrypt/argon2). Поки
// дані лише локально (і SecureStore вже шифрує сховище), цього достатньо;
// при переході на Firebase автентифікацію робитиме сервер.
import * as Crypto from "expo-crypto";

/** Випадкова сіль (16 байтів) у hex-рядку. */
export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 від (сіль + пароль) у hex. Та сама сіль завжди дає той самий хеш. */
export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + password,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}
