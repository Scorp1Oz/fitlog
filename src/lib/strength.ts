// Оцінка одноповторного максимуму (1ПМ) за формулою Еплі.
// 1ПМ ≈ вага × (1 + повтори / 30). Надійна приблизно до 12 повторів.
export function epley1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// Найкраща оцінка 1ПМ серед набору підходів.
export function bestE1rm(sets: { weight: number; reps: number }[]): number {
  let best = 0;
  for (const s of sets) {
    const e = epley1rm(s.weight, s.reps);
    if (e > best) best = e;
  }
  return best;
}

// Кілограми для показу: ціле число.
export function kg(n: number): number {
  return Math.round(n);
}

// Підхід текстом. Без ваги (0) — лише повтори (вправи з власною вагою).
export function formatSet(weight: number, reps: number): string {
  return weight > 0 ? `${weight} кг × ${reps}` : `${reps} повт.`;
}

// Компактно («60×8» або «8» для власної ваги).
export function formatSetShort(weight: number, reps: number): string {
  return weight > 0 ? `${weight}×${reps}` : `${reps}`;
}
