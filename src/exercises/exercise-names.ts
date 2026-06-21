// Український переклад назв вправ. Гібрид:
//  1) CURATED — ручний якісний словник для частих/базових вправ;
//  2) токенний рушій — для решти: виділяємо обладнання й модифікатори у
//     прийменникові форми (не змінюють рід/відмінок), решта = «рух», який
//     перекладаємо за словником MOVEMENTS. Невідомий рух лишається англ.
//
// Англійська назва завжди зберігається окремо (exercises.name) — для
// майбутнього перемикача мови в налаштуваннях.

// Обладнання → прийменникова форма (додається в кінець).
const EQUIPMENT: Record<string, string> = {
  barbell: "зі штангою",
  dumbbell: "з гантелями",
  dumbbells: "з гантелями",
  cable: "на блоці",
  machine: "в тренажері",
  smith: "у Сміті",
  kettlebell: "з гирею",
  kettlebells: "з гирями",
  band: "з гумою",
  bands: "з гумою",
  "medicine ball": "з медболом",
  "exercise ball": "на фітболі",
  "stability ball": "на фітболі",
  lever: "в тренажері",
  leverage: "в тренажері",
  "smith machine": "у Сміті",
  "ez bar": "з EZ-штангою",
  "e-z bar": "з EZ-штангою",
  "ez-bar": "з EZ-штангою",
  machines: "в тренажері",
};

// Частина тіла (для назв-розтяжок «X Stretch» → «розтяжка ...»).
const BODY: Record<string, string> = {
  calf: "литок",
  calves: "литок",
  hamstring: "задньої поверхні стегна",
  hamstrings: "задньої поверхні стегна",
  quad: "квадрицепса",
  quads: "квадрицепса",
  quadriceps: "квадрицепса",
  chest: "грудей",
  shoulder: "плечей",
  shoulders: "плечей",
  triceps: "трицепса",
  biceps: "біцепса",
  back: "спини",
  hip: "стегон",
  hips: "стегон",
  glute: "сідниць",
  glutes: "сідниць",
  neck: "шиї",
  groin: "паху",
  lat: "широчайших",
  lats: "широчайших",
  forearm: "передпліч",
  forearms: "передпліч",
  ankle: "гомілковостопу",
  wrist: "зап'ясть",
  spine: "спини",
  abdominal: "преса",
  abdominals: "преса",
};

// Модифікатори (адвербіальні/прийменникові — без узгодження за родом).
const MODIFIERS: Record<string, string> = {
  incline: "на похилій лаві",
  decline: "на лаві з нахилом униз",
  seated: "сидячи",
  standing: "стоячи",
  lying: "лежачи",
  "bent over": "в нахилі",
  "bent-over": "в нахилі",
  kneeling: "на колінах",
  "one-arm": "однією рукою",
  "single-arm": "однією рукою",
  "one arm": "однією рукою",
  "one-leg": "на одній нозі",
  "single-leg": "на одній нозі",
  "one leg": "на одній нозі",
  "close-grip": "вузьким хватом",
  "wide-grip": "широким хватом",
  "reverse-grip": "зворотним хватом",
  "reverse grip": "зворотним хватом",
  "neutral grip": "нейтральним хватом",
  "medium grip": "середнім хватом",
  alternating: "поперемінно",
  alternate: "поперемінно",
  overhead: "над головою",
  weighted: "з обтяженням",
};

