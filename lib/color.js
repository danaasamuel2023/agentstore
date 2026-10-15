/**
 * GENERATED FILE — do not edit here.
 * Source:    datamart-shared/src/color.js
 * Generate:  node datamart-shared/sync.mjs --write   (check: node datamart-shared/sync.mjs)
 * Copy for:  simple store (cheapdata.shop) — ES module, storefront variant
 */
/**
 * Colour maths for store themes: contrast, a readable text colour on a
 * colour, lighter/darker versions. No DOM, no React — used by the store
 * websites (in the browser and on the server) and by the website builder.
 *
 * Inputs are '#rrggbb'. normaliseHex() turns anything an owner typed
 * ('abc', '#ABC', 'aabbcc') into that form, or null; call it first when the
 * value is not already clean.
 */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Near-black used for text on light colours (each app may pass its own). */
export const INK_DARK = '#0b0f14';

/** 'abc' / '#abc' / 'AABBCC' → '#aabbcc', or null if it is not a colour. */
export function normaliseHex(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!HEX.test(raw)) return null;
  let hex = raw.replace('#', '').toLowerCase();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return `#${hex}`;
}

/** '#rrggbb' → [r, g, b] (0–255). Missing → black. */
export function hexToRgb(hex) {
  const h = String(hex || '#000000').replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** [r, g, b] → '#rrggbb' (clamped and rounded). */
export function rgbToHex(c) {
  return `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * WCAG relative luminance. (Not the 299/587/114 YIQ shortcut, which mis-ranks
 * saturated colours — MTN yellow and mid blues especially.)
 */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. Order does not matter. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** White or `dark` — whichever reads better on `hex`. */
export function readableOn(hex, dark = INK_DARK) {
  return contrast(hex, '#ffffff') >= contrast(hex, dark) ? '#ffffff' : dark;
}

/** Mix toward black (t < 0) or white (t > 0); |t| is how far, 0–1. */
export function shade(hex, t) {
  const target = t < 0 ? 0 : 255;
  return rgbToHex(hexToRgb(hex).map((v) => v + (target - v) * Math.abs(t)));
}
