// Пропорційне масштабування розмірів під різні екрани (підхід size-matters).
// Проблема: розміри відкалібровані під довгий телефон автора — на коротших
// елементи завеликі й з'являється скрол. Тут — масштаб відносно базового
// екрана, з clamp, щоб на дуже малих не стискало надміру, на великих не роздувало.
//
// Використання: розміри/відступи через style, кольори/лейаут лишаються в className.
//   style={{ fontSize: ms(16), paddingVertical: vs(10) }}
import { Dimensions } from "react-native";

// Базовий екран (≈ телефон, де дизайн виглядає ідеально). Портретна орієнтація
// зафіксована в app.json, тож розміри беремо один раз при старті.
const GUIDELINE_WIDTH = 390;
const GUIDELINE_HEIGHT = 844;

const { width, height } = Dimensions.get("window");

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

// Коефіцієнти масштабу з обмеженням, щоб уникнути крайнощів.
const wScale = clamp(width / GUIDELINE_WIDTH, 0.85, 1.1);
const hScale = clamp(height / GUIDELINE_HEIGHT, 0.8, 1.1);

/** Горизонтальний масштаб (ширина шрифтів, іконок, бічні відступи). */
export const s = (size: number) => Math.round(size * wScale);

/** Вертикальний масштаб (висоти, вертикальні відступи) — лікує переповнення. */
export const vs = (size: number) => Math.round(size * hScale);

/**
 * Помірний масштаб за шириною (factor 0..1). 0.5 — м'яке масштабування.
 */
export const ms = (size: number, factor = 0.5) =>
  Math.round(size + (size * wScale - size) * factor);

/**
 * Помірний масштаб за висотою — для шрифтів/елементів на щільних екранах,
 * де біль саме у вертикальному переповненні на коротких телефонах.
 */
export const mvs = (size: number, factor = 0.5) =>
  Math.round(size + (size * hScale - size) * factor);
