// Запам'ятовуємо, який профіль зараз активний, між запусками додатку.
// Зберігаємо лише id у SecureStore (у браузері — localStorage, як і для замка).
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACTIVE_PROFILE_KEY = "active_profile_id";

async function read(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
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

async function remove(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/** id активного профілю або null. */
export async function getActiveProfileId(): Promise<number | null> {
  const value = await read(ACTIVE_PROFILE_KEY);
  if (value === null) return null;
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function setActiveProfileId(id: number): Promise<void> {
  await write(ACTIVE_PROFILE_KEY, String(id));
}

export async function clearActiveProfileId(): Promise<void> {
  await remove(ACTIVE_PROFILE_KEY);
}
