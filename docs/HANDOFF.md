# fitlog — передача контексту (для нового чату)

> Прочитай цей файл першим. Він описує стан проєкту, рішення й домовленості,
> щоб не перечитувати всю історію. Деталі коду — у відповідних файлах.
> Актуально станом на: рутини + програми + ведений runner + переклад назв
> вправ + показові плани (схема БД v4).

## Що це
Особистий **офлайн-трекер силових тренувань** для Android (Expo / React Native +
TypeScript). Дані лише на телефоні (SQLite), без сервера. Водночас —
портфоліо-проєкт, тож **дизайн-полиск важливий** (градієнти, анімації, деталі).

## Хто користувач / як працювати
- Українська мова спілкування; інтерфейс українською.
- Користувач — початківець у JS/React Native, хоче **розуміти кроки**. Рухатись
  маленькими перевіреними інкрементами.
- **Спершу показати план/що зміниться, потім міняти** (правило з CLAUDE.md).
- **Читати точні версійні docs Expo SDK 56** перед кодом (AGENTS.md):
  https://docs.expo.dev/versions/v56.0.0/
- Ключі API НЕ зашивати в код (лише через проксі-бекенд у майбутньому).
- Комітити **лише коли просить**. Гілка — `master` (так у цьому репо). Підпис
  коміту: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Веб не підтримуємо (нативні модулі) — не згадувати «у вебі не побачиш».

## Технологічний стек
- Expo SDK 56, React 19, RN 0.85, expo-router (vendored react-navigation =
  «standard-navigation»), typed routes увімкнено.
- **NativeWind v5 + Tailwind v4**: кольорові/шрифтові токени в `global.css`
  (`@theme`), НЕ в tailwind.config.js. Дублюються імперативно в
  `src/theme/colors.ts` (для SVG/іконок, яким потрібен рядок-колір).
- SQLite (`expo-sqlite`, async API) + власний міграційний раннер на
  `PRAGMA user_version`.
- Стан: **Zustand** (активна сесія, пікер, налаштування таймера, завіса,
  діалоги). Контексти: Auth, Lock, Db.
- Навігація вкладок: **react-native-pager-view** (свайп), не expo-router/ui Tabs.
- Анімації: **react-native-reanimated** (+ worklets).
- Інше: expo-image, expo-image-picker, expo-file-system (новий File/Paths),
  expo-secure-store, expo-local-authentication, expo-crypto, expo-blur,
  react-native-svg, expo-audio (біп таймера), @expo/vector-icons
  (MaterialCommunityIcons).
- `lightningcss` запінено на `1.30.1` в `package.json overrides`.

## Дизайн-система (токени в global.css)
bg `#0D0D0D`, surface `#161616`, surface-2 `#1E1E1E`, border `#222`,
lime `#C8F135` (акцент/CTA), orange `#FF4D1C` (деструктив), text `#E8E8E8`,
text-muted `#888`, text-dim `#555`, on-lime `#0D0D0D`.
Шрифти: `font-display` Bebas Neue (заголовки/цифри), `font-sans` /
`font-sans-strong` IBM Plex Sans, `font-mono` IBM Plex Mono (мітки/таймер).

## Що вже зроблено
- Auth (реєстрація/логін на `profiles`, хеш пароля, мультипрофіль, «залишитись
  у системі», біометрія після реєстрації), Lock Screen, біометричний замок.
- Навігація: пейджер зі свайпом (Головна · Тренування · Аналітика · Біг),
  плаваючий таб-бар, постійний ProfileHeader, фірмові лаймові SVG-градієнти фону.
