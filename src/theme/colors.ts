// Єдине джерело правди для кольорів, які НЕ можна задати через className
// (SVG-градієнти, Switch, частинки — їм потрібен рядок кольору, а не клас).
//
// ВАЖЛИВО: ці значення дублюють токени з global.css (@theme). Тримай їх
// синхронними. Коли додамо перемикання тем, активну палітру віддаватиме
// useTheme(), і всі ці місця оновляться автоматично — без правок у компонентах.
export const colors = {
  bg: "#0D0D0D",
  surface: "#161616",
  surface2: "#1E1E1E",
  border: "#222222",
  faint: "#2A2A2A",
  lime: "#C8F135",
  limeTrack: "#6B7F2A", // тьмяний лайм — трек увімкненого Switch
  orange: "#FF4D1C",
  text: "#E8E8E8",
  textMuted: "#888888",
  textDim: "#555555",
  success: "#7BC043",
  onLime: "#0D0D0D",
} as const;

export type Palette = typeof colors;
