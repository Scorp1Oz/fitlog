# fitlog — Конспект сесії 2: Lock Screen (екран-замок)

> Навчальний підсумок кроку 2: біометричний вхід у додаток.
> У кінці — **питання для самоперевірки** і **терміни для розбору**.

---

## 0. Що зробили (одним абзацом)

Додали **екран-замок**: при запуску, якщо замок увімкнено, додаток просить
**біометрію** (відбиток/обличчя) перед тим, як пустити всередину. Прапорець
«замок увімкнено» зберігається в **захищеному сховищі** (`expo-secure-store`).
Стан «заблоковано/розблоковано» тримаємо в **React Context**, щоб різні екрани
бачили його однаково. У браузері (де біометрії немає) замок не блокує — це
передбачено.

---

## 1. Дійові особи (файли)

| Файл | Роль | Тип |
|---|---|---|
| `src/lock/lock-storage.ts` | Уся «брудна» робота: SecureStore, біометрія. **Без UI.** | логіка |
| `src/lock/LockContext.tsx` | Спільний стан + хук `useLock()`. | стан |
| `src/lock/LockScreen.tsx` | Власне екран із кнопкою «Розблокувати». | UI |
| `src/lock/LockGate.tsx` | «Ворота»: показати замок чи додаток. | UI |
| `src/app/_layout.tsx` | Обгортає весь додаток у Provider + Gate. | каркас |
| `src/app/index.tsx` | Тимчасові кнопки для тесту (перемикач, «Заблокувати зараз»). | тест |

> 💡 **Чому розділили логіку й UI?** `lock-storage.ts` не знає нічого про
> екрани — лише «увімкнено/ні», «є біометрія/ні», «автентифікуй». Так логіку
> легко читати, тестувати й змінювати, не чіпаючи вигляд.

---

## 2. Дві бібліотеки Expo

### expo-secure-store — захищене сховище
Зберігає маленькі рядки в зашифрованому сховищі ОС (Keychain на iOS,
Keystore на Android). Ми тримаємо там лише прапорець `"lock_enabled"`.

```ts
await SecureStore.setItemAsync("lock_enabled", "true");
const v = await SecureStore.getItemAsync("lock_enabled"); // "true" | "false" | null
```

⚠️ **SecureStore не працює у браузері.** Тому в `lock-storage.ts` є перевірка
`Platform.OS === "web"` — там підміняємо його на `localStorage`. Це інша
платформа з іншими можливостями — типова ситуація в React Native.

### expo-local-authentication — біометрія
```ts
await LocalAuthentication.hasHardwareAsync();   // чи є сканер
await LocalAuthentication.isEnrolledAsync();     // чи налаштовані відбиток/обличчя
await LocalAuthentication.authenticateAsync({    // показати системний запит
  promptMessage: "Розблокуй fitlog",
});
// → { success: true } або { success: false, error, warning }
```

**Можна автентифікуватись** лише коли `hasHardware && isEnrolled`. Якщо ні
(браузер, або телефон без налаштованого захисту) — замок не блокує.

> 🔑 Терміни: **Keychain / Keystore**, **biometric enrollment**, `Platform.OS`.

---

## 3. React Context — спільний стан

**Проблема:** стан «заблоковано» потрібен і `LockGate`, і `LockScreen`, і
головному екрану. Передавати його пропсами через усі рівні незручно.

**Рішення:** Context — «загальна шина», з якої будь-який вкладений компонент
дістає дані хуком.

```tsx
// 1) Створюємо контекст
const LockContext = createContext<LockValue | null>(null);

// 2) Provider тримає стан і роздає його дітям
export function LockProvider({ children }) {
  const [status, setStatus] = useState("checking");
  // ...unlock, lock, setEnabled...
  return <LockContext.Provider value={{ status, ... }}>{children}</LockContext.Provider>;
}

// 3) Хук для зручного доступу
export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error("useLock поза <LockProvider>");
  return ctx;
}
```

