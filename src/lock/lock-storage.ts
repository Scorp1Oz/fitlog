// Чиста логіка замка — без UI.
// Тут лише: читання/запис прапорця «замок увімкнено» та робота з біометрією.
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const LOCK_ENABLED_KEY = "lock_enabled";

// SecureStore не працює у браузері. Тому на вебі підміняємо його localStorage —
// це не «захищене» сховище, але для прапорця-перемикача під час розробки достатньо.
async function readFlag(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function writeFlag(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

/** Чи увімкнено замок. За замовчуванням — ні (свіжий додаток не блокуємо). */
export async function isLockEnabled(): Promise<boolean> {
  return (await readFlag(LOCK_ENABLED_KEY)) === "true";
}

/** Зберегти стан перемикача «замок». */
export async function setLockEnabled(enabled: boolean): Promise<void> {
  await writeFlag(LOCK_ENABLED_KEY, enabled ? "true" : "false");
}

/**
 * Чи можна автентифікуватись біометрією:
 * є сканер (hasHardware) І зареєстровані відбиток/обличчя (isEnrolled).
 * У браузері/без захисту поверне false — тоді замок не блокуватиме.
 */
export async function canUseBiometrics(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

/** Показати системний запит біометрії. Повертає true, якщо автентифікація успішна. */
export async function authenticate(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Розблокуй fitlog",
      cancelLabel: "Скасувати",
    });
    return result.success;
  } catch {
    return false;
  }
}
