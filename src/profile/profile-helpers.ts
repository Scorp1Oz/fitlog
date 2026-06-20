import type { Profile } from "@/db/profiles";

// Ім'я для показу: редаговане display_name, інакше — логін.
export function getDisplayName(profile: Profile | null | undefined): string {
  const name = profile?.display_name?.trim();
  return name && name.length > 0 ? name : (profile?.username ?? "");
}

const MONTHS_UK = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

// Дата реєстрації у вигляді «20 червня 2026».
export function formatJoinDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_UK[d.getMonth()]} ${d.getFullYear()}`;
}

// Ініціали для кружка-аватара (1–2 літери).
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