// «Рух» (після зняття обладнання й модифікаторів) → українською.
// Ключі — у нижньому регістрі; багатослівні фрази шукаються точним збігом.
const MOVEMENTS: Record<string, string> = {
  "bench press": "жим лежачи",
  "floor press": "жим лежачи з підлоги",
  "chest press": "жим від грудей",
  "shoulder press": "жим над головою",
  "military press": "армійський жим",
  "overhead press": "жим над головою",
  press: "жим",
  squat: "присідання",
  squats: "присідання",
  "front squat": "фронтальні присідання",
  "hack squat": "гак-присідання",
  "split squat": "болгарські присідання",
  "leg press": "жим ногами",
  deadlift: "станова тяга",
  "romanian deadlift": "румунська станова тяга",
  "stiff leg deadlift": "станова тяга на прямих ногах",
  "sumo deadlift": "станова тяга сумо",
  row: "тяга в нахилі",
  rows: "тяга в нахилі",
  "upright row": "тяга до підборіддя",
  "seated row": "горизонтальна тяга",
  "cable row": "горизонтальна тяга",
  "inverted row": "австралійські підтягування",
  pulldown: "тяга верхнього блоку",
  "lat pulldown": "тяга верхнього блоку",
  pullover: "пуловер",
  pullup: "підтягування",
  "pull-up": "підтягування",
  "pull up": "підтягування",
  pullups: "підтягування",
  "pull-ups": "підтягування",
  chinup: "підтягування зворотним хватом",
  "chin-up": "підтягування зворотним хватом",
  "chin up": "підтягування зворотним хватом",
  curl: "підйом на біцепс",
  curls: "підйоми на біцепс",
  "hammer curl": "молоткові підйоми",
  "hammer curls": "молоткові підйоми",
  "preacher curl": "підйоми на лаві Скотта",
  "concentration curl": "концентровані підйоми",
  "leg curl": "згинання ніг",
  "leg curls": "згинання ніг",
  "wrist curl": "згинання зап'ясть",
  extension: "розгинання",
  extensions: "розгинання",
  "leg extension": "розгинання ніг",
  "triceps extension": "розгинання на трицепс",
  "tricep extension": "розгинання на трицепс",
  "back extension": "гіперекстензія",
  fly: "розведення",
  flye: "розведення",
  flyes: "розведення",
  flys: "розведення",
  "reverse fly": "зворотні розведення",
  raise: "підйом",
  raises: "підйоми",
  "lateral raise": "махи в сторони",
  "side lateral raise": "махи гантелями в сторони",
  "front raise": "підйоми перед собою",
  "calf raise": "підйом на носки",
  "leg raise": "підйом ніг",
  pushdown: "розгинання на блоці",
  pushup: "віджимання",
  "push-up": "віджимання",
  "push up": "віджимання",
  pushups: "віджимання",
  "push-ups": "віджимання",
  dip: "віджимання на брусах",
  dips: "віджимання на брусах",
  shrug: "шраги",
  shrugs: "шраги",
  lunge: "випади",
  lunges: "випади",
  crunch: "скручування",
  crunches: "скручування",
  "sit-up": "підйом тулуба",
  "sit up": "підйом тулуба",
  situp: "підйом тулуба",
  "leg raises": "підйоми ніг",
  crossover: "кросовер",
  thruster: "трастер",
  clean: "взяття на груди",
  "clean and jerk": "взяття на груди й поштовх",
  snatch: "ривок",
  jerk: "поштовх",
  "good morning": "нахили зі штангою",
  "hip thrust": "ягодичний міст зі штангою",
  bridge: "ягодичний міст",
  "glute bridge": "ягодичний міст",
  "face pull": "тяга до обличчя",
  kickback: "віддача на трицепс",
  skullcrusher: "французький жим лежачи",
  "skull crusher": "французький жим лежачи",
  "calf press": "жим носками",
  "russian twist": "російські скручування",
  twist: "скручування з поворотом",
  "wood chop": "дроворуб",
  chop: "дроворуб",
  plank: "планка",
  stretch: "розтяжка",
  jump: "стрибки",
  jumps: "стрибки",
  "step-up": "зашагування на тумбу",
  "step up": "зашагування на тумбу",
  "box jump": "застрибування на тумбу",
  "long jump": "стрибок у довжину",
  "broad jump": "стрибок у довжину",
  "mountain climber": "скелелаз",
  windmill: "вітряк",
  "turkish get-up": "турецький підйом",
  "get-up": "турецький підйом",
  "t-bar row": "тяга Т-грифа",
  "hang clean": "взяття на груди з вису",
  "power clean": "силове взяття на груди",
  "high pull": "висока тяга",
  rollout: "розкатка колеса",
  "ab rollout": "розкатка колеса",
  "pull apart": "розведення гуми",
  "pull through": "протяжка між ніг",
  "hip adduction": "зведення стегна",
  "hip abduction": "відведення стегна",
  "shoulder raise": "підйом плечей",
  "deltoid raise": "махи в сторони",
  "rear delt row": "тяга на задні дельти",
  pulldowns: "тяга верхнього блоку",
  "reverse flye": "зворотні розведення",
  "reverse flyes": "зворотні розведення",
  "tricep dips": "віджимання на брусах",
};

