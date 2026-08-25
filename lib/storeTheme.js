/**
 * Store theming — single source of truth.
 *
 * This replaces the `themePresets` / `getThemeColors` blocks that were copied
 * into StorePageClient and StoreLayoutClient. Those copies read
 * `store.theme.primaryColor` and `store.settings.primaryColor`, and the
 * AgentStore schema has NEITHER field — the owner's colour lives at
 * `store.customization.primaryColor`. So every lookup fell through to the
 * hardcoded dark preset and every store rendered identically, regardless of
 * what its owner picked. Read `customization` and only `customization`.
 */

/* Curated palette offered to owners in the design editor. Each one has been
   checked to clear 4.5:1 against the white or near-black label we put on it. */
export const BRAND_PRESETS = [
  { id: 'forest',    name: 'Forest',    hex: '#0E7C5A' },
  { id: 'ocean',     name: 'Ocean',     hex: '#1257A6' },
  { id: 'ink',       name: 'Ink',       hex: '#1F2937' },
  { id: 'plum',      name: 'Plum',      hex: '#6D28D9' },
  { id: 'crimson',   name: 'Crimson',   hex: '#BE123C' },
  { id: 'rust',      name: 'Rust',      hex: '#C2410C' },
  { id: 'teal',      name: 'Teal',      hex: '#0F766E' },
  { id: 'cocoa',     name: 'Cocoa',     hex: '#78350F' },
  { id: 'sapphire',  name: 'Sapphire',  hex: '#3730A3' },
  { id: 'moss',      name: 'Moss',      hex: '#4D7C0F' },
];

export const DEFAULT_BRAND = '#0E7C5A';

/* The three networks. Fixed — these are the telcos' own marks and an owner
   does not get to recolour them, or customers stop recognising them. */
export const NETWORKS = {
  YELLO:      { key: 'YELLO',      name: 'MTN',        hex: '#FFCC00', ink: '#101010' },
  TELECEL:    { key: 'TELECEL',    name: 'Telecel',    hex: '#E11D2E', ink: '#FFFFFF' },
  // AirtelTigo is BLUE. The old #6D28D9 purple was inherited from the very
  // first version of this storefront and is not their mark.
  AT_PREMIUM: { key: 'AT_PREMIUM', name: 'AirtelTigo', hex: '#1E3A6B', ink: '#FFFFFF' },
};

export const networkOf = (network) =>
  NETWORKS[network] || { key: network, name: network || 'Data', hex: '#64748B', ink: '#FFFFFF' };

/* -------------------------------------------------------------------------- */
/* Colour maths                                                               */
/* -------------------------------------------------------------------------- */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalise `abc` / `#abc` / `AABBCC` to `#aabbcc`. Returns null if unusable. */
export function normaliseHex(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!HEX.test(raw)) return null;
  let hex = raw.replace('#', '').toLowerCase();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return `#${hex}`;
}

