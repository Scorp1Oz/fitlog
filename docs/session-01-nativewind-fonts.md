# fitlog — Конспект сесії 1: NativeWind, кольори, шрифти

> Це навчальний підсумок того, що ми налаштували за першу сесію (крок 1 з плану).
> Мета файлу — щоб ти міг розібрати кожну тему в окремому чаті-репетиторі.
> У кінці є **список питань для самоперевірки** і **терміни для розбору**.

---

## 0. Що взагалі зробили (одним абзацом)

Підключили **NativeWind** — це спосіб писати стилі для React Native короткими класами (як у вебі Tailwind), замість громіздких `StyleSheet.create`. Завели **наші кольори й шрифти** з дизайн-системи як «токени», тож тепер можна писати `className="bg-bg text-lime font-display"`. Підключили три шрифти Google Fonts. Полагодили одну помилку збірки (`lightningcss`) і прибрали сміття зі стартового шаблону.

---

## 1. Що таке NativeWind і навіщо

- **React Native** за замовчуванням стилюється так:
  ```tsx
  <View style={{ flex: 1, backgroundColor: "#0D0D0D" }} />
  ```
- **NativeWind** дозволяє так:
  ```tsx
  <View className="flex-1 bg-bg" />
  ```
- Під капотом NativeWind бере **Tailwind CSS** (популярну систему класів-утиліт) і перетворює ці класи на звичайні стилі React Native під час збірки.

**Чому це добре для нас:** менше коду, всі кольори/відступи з одного джерела (дизайн-система), однакові класи на вебі й на Android.

> 🔑 Термін: **utility-first CSS** — підхід, де замість окремих стилів пишеш багато дрібних класів-«утиліт» (`flex-1`, `bg-bg`, `text-xl`).

---

## 2. Чому саме NativeWind v5 (а не стабільна v4)

Наш проєкт стоїть на свіжому стеку: **Expo SDK 56, React 19, react-native-reanimated 4**.

- Стабільна **NativeWind v4** під капотом вимагає reanimated **3** і Tailwind **3** → конфлікт із нашим стеком.
- **NativeWind v5 (preview)** зроблена саме під RN 0.81+, React 19, reanimated 4.

Тобто це був **вимушений** вибір, не вільний. «preview» = пре-реліз, ще не фінальна версія, але для нашого набору пакетів єдина сумісна.

> 🔑 Термін: **peer dependency** — пакет вимагає, щоб поруч стояла певна версія *іншого* пакета. Якщо версії не збігаються — конфлікт.

---

## 3. Файли конфігурації (що кожен робить)

Ми створили кілька файлів у корені проєкту. Розглянь кожен окремо:

| Файл | Навіщо |
|---|---|
| `global.css` | Головний файл стилів: імпорти Tailwind + **наші токени** (кольори, шрифти). |
| `metro.config.js` | Metro — це «пакувальник» коду Expo. Тут ми кажемо йому пропускати `global.css` через NativeWind. |
| `postcss.config.mjs` | PostCSS обробляє CSS для **веб-версії** через плагін Tailwind. |
| `nativewind-env.d.ts` | Каже TypeScript, що `className` — це нормальний проп (інакше підкреслював би помилку). |

**Важливо (нове у Tailwind v4):** колись кольори задавали у `tailwind.config.js`. Тепер цього файлу **немає** — усе живе прямо в `global.css` у блоці `@theme`.

> 🔑 Терміни для розбору: **Metro bundler**, **PostCSS**, **файл `.d.ts` (type declarations)**.

---

## 4. Токени: кольори і шрифти в `@theme`

У `global.css`:

```css
@theme {
  --color-bg: #0d0d0d;       /* фон */
  --color-lime: #c8f135;     /* акцент */
  /* ...решта кольорів... */

  --font-display: "BebasNeue_400Regular";   /* заголовки */
  --font-sans: "IBMPlexSans_400Regular";    /* основний текст */
  --font-mono: "IBMPlexMono_400Regular";    /* мітки, таймер */
}
```

**Як це працює:** кожен `--color-X` автоматично дає класи `bg-X`, `text-X`, `border-X`. Кожен `--font-X` дає клас `font-X`. Тобто:
- `--color-bg` → `bg-bg`, `text-bg`, `border-bg`
- `--color-lime` → `bg-lime`, `text-lime`, …
- `--font-display` → `font-display`

