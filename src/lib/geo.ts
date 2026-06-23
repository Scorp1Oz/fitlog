// Геометрія/формати для пробіжок: відстань між координатами (Haversine),
// формат дистанції, темпу й швидкості.

export type LatLng = { lat: number; lng: number };

const R = 6371000; // радіус Землі, м
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Відстань між двома точками в метрах (формула Haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Сумарна довжина треку (метри). */
export function trackDistanceMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

/** «5.23 км» або «850 м». */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} км`;
  return `${Math.round(meters)} м`;
}

/** Темп «5:30 /км» із секунд на км. «—», якщо немає руху. */
export function formatPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /км`;
}

/** Темп (секунд на км) із дистанції (м) і часу (с). 0, якщо замало даних. */
export function paceSecPerKm(distanceM: number, durationS: number): number {
  if (distanceM < 1) return 0;
  return durationS / (distanceM / 1000);
}