function toRgb(hex) {
  const h = normaliseHex(hex) || DEFAULT_BRAND;
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

/** WCAG relative luminance. The old code used the 299/587/114 YIQ shortcut,
 *  which mis-ranks saturated colours — MTN yellow and mid blues especially. */
function relativeLuminance(hex) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = toRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Whichever of near-black / white is more readable on top of `hex`. */
export function readableOn(hex) {
  return contrastRatio(hex, '#ffffff') >= contrastRatio(hex, '#0b0f14') ? '#ffffff' : '#0b0f14';
}

/**
 * Is this colour dark enough to carry white text at 4.5:1?
 * The editor warns rather than blocks — an owner may want a pale brand and
 * we still render it readably by flipping --brand-ink to near-black.
 */
export function brandContrastNote(hex) {
  const ink = readableOn(hex);
  const ratio = contrastRatio(hex, ink);
  if (ratio >= 4.5) return null;
  return `This colour only reaches ${ratio.toFixed(1)}:1 against its label text. Buttons using it may be hard to read.`;
}

/* -------------------------------------------------------------------------- */
/* Store -> theme                                                             */
/* -------------------------------------------------------------------------- */

/** The owner's brand colour, or the default. */
export function resolveBrand(store) {
  return normaliseHex(store?.customization?.primaryColor) || DEFAULT_BRAND;
}

const LIGHT_PAPER = '#ffffff';
const DARK_PAPER = '#10151b';

/**
 * Is the brand so close to the surface behind it that a filled button would
 * disappear into the page?
 *
 * This used to LIGHTEN the brand until it separated. That worked and was wrong:
 * a shop whose colour is #000000 saw its black turn grey the moment dark mode
 * came on. The colour is the one thing on the page that is theirs — it does not
 * get quietly edited to solve our layout problem.
 *
 * Instead the colour is left exactly as chosen, and where it would vanish we
 * draw a hairline around it in its own ink. Black stays black; it just gains a
 * faint edge so you can see where the button ends.
 */
function needsEdge(hex, surface) {
  return contrastRatio(hex, surface) < 1.6;
}

/**
 * CSS custom properties to spread onto a wrapper element as `style`.
 * Everything downstream reads var(--brand) / var(--brand-ink), so no component
 * needs to know how the colour was chosen — including the live preview in the
 * owner's design editor, which just passes an un-saved colour through here.
 *
 * `dark` must be passed because these are inline styles on a wrapper below
 * <html>, so a `.dark { --brand: … }` rule higher up the tree could never win
 * against them. The caller already knows which theme is showing.
 */
export function brandVars(brandInput, dark = false) {
  const brand = normaliseHex(brandInput) || DEFAULT_BRAND;
  const ink = readableOn(brand);
  const surface = dark ? DARK_PAPER : LIGHT_PAPER;

  return {
    '--brand': brand,
    '--brand-ink': ink,
    // Transparent for almost every shop. Only a near-black brand on the dark
    // theme, or a near-white one on the light theme, ever draws it.
    '--brand-edge': needsEdge(brand, surface)
      ? `color-mix(in srgb, ${ink} 30%, transparent)`
      : 'transparent',
  };
}

/** Convenience: go straight from a store document to the style object. */
export function storeVars(store, dark = false) {
  return brandVars(resolveBrand(store), dark);
}

/* -------------------------------------------------------------------------- */
/* Layout style choices the owner can make                                    */
/* -------------------------------------------------------------------------- */

/* These mirror the enums in Agent_Store_Schema/page.js. Kept here so the
   editor can render labelled options without hardcoding strings in JSX. */

/* These drive the coloured band at the top of the shop — logo, name, tagline
   and buy buttons. The schema calls the field `heroStyle`; there is no separate
   hero any more, so to the owner it is simply the shop header. */
export const HERO_STYLES = [
  { id: 'default', name: 'Full',    hint: 'Large logo and name, with your tagline underneath. Best for most shops.' },
  { id: 'split',   name: 'Full + delivery', hint: 'Same, plus how fast bundles are moving right now.' },
  { id: 'minimal', name: 'Slim',    hint: 'A short band. Puts your bundles higher up the screen.' },
];


export const NAV_STYLES = [
  { id: 'default',  name: 'Standard', hint: 'Logo left, links right.' },
  { id: 'centered', name: 'Centered', hint: 'Logo in the middle, links underneath.' },
  { id: 'minimal',  name: 'Minimal',  hint: 'Logo and a menu button only.' },
];

/** Only the keys the AgentStore customization sub-schema will actually keep.
 *  Anything else is dropped silently by Mongoose strict mode, so sending it
 *  would make the editor look like it saved when it did not. */
export const SAVEABLE_CUSTOMIZATION_KEYS = [
  'primaryColor',
  'secondaryColor',
  'navStyle',
  'heroStyle',
  'announcementPopupStyle',
  'showPrices',
  'promoEnabled',
  // Newer than the rest: these need the matching additive fields on
  // AgentStore.customization, deployed 2026-08-24. They are written from the
  // agent dashboard's Settings -> Design page, not from this app.
  'heroHeadline',
  'heroSubheadline',
];

export function pickSaveableCustomization(draft = {}) {
  const out = {};
  for (const key of SAVEABLE_CUSTOMIZATION_KEYS) {
    if (draft[key] !== undefined) out[key] = draft[key];
  }
  return out;
}
