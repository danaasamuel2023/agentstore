/**
 * A full store's own design → the CSS that draws it. No React here: the store
 * layout (server) and the design-preview listener (client) both use it.
 *
 * The design is the one the owner saves in the DataMart dashboard (by hand or
 * with the AI designer): customization.design, shape in lib/designSpec.js. It
 * is run through sanitizeDesign() before anything is drawn, so every value
 * that reaches the CSS below is a 6-digit hex colour or a word from a fixed
 * list — nothing the owner typed is ever written into a stylesheet.
 *
 * A store WITHOUT a saved design gets no CSS at all and looks exactly as it
 * always has (DataBundle yellow).
 *
 * What a design changes here:
 *   brand / accent  → --brand, --brand-deep (+ a readable text colour on each)
 *   font            → the whole store's typeface (Google Fonts, fixed list)
 *   radius          → corners of cards, buttons and inputs
 *   buttonStyle     → solid · outline · pill · soft · gradient · raised · glow
 *   mode            → dark by default when the visitor has not picked a theme
 *   headline, subheadline, heroAlign → the home page header (app/[storeSlug]/page.js)
 * Network bundle cards keep the network's own colours on purpose.
 */
import { sanitizeDesign, FONTS } from './designSpec';
import { contrast, luminance, shade, readableOn as readableOnColor } from './color';

/** The store's saved design, cleaned — or null for a store that has none. */
export function savedDesign(store) {
  const d = store?.customization?.design;
  return d && typeof d === 'object' ? sanitizeDesign(d) : null;
}

/* ── colour helpers (lib/color.js, generated from datamart-shared) ───── */

export { contrast };

/** Near-black (this site's ink colour) or white — whichever reads better on `hex`. */
export function readableOn(hex) {
  return readableOnColor(hex, '#0f0e0b');
}

/* The page colours the brand has to work against (app/globals.css). */
const PAGE = {
  light: { surface: '#ffffff', ink: '#0f0e0b' },
  dark: { surface: '#1a1a16', ink: '#f5f4ef' },
};

/** `hex`, pushed lighter or darker until it reads at `min`:1 on `bg`. */
function readableVersion(hex, bg, min = 3) {
  if (contrast(hex, bg) >= min) return hex;
  const t = luminance(bg) > 0.5 ? -0.15 : 0.15;
  let c = hex;
  for (let i = 0; i < 12 && contrast(c, bg) < min; i++) c = shade(c, t);
  return contrast(c, bg) >= min ? c : readableOn(bg);
}

/**
 * The brand in each role, for one page mode. The brand is a FILL on buttons
 * and badges, but the old yellow theme also used it as TEXT (icons, links)
 * and put it on the ink colour (dark buttons with yellow labels). An owner's
 * colour may be near-black or near-white, so each role gets its own readable
 * version instead of the raw value.
 *   --brand          the fill, exactly the owner's colour
 *   --brand-ink      text on the fill
 *   --brand-deep     hover / second colour; also used as text on the page
 *   --brand-text     the brand as text on the page
 *   --brand-on-ink   the brand as text on an ink-coloured button
 *   --brand-edge     outline for a fill that would vanish into the page
 */
function modeVars(d, mode) {
  const { surface, ink } = PAGE[mode];
  const brand = d.brand;
  let deep = d.accent && contrast(d.accent, surface) >= 3 ? d.accent : shade(brand, mode === 'light' ? -0.18 : 0.18);
  deep = readableVersion(deep, surface);
  const edge = contrast(brand, surface) < 1.6
    ? `color-mix(in srgb, ${readableOn(brand)} 35%, transparent)`
    : 'transparent';
  return [
    `--brand:${brand}`,
    `--brand-ink:${readableOn(brand)}`,
    `--brand-deep:${deep}`,
    `--brand-deep-ink:${readableOn(deep)}`,
    `--brand-text:${readableVersion(brand, surface)}`,
    `--brand-on-ink:${readableVersion(brand, ink)}`,
    `--brand-edge:${edge}`,
    `--brand-glow:color-mix(in srgb,${brand} 16%,${surface})`,
  ].join(';');
}

/* ── fonts ──────────────────────────────────────────────────────────────── */

/** Google Fonts stylesheet for the design's font, or null for Inter (already loaded). */
export function fontHref(fontId) {
  const f = FONTS[fontId];
  if (!f || fontId === 'inter') return null;
  return `https://fonts.googleapis.com/css2?family=${f.family.replace(/ /g, '+')}:wght@${f.weights}&display=swap`;
}