- Профіль: модалка-перегляд (тап по шапці) — **показує активну програму й
  сьогоднішній день**; редагування (ім'я + аватар) у Налаштуваннях.
- Єдиний заголовок екранів пейджера `ScreenTitle` (лаймова плашка + mono-кікер +
  Bebas `text-4xl`), однаковий на всіх вкладках.
- Бібліотека вправ: 873 вправи (free-exercise-db, `assets/exercises.json`),
  українська таксономія, пошук/фільтр, **створення власних вправ** (фото +
  категорії), екран деталей вправи.
- **Український переклад назв вправ** (гібрид: ручний словник + токенний рушій,
  `src/exercises/exercise-names.ts`). Заповнює `name_uk`; англ. `name` лишається
  для майбутнього перемикача мови. Часті/базові — якісно, «екзотичний хвіст»
  (стретчі/стронгмен) поки англ. (fallback), доповнюється поступово.
- **Логування тренування** (вільне): підходи (вага×повтори), авто-виконання за
  повторами (вага опційна = власна вага), кнопки ±5кг/±1, **таймер відпочинку**
  (постійний зверху, mute+біп, меню з колесом-пікером і стандартним часом),
  збереження в БД.
- **Завіса** (лаймова анімація) на завершенні → екран підсумку.
- **Історія**: календар-місяць в Аналітиці (лаймові дні), екран дня (список
  сесій, видалення), деталі сесії (перегляд + режим редагування: дод/ред/видал
  вправ і підходів). Кнопки «Аналіз»/«Тіло» в Аналітиці — поки заглушки.
- **Прогресія (Фаза 2)**: оцінка 1ПМ (Еплі), персональні рекорди, виявлення PR
  на фініші, SVG-графік прогресу 1ПМ, «минулі числа» при логуванні.
- **Рутини (Фаза 3)**: список/створення/редагування/видалення; рутина = набір
  вправ із цілями (підходи × діапазон повторів). «Почати за рутиною» →
  **ведений runner** `routine-run` (одна вправа на екран, прогрес «2/5»,
  навігація Назад/Далі, спільний таймер відпочинку, без додавання вправ).
- **Програми (Фаза 3)**: програма = розклад рутин по днях тижня (Пн–Нд), одна
  активна на профіль. Екран «Тренування» показує тижневий розклад активної
  програми; сьогоднішній день натискний і запускає тренування.
- **Показові плани** (`src/db/seed-demo.ts`, кнопка на екрані Програм):
  ідемпотентно засіває дві демо-програми («Форма & Сила 4 дні», «PPL+ 5 днів»)
  з рутинами й потрібними вправами.
- Темні діалоги підтвердження (`ConfirmDialog`) замість нативного `Alert`.

## Карта коду
```
src/app/                 маршрути expo-router
  (tabs)/index.tsx       хост-пейджер (ScreenBackground + ProfileHeader + PagerView + FloatingTabBar)
  workout-session.tsx    активне тренування (логування, таймер, завіса)
  workout-summary.tsx    екран завершення (підсумок + PR)
  exercises.tsx          бібліотека (пошук, фільтр, "+" нова, режим pick=1)
  exercise-new.tsx       створення власної вправи
  exercise-detail.tsx    деталі вправи + рекорди + графік
  routines.tsx           список рутин
  routine-detail.tsx     перегляд рутини + старт + ред/видал
  routine-edit.tsx       створення/редагування рутини (вправи, цілі)
  routine-run.tsx        ВЕДЕНИЙ runner виконання рутини (одна вправа/екран)
  programs.tsx           список програм (+ кнопка «Показові плани»)
  program-detail.tsx     розклад тижня + «зробити активною» + ред/видал
  program-edit.tsx       створення/редагування програми (рутина на день)
  day.tsx                тренування обраного дня (видалення)
  session.tsx            деталі/редагування сесії
  profile.tsx settings.tsx _layout.tsx
src/screens/             сторінки пейджера: Home/Workout/Analytics/Run
src/workout/             workout-store (mode free|routine), rest-settings, RestBar, RestMenu
src/db/                  database, runner, migrations, profiles, exercises, sessions,
                         routines, programs, seed-demo, DbProvider
src/exercises/           translations (таксономія), exercise-names (переклад назв),
                         picker (спільний вибір вправи)
src/components/          FloatingTabBar, ProfileHeader, ScreenBackground, StackHeader,
                         ScreenTitle, MonthCalendar, E1rmChart, CurtainOverlay, ConfirmDialog
src/lib/                 date (формати, дні тижня), strength (1ПМ, formatSet, formatTarget)
src/theme/               colors, useTheme
assets/exercises.json    база вправ;  assets/beep.wav  звук таймера
```

## БД (схема v4)
`profiles(id, username, display_name, avatar_uri, password_hash, password_salt, created_at, active_program_id)`
`exercises(id, name, name_uk, primary_muscle, equipment, category, level, images, is_custom, profile_id)`
`routines(id, profile_id, name, created_at)`
`routine_exercises(id, routine_id, exercise_id, position, target_sets, rep_low, rep_high)`
`programs(id, profile_id, name, created_at)`
`program_days(id, program_id, weekday, routine_id)`  — weekday 0=Пн…6=Нд; немає рядка = відпочинок
`sessions(id, profile_id, routine_id, started_at, ended_at, notes)`  — routine_id пишеться при старті за рутиною
`session_sets(id, session_id, exercise_id, set_index, weight, reps, type, completed)`
Міграції: v1 базова схема, v2 `avatar_uri`, **v3** programs/program_days +
`active_program_id`, **v4** беком `name_uk` для базових вправ (нові інсталяції
дістають переклад одразу в `seedExercises`).
Рекорди/прогрес/1ПМ — **похідні** запитами (без окремих таблиць). Картинки
вправ — за URL (CDN), expo-image кешує; власні — локальний URI в `images` JSON.

## Важливі граблі / рішення (НЕ наступати знову)
- **typed routes**: `.expo/types/router.d.ts` регенерує лише `expo start` (dev
  server), не `expo export`. Після нового маршруту коротко запустити dev server,
  потім `tsc`.
- **react-native-css баг**: `textAlign` на `<TextInput>` через className
  (напр. `text-center`) КРАШИТЬ ("undefined is not a function"). Задавати
  `style={{ textAlign: "center" }}`.
- **react-native-svg**: задавати `<Svg width={..} height={..}>` числами, не лише
  через `style` — інакше на частині Android полотно не на весь екран (чорна смуга).
- **ScrollView у Pressable**: НЕ загортати скрол/колесо в `Pressable` (картка
  модалки) — Android-предок перехоплює жест. Бекдроп робити окремим абсолютним
  `Pressable` ПОЗАДУ картки-`View` (див. RestMenu, ConfirmDialog).
- **`/opacity` на hex-токенах** NativeWind ненадійний — уникати (крім вбудованих
  кольорів типу `bg-black/70`).
- **expo-router SDK56** = vendored navigation: немає `@react-navigation/native`,
  немає опції `detachPreviousScreen`; є `freezeOnBlur`.
- **Білі екрани при поверненні (pop)**: відомий мінорний баг. Зроблено
  `contentStyle` темний, `userInterfaceStyle:"dark"`, `freezeOnBlur:false`. У
  **Expo Go** все одно блимає (білий фон самого Expo Go). ПЕРЕВІРИТИ у власному
  dev build / APK — там фон вікна темний. Поки відкладено.
- Нативні модулі (pager-view, audio, svg) → після встановлення перезапуск з `-c`.

## Як перевіряти зміни
- `npx tsc --noEmit` (має бути чисто).
- `npx expo export --platform android` (бандл збирається). Якщо зайнятий `dist`
  від попередніх запусків — видалити й повторити.
- Reanimated/нативні анімації — лише на пристрої (Expo Go / dev build).

## Що далі по плану (Фаза 3+)
1. **Графіки прогресу в Аналітиці** (кнопка «Аналіз» — заглушка): тоннаж/об'єм
   по групах м'язів, тренди в часі.
2. **«Тіло»** (кнопка «Тіло» — заглушка) — **секція Аналітики** (не окрема
   вкладка): вага + графік, заміри, фото прогресу. Почати з ваги+графік
   (потрібна нова таблиця → міграція v5).
3. **Доперекласти «хвіст» вправ**: доповнювати ручний словник у
   `exercise-names.ts` партіями (стретчі/пліометрика/стронгмен).
4. **Хвости тренувань**: показ «за рутиною X» в історії (є `session.routine_id`);
   захист від видалення рутини, що використовується в програмі (зараз лишить
   «битий» day).
5. Далі за `docs/fitlog_plan.md`: експорт CSV, сповіщення, перемикач мови
   (UA/EN — інфраструктура `name`/`name_uk` готова).

## Стартова репліка для нового чату (приклад)
«Продовжуємо fitlog. Прочитай docs/HANDOFF.md. Далі за планом — рутини
(шаблони тренувань). Спершу покажи план, потім код.»
