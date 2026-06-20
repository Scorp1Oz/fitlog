import { colors, type Palette } from "./colors";

// Сьогодні повертає статичну палітру. Це навмисний «шов» (seam): коли зробимо
// перемикання тем, тут читатимемо активну палітру (з Context / сховища), а всі
// компоненти, що вже викликають useTheme(), запрацюють без жодних змін.
export function useTheme(): { colors: Palette } {
  return { colors };
}
