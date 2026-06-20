// Український шар перекладу для скінченної таксономії free-exercise-db.
// Назви вправ перекладаємо поступово (name_uk у БД); тут — лише сталі набори.

const MUSCLES: Record<string, string> = {
  abdominals: "Прес",
  abductors: "Абдуктори",
  adductors: "Аддуктори",
  biceps: "Біцепс",
  calves: "Литки",
  chest: "Груди",
  forearms: "Передпліччя",
  glutes: "Сідниці",
  hamstrings: "Біцепс стегна",
  lats: "Широчайші",
  "lower back": "Поперек",
  "middle back": "Середина спини",
  neck: "Шия",
  quadriceps: "Квадрицепс",
  shoulders: "Плечі",
  traps: "Трапеції",
  triceps: "Трицепс",
};

const EQUIPMENT: Record<string, string> = {
  bands: "Гумові стрічки",
  barbell: "Штанга",
  "body only": "Без обладнання",
  cable: "Блок",
  dumbbell: "Гантелі",
  "e-z curl bar": "EZ-штанга",
  "exercise ball": "Фітбол",
  "foam roll": "Масажний валик",
  kettlebells: "Гирі",
  machine: "Тренажер",
  "medicine ball": "Медбол",
  other: "Інше",
};

const CATEGORY: Record<string, string> = {
  strength: "Сила",
  stretching: "Розтяжка",
  plyometrics: "Пліометрика",
  strongman: "Стронгмен",
  powerlifting: "Пауерліфтинг",
  cardio: "Кардіо",
  "olympic weightlifting": "Важка атлетика",
};

const LEVEL: Record<string, string> = {
  beginner: "Початковий",
  intermediate: "Середній",
  expert: "Просунутий",
};

// Загальний помічник: переклад або оригінал (з нормалізацією регістру).
function translate(dict: Record<string, string>, value: string | null): string {
  if (!value) return "—";
  return dict[value.toLowerCase().trim()] ?? value;
}

export const tMuscle = (v: string | null) => translate(MUSCLES, v);
export const tEquipment = (v: string | null) => translate(EQUIPMENT, v);
export const tCategory = (v: string | null) => translate(CATEGORY, v);
export const tLevel = (v: string | null) => translate(LEVEL, v);

// Порядок груп м'язів для чипів-фільтрів (англ. ключі = як у БД).
export const MUSCLE_ORDER = Object.keys(MUSCLES);
