import type { SQLiteDatabase } from "expo-sqlite";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Text, View } from "react-native";

import { initDatabase } from "./database";

const DbContext = createContext<SQLiteDatabase | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase().then(setDb).catch(setError);
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Text className="text-center font-mono text-xs text-orange">
          Помилка БД: {error.message}
        </Text>
      </View>
    );
  }

  // Поки БД готується — чорний фон (екран-заставка ще видимий до завантаження шрифтів).
  if (!db) {
    return <View className="flex-1 bg-bg" />;
  }

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

/** Доступ до БД усередині React-дерева. */
export function useDatabase(): SQLiteDatabase {
  const ctx = useContext(DbContext);
  if (!ctx) {
    throw new Error("useDatabase має використовуватись усередині <DbProvider>");
  }
  return ctx;
}