/* ── the stylesheet ─────────────────────────────────────────────────────── */

const RADII = {
  sharp: { card: '8px', soft: '6px', btn: '6px', xl: '6px', '2xl': '8px', lg: '4px' },
  soft: null, // today's corners
  round: { card: '28px', soft: '24px', btn: '999px', xl: '18px', '2xl': '24px', lg: '14px' },
};

function buttonRules(style) {
  const y = '.btn-yellow';
  switch (style) {
    case 'outline':
      return `${y}{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 2px var(--brand-text)}${y}:hover{background:var(--brand);color:var(--brand-ink)}`;
    case 'soft':
      return `${y}{background:var(--brand-glow);color:var(--ink);box-shadow:none}${y}:hover{background:var(--brand);color:var(--brand-ink)}`;
    case 'gradient':
      return `${y}{background:linear-gradient(135deg,var(--brand),var(--brand-deep));color:var(--brand-ink)}${y}:hover{filter:brightness(1.06);background:linear-gradient(135deg,var(--brand),var(--brand-deep));color:var(--brand-ink)}`;
    case 'raised':
      return `${y}{box-shadow:0 4px 0 var(--brand-deep)}${y}:active{box-shadow:0 1px 0 var(--brand-deep);transform:translateY(3px)}`;
    case 'glow':
      return `${y}{box-shadow:0 8px 24px -6px var(--brand)}`;
    case 'pill':
      return '.btn{border-radius:999px}';
    default:
      return '';
  }
}

/**
 * The whole stylesheet for one design. Every interpolated value is a hex
 * colour from sanitizeDesign()/the helpers above, or a font family from the
 * fixed FONTS list.
 */
export function designCss(design) {
  const d = sanitizeDesign(design);
  const font = FONTS[d.font] && d.font !== 'inter' ? `"${FONTS[d.font].family}", ` : '';

  const out = [
    `:root{${modeVars(d, 'light')}}`,
    `:root.dark{${modeVars(d, 'dark')}}`,
    font ? `body{font-family:${font}var(--font-sans)}` : '',
    // Text that sits ON the brand colour follows it (it was black for yellow).
    `.btn-yellow,.btn-yellow:hover{color:var(--brand-ink)}.btn-yellow:hover{background:var(--brand-deep);color:var(--brand-deep-ink)}`,
    `.btn-primary{color:var(--brand-on-ink)}`,
    `.btn-yellow{box-shadow:inset 0 0 0 1.5px var(--brand-edge)}`,
    `[class*="text-[color:var(--brand)]"]{color:var(--brand-text)}`,
    `[class*="bg-[color:var(--ink)]"][class*="text-[color:var(--brand)]"]{color:var(--brand-on-ink)}`,
    `[class*="bg-[color:var(--brand)]"].text-black,[class*="bg-[color:var(--brand)]"] .text-black{color:var(--brand-ink)!important}`,
    `[class*="bg-[color:var(--brand-deep)]"].text-black{color:var(--brand-deep-ink)!important}`,
    // The yellow→amber cards (account hero, wallet) take the store's colours.
    `[class*="from-[#FBBF24]"]{background-image:linear-gradient(to bottom right,var(--brand),var(--brand-deep))!important}`,
    `[class*="from-[#FBBF24]"] [class*="text-black"]{color:var(--brand-ink)!important}`,
    `[class*="from-[#FBBF24]"] [class*="bg-black/"]{background-color:color-mix(in srgb,var(--brand-ink) 16%,transparent)!important;border-color:color-mix(in srgb,var(--brand-ink) 22%,transparent)!important}`,
    buttonRules(d.buttonStyle),
  ];

  const r = RADII[d.radius];
  if (r) {
    out.push(
      `.card{border-radius:${r.card}}.card-soft{border-radius:${r.soft}}`,
      `.btn{border-radius:${r.btn}}`,
      `main .rounded-xl{border-radius:${r.xl}}main .rounded-2xl{border-radius:${r['2xl']}}main .rounded-lg{border-radius:${r.lg}}`,
    );
  }
  if (d.density === 'compact') out.push('.btn{padding-top:.5rem;padding-bottom:.5rem}');

  return out.filter(Boolean).join('\n');
}

/**
 * Runs before paint (inline in the store layout): a design made for dark mode
 * opens dark — unless this visitor already picked light or dark themselves.
 */
export function darkBootScript(design) {
  if (sanitizeDesign(design).mode !== 'dark') return null;
  return "(function(){try{if(!localStorage.getItem('theme'))document.documentElement.classList.add('dark')}catch(_){}})();";
}