Будь-де всередині Provider:
```tsx
const { status, unlock } = useLock();
```

> 💡 **Context vs Zustand.** Context — вбудований у React, добре для невеликого
> спільного стану. Zustand (крок 3) зручніший для складнішого рантайм-стану
> (активна сесія, таймер) і менше ререндерить. Спершу варто розуміти Context.

> 🔑 Терміни: **createContext**, **Provider**, **useContext**, **custom hook**,
> **props drilling** (проблема, яку Context вирішує).

---

## 4. Потік «воріт» (як усе складається)

```
Запуск додатку
      │
  LockProvider (useEffect при старті):
      ├─ читає прапорець lock_enabled
      ├─ перевіряє canUseBiometrics()
      └─ status = (увімкнено І є біометрія) ? "locked" : "unlocked"
      │
  LockGate дивиться на status:
      ├─ "checking"  → чорний фон (мить)
      ├─ "locked"    → <LockScreen/>  ──► успіх authenticate() → status="unlocked"
      └─ "unlocked"  → сам додаток (<Stack/>)
```

`LockScreen` при відкритті **сам** викликає біометрію (`useEffect`), а кнопка
«Розблокувати» дозволяє повторити, якщо скасували.

> 🔑 Терміни: **state machine** (checking/locked/unlocked), **useEffect при
> монтуванні** (порожній масив залежностей `[]`).

---

## 5. Як перевірити

**Веб** (`npx expo start --web`):
1. Перемкни «Замок при вході» → ON.
2. Натисни «ЗАБЛОКУВАТИ ЗАРАЗ» → з'явиться екран-замок.
3. Біометрії в браузері нема → кнопка «УВІЙТИ» просто впускає.

**Android (Expo Go)** — справжня перевірка:
1. На телефоні має бути налаштований відбиток/обличчя.
2. Те саме: ON → «ЗАБЛОКУВАТИ ЗАРАЗ» → з'явиться системний запит відбитка.
3. Приклади хто є хто: успіх → впускає; скасування → лишаємось, кнопка повтору.

---

## 6. Що свідомо лишили на потім

- **Авто-блокування при згортанні** додатку (через `AppState`) — щоб після
  паузи знову просило біометрію. Додамо пізніше.
- **Справжній екран Налаштувань** (вкладка «Ще») — зараз перемикач тимчасово
  живе на головному екрані.

---

## 7. Які файли зачепили

**Створено:** `src/lock/lock-storage.ts`, `src/lock/LockContext.tsx`,
`src/lock/LockScreen.tsx`, `src/lock/LockGate.tsx`
**Змінено:** `src/app/_layout.tsx` (Provider + Gate), `src/app/index.tsx`
(тимчасові контролі), `app.json` (плагін secure-store додався сам),
`package.json` (2 нові пакети)

---

## 8. ✅ Питання для самоперевірки

1. Навіщо ми відокремили `lock-storage.ts` від компонентів-екранів?
2. Чому `lock_enabled` зберігаємо в SecureStore, а не у звичайній змінній?
3. Що станеться у браузері, якщо НЕ додати перевірку `Platform.OS === "web"`?
4. Яка різниця між `hasHardwareAsync()` та `isEnrolledAsync()`?
5. Яку проблему вирішує React Context? Як її ще можна було б вирішити (гірше)?
6. Навіщо хук `useLock()` кидає помилку, якщо він поза `<LockProvider>`?
7. Чому `LockGate` має три стани, а не два (locked/unlocked)?
8. Чому в браузері ми впускаємо без біометрії, а не блокуємо назавжди?

## 9. 📚 Терміни для глибшого розбору

`React Context` · `Provider` · `useContext` · `custom hook` · `props drilling` ·
`useEffect (mount)` · `state machine` · `Platform.OS` · `Keychain / Keystore` ·
`biometric enrollment` · `async/await` · `Promise.all` · `expo-secure-store` ·
`expo-local-authentication`