> 🔑 Термін: **CSS custom properties (CSS-змінні)** — це і є запис `--назва: значення`.

> 💡 Деталь про Tailwind v4: клас з'являється в зібраному CSS, **тільки якщо ти його десь використав** (це зветься **JIT** — just-in-time). Тому `bg-surface` не було у збірці, поки ми його не написали в коді — це нормально.

---

## 5. Завантаження шрифтів

Шрифти не «вмикаються» самі — їх треба завантажити при старті. Це робиться у `src/app/_layout.tsx` (кореневий файл, що обгортає всі екрани):

```tsx
import { useFonts } from "expo-font";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
// ...інші шрифти

SplashScreen.preventAutoHideAsync(); // не ховати заставку, поки шрифти не готові

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BebasNeue_400Regular,
    // ...
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync(); // готово — ховаємо заставку
  }, [loaded, error]);

  if (!loaded && !error) return null; // поки вантажиться — порожньо

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Ключова ідея:** імена в об'єкті `useFonts({ ... })` (напр. `BebasNeue_400Regular`) стають значеннями `fontFamily`. А ми вписали ці ж імена в `--font-*` токени — тому клас `font-display` і знаходить потрібний шрифт.

> 🔑 Терміни для розбору: **React hook** (`useFonts`, `useEffect`), **splash screen**, чому `return null` поки шрифти вантажаться.

---

## 6. Помилка, яку ми полагодили (`lightningcss`)

При запуску на Android вискочило:
```
Error: failed to deserialize; expected an object-like struct named Specifier, found ()
```

**Причина:** бібліотека `react-native-css` (нативний компілятор стилів) несумісна з новою версією `lightningcss 1.32.0` — там змінилась внутрішня структура.

**Фікс:** у `package.json` ми «закріпили» стару сумісну версію:
```json
"overrides": {
  "lightningcss": "1.30.1"
}
```

**Урок:** веб-збірка цю помилку **не ловила** (там інший шлях обробки CSS). Тому стилі завжди треба перевіряти **і на нативі** (Android), а не лише у браузері.

> 🔑 Термін: **`overrides` у package.json** — спосіб примусово задати версію залежної бібліотеки, навіть якщо її тягне інший пакет.

---

## 7. Прибирання

- Видалили теку `example/` — це був дефолтний демо-шаблон create-expo-app, який лише засмічував перевірку типів.
- Прибрали білий заголовок навігації (`headerShown: false`).
- Зробили іконки статус-бару світлими (`StatusBar style="light"`) для темного фону.
- Колір splash-заставки змінили з синього на наш `#0D0D0D`.

---

## 8. Підсумок: які файли зачепили

**Створено:** `global.css`, `metro.config.js`, `postcss.config.mjs`, `nativewind-env.d.ts`
**Змінено:** `src/app/_layout.tsx`, `src/app/index.tsx` (тимчасовий тест-екран), `package.json`, `app.json`, `tsconfig.json` (останній NativeWind дописав сам)
**Видалено:** теку `example/`

---

## 9. ✅ Питання для самоперевірки (постав їх чату-репетитору)

1. Чим `className="bg-bg"` відрізняється від `style={{ backgroundColor: ... }}` — що відбувається під капотом?
2. Чому в Tailwind v4 немає `tailwind.config.js`, і де тепер задають кольори?
3. Що таке Metro bundler і навіщо йому `metro.config.js`?
4. Як пов'язані `--font-display`, `useFonts` і реальний файл шрифту `.ttf`?
5. Навіщо `SplashScreen.preventAutoHideAsync()` і `return null`, поки шрифти вантажаться?
6. Що таке `overrides` у package.json і яку проблему вони вирішили?
7. Чому помилку `lightningcss` було видно на Android, але не на вебі?
8. Що таке JIT у Tailwind і чому деякі класи «не з'являлись», поки їх не використаєш?

## 10. 📚 Терміни для глибшого розбору

`utility-first CSS` · `peer dependency` · `Metro bundler` · `PostCSS` ·
`TypeScript .d.ts` · `CSS custom properties` · `JIT compilation` ·
`React hook (useEffect, useState)` · `splash screen` · `package.json overrides` ·
`Expo Router (Stack, file-based routing)`