// Ручні переклади для частих/базових вправ (повна англ. назва → українська).
const CURATED: Record<string, string> = {
  "Barbell Bench Press - Medium Grip": "Жим штанги лежачи",
  "Barbell Squat": "Присідання зі штангою",
  "Barbell Full Squat": "Присідання зі штангою",
  "Barbell Deadlift": "Станова тяга зі штангою",
  "Romanian Deadlift": "Румунська станова тяга",
  "Conventional Deadlift": "Класична станова тяга",
  "Wide-Grip Lat Pulldown": "Тяга верхнього блоку широким хватом",
  "Pullups": "Підтягування",
  "Chin-Up": "Підтягування зворотним хватом",
  "Dips - Triceps Version": "Віджимання на брусах (трицепс)",
  "Dips - Chest Version": "Віджимання на брусах (груди)",
  "Standing Calf Raises": "Підйоми на носки стоячи",
  "Seated Calf Raise": "Підйоми на носки сидячи",
  "Leg Press": "Жим ногами",
  "Seated Leg Curl": "Згинання ніг сидячи",
  "Lying Leg Curls": "Згинання ніг лежачи",
  "Leg Extensions": "Розгинання ніг",
  "Barbell Curl": "Підйом штанги на біцепс",
  "Dumbbell Bicep Curl": "Підйом гантелей на біцепс",
  "Hammer Curls": "Молоткові підйоми",
  "Triceps Pushdown": "Розгинання на блоці (трицепс)",
  "Standing Military Press": "Армійський жим стоячи",
  "Arnold Dumbbell Press": "Жим Арнольда",
  "Side Lateral Raise": "Махи гантелями в сторони",
  "Front Dumbbell Raise": "Підйоми гантелей перед собою",
  "Cable Crossover": "Кросовер на блоці",
  "Incline Dumbbell Press": "Жим гантелей на похилій лаві",
  "Dumbbell Flyes": "Розведення гантелей лежачи",
  "Bent Over Barbell Row": "Тяга штанги в нахилі",
  "Hip Thrust": "Ягодичний міст зі штангою",
  "Plank": "Планка",
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Пошук руху з фолбеком на однину (curls→curl, flyes→fly, raises→raise).
function lookupMovement(key: string): string | null {
  if (MOVEMENTS[key]) return MOVEMENTS[key];
  const words = key.split(" ");
  const last = words[words.length - 1];
  const singulars = last.endsWith("ies")
    ? [last.slice(0, -3) + "y"]
    : last.endsWith("es")
      ? [last.slice(0, -2), last.slice(0, -1)]
      : last.endsWith("s")
        ? [last.slice(0, -1)]
        : [];
  for (const s of singulars) {
    const alt = [...words.slice(0, -1), s].join(" ");
    if (MOVEMENTS[alt]) return MOVEMENTS[alt];
  }
  return null;
}

// Витягти перший збіг із словника за словами/фразами; повертає {hit, rest}.
function extract(
  words: string[],
  dict: Record<string, string>
): { value: string | null; rest: string[] } {
  // Пробуємо фрази довжиною 3→1 слова (longest-match), один раз.
  for (let len = 3; len >= 1; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      if (dict[phrase]) {
        return {
          value: dict[phrase],
          rest: [...words.slice(0, i), ...words.slice(i + len)],
        };
      }
    }
  }
  return { value: null, rest: words };
}

/**
 * Перекласти назву вправи українською. Якщо «рух» невідомий — повертає
 * англійський залишок (часткове покриття «хвоста» бази).
 */
export function translateExerciseName(name: string): string {
  const curated = CURATED[name.trim()];
  if (curated) return curated;

  // Працюємо з частиною до « - » (варіація хвату тощо).
  const base = name.split(" - ")[0];
  let words = norm(base).split(" ").filter(Boolean);

  // Обладнання: може бути кілька токенів (напр. «Smith Machine»), беремо
  // першу впізнану форму, решту просто прибираємо зі слів.
  let equip: string | null = null;
  for (;;) {
    const e = extract(words, EQUIPMENT);
    if (!e.value) break;
    if (!equip) equip = e.value;
    words = e.rest;
  }

  // Модифікатори (кілька).
  const mods: string[] = [];
  for (;;) {
    const m = extract(words, MODIFIERS);
    if (!m.value) break;
    mods.push(m.value);
    words = m.rest;
  }

  // Решта = рух. Спецвипадок «X stretch» → «розтяжка <частина тіла>».
  const movementKey = words.join(" ");
  let mv: string;
  if (words.length >= 2 && words[words.length - 1] === "stretch") {
    const partsBody = words
      .slice(0, -1)
      .map((w) => BODY[w])
      .filter(Boolean);
    mv = partsBody.length ? `розтяжка ${partsBody.join(" ")}` : "розтяжка";
  } else {
    mv = lookupMovement(movementKey) ?? (movementKey ? cap(movementKey) : "");
  }

  const parts = [mv];
  if (equip) parts.push(equip);
  if (mods.length) parts.push(...mods);
  const result = parts.filter(Boolean).join(" ").trim();
  return cap(result || name);
}
