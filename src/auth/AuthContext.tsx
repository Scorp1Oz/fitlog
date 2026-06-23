// Спільний стан автентифікації: який профіль активний + register/login/logout.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  createProfile,
  getProfileById,
  updateProfile as updateProfileInDb,
  usernameExists,
  verifyCredentials,
  type Profile,
} from "@/db/profiles";

import {
  clearActiveProfileId,
  getActiveProfileId,
  setActiveProfileId,
} from "./active-profile";

// loading — ще відновлюємо активний профіль; далі — увійшов / ні.
type AuthStatus = "loading" | "signedOut" | "signedIn";

// Результат дій: { ok } або { ok:false, error } з дружнім текстом для UI.
type AuthResult = { ok: true } | { ok: false; error: string };

type AuthValue = {
  status: AuthStatus;
  profile: Profile | null;
  // persist = «Залишитись у системі»: чи памʼятати вхід між запусками.
  register: (
    username: string,
    password: string,
    persist: boolean
  ) => Promise<AuthResult>;
  login: (
    username: string,
    password: string,
    persist: boolean
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  // Оновити ім'я/фото активного профілю (пише в БД і оновлює всюди).
  updateProfile: (fields: {
    displayName?: string | null;
    avatarUri?: string | null;
    birthdate?: string | null;
    demoHidden?: boolean;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);

  // При старті відновлюємо активний профіль із SecureStore.
  useEffect(() => {
    (async () => {
      const id = await getActiveProfileId();
      const restored = id !== null ? await getProfileById(id) : null;
      if (restored) {
        setProfile(restored);
        setStatus("signedIn");
      } else {
        setStatus("signedOut");
      }
    })();
  }, []);

  // Запамʼятати активний профіль між запусками — лише якщо persist=true.
  // Інакше прибираємо збережений id (на наступний запуск — екран входу).
  const persistActive = async (id: number, persist: boolean) => {
    if (persist) {
      await setActiveProfileId(id);
    } else {
      await clearActiveProfileId();
    }
  };

  const register = async (
    username: string,
    password: string,
    persist: boolean
  ): Promise<AuthResult> => {
    const name = username.trim();
    if (name.length < 3) return { ok: false, error: "Логін: мінімум 3 символи" };
    if (password.length < 4) return { ok: false, error: "Пароль: мінімум 4 символи" };
    if (await usernameExists(name)) {
      return { ok: false, error: "Такий логін уже зайнятий" };
    }

    const created = await createProfile(name, password);
    await persistActive(created.id, persist);
    setProfile(created);
    setStatus("signedIn");
    return { ok: true };
  };

  const login = async (
    username: string,
    password: string,
    persist: boolean
  ): Promise<AuthResult> => {
    const found = await verifyCredentials(username.trim(), password);
    if (!found) return { ok: false, error: "Невірне ім'я або пароль" };

    await persistActive(found.id, persist);
    setProfile(found);
    setStatus("signedIn");
    return { ok: true };
  };

  const logout = async (): Promise<void> => {
    await clearActiveProfileId();
    setProfile(null);
    setStatus("signedOut");
  };

  const updateProfile = async (fields: {
    displayName?: string | null;
    avatarUri?: string | null;
    birthdate?: string | null;
    demoHidden?: boolean;
  }): Promise<void> => {
    if (!profile) return;
    const updated = await updateProfileInDb(profile.id, fields);
    if (updated) setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{ status, profile, register, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth має використовуватись усередині <AuthProvider>");
  }
  return ctx;
}
