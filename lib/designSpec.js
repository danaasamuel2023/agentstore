/**
 * Store design spec — v1.  ONE contract shared by three codebases:
 *   server    DataMart/server/services/storeDesignSpec.js   (CommonJS copy)
 *   storefront agentstore/lib/designSpec.js                  (this file)
 *   dashboard DataMart-v2/lib/store/designSpec.js            (this file)
 * Edit it here, then copy to all three. Bump DESIGN_VERSION on a breaking change.
 *
 * The AI store designer NEVER writes code. It picks values from this menu, and
 * sanitizeDesign() is run on the server before anything is saved AND on the
 * storefront before anything is drawn. Unknown keys are dropped, enums are
 * enforced, colours must be hex, text is length-capped and stripped of markup
 * and links. There is deliberately no CSS / HTML / script / URL field: a
 * design cannot inject anything, collect anything, or send a buyer anywhere.
 */

export const DESIGN_VERSION = 1;

/* ── The menu ─────────────────────────────────────────────────────────────── */

export const OPTIONS = {
  mode:          ['light', 'dark'],
  font:          ['figtree', 'inter', 'poppins', 'dm-sans', 'outfit', 'space-grotesk', 'playfair', 'nunito'],
  radius:        ['sharp', 'soft', 'round'],
  heroStyle:     ['default', 'split', 'minimal'],          // existing enum (Full / Full + delivery / Slim)
  heroPattern:   ['dots', 'grid', 'waves', 'none'],
  heroAlign:     ['left', 'center'],
  navStyle:      ['default', 'centered', 'minimal'],        // existing enum
  productLayout: ['cards', 'grid', 'compact', 'list'],      // maps to packageDisplayStyle
  buttonStyle:   ['solid', 'outline', 'pill'],
  density:       ['comfortable', 'compact'],
  sections:      ['delivery', 'popular', 'networks', 'promises', 'faq', 'contact'],
};

/* Google Fonts the storefront is allowed to load (family, weights). */
export const FONTS = {
  figtree:         { label: 'Figtree',          family: 'Figtree',          weights: '400;500;600;700;800' },
  inter:           { label: 'Inter',            family: 'Inter',            weights: '400;500;600;700;800' },
  poppins:         { label: 'Poppins',          family: 'Poppins',          weights: '400;500;600;700;800' },
  'dm-sans':       { label: 'DM Sans',          family: 'DM Sans',          weights: '400;500;600;700;800' },
  outfit:          { label: 'Outfit',           family: 'Outfit',           weights: '400;500;600;700;800' },
  'space-grotesk': { label: 'Space Grotesk',    family: 'Space Grotesk',    weights: '400;500;600;700' },
  playfair:        { label: 'Playfair Display', family: 'Playfair Display', weights: '500;600;700;800' },
  nunito:          { label: 'Nunito',           family: 'Nunito',           weights: '400;600;700;800' },
};

export const LIMITS = {
  headline: 70,        // matches AgentStore.customization.heroHeadline maxlength
  subheadline: 140,    // matches heroSubheadline maxlength
  promiseTitle: 40,
  promiseBody: 160,
  promises: 3,
  faqQ: 90,
  faqA: 280,
  faqs: 6,
  ctaLabel: 24,
};

export const DEFAULT_DESIGN = {
  v: DESIGN_VERSION,
  brand: '#0E7C5A',
  accent: null,               // null = derived from brand
  mode: 'light',
  font: 'inter',               // what every shop renders today
  radius: 'soft',
  heroStyle: 'default',
  heroPattern: 'dots',
  heroAlign: 'left',
  headline: '',
  subheadline: '',
  ctaLabel: '',
  navStyle: 'default',
  productLayout: 'cards',
  buttonStyle: 'solid',
  density: 'comfortable',
  whatsappFloat: false,
  sections: [
    { id: 'delivery', on: true },
    { id: 'popular', on: true },
    { id: 'networks', on: true },
    { id: 'promises', on: true },
    { id: 'faq', on: false },
    { id: 'contact', on: true },
  ],
  promises: [],               // [] = the storefront's built-in three
  faq: [],
};

/* ── Sanitiser ────────────────────────────────────────────────────────────── */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function cleanHex(v) {
  if (typeof v !== 'string' || !HEX.test(v.trim())) return null;
  let h = v.trim().replace('#', '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return `#${h}`;
}

/* Brand-safety: text a shop must never show. A storefront that asks for a MoMo
   PIN or poses as the network or a bank is a phishing page with our name on it. */
const BLOCKED_TEXT = [
  /\bpin\b/i, /\bpassword\b/i, /\botp\b/i, /verification code/i, /\bcvv\b/i,
  /card number/i, /send (?:us )?(?:your )?(?:momo|money)/i,
  /official\s+(?:mtn|telecel|airteltigo|at|vodafone)/i,
  /(?:mtn|telecel|airteltigo|vodafone)\s+(?:ghana\s+)?(?:official|headquarters|head office)/i,
  /\b(?:bank of ghana|ecobank|gcb|stanbic|absa|fidelity bank|calbank)\b/i,
];

export function blockedReason(text) {
  const t = String(text || '');
  return BLOCKED_TEXT.some((re) => re.test(t)) ? 'blocked' : null;
}

/** Plain text only: no tags, no links, no control chars, single-spaced, capped. */
export function cleanText(v, max) {
  if (typeof v !== 'string') return '';
  let s = v
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')    // whole script/style blocks
    .replace(/<[^>]*>/g, ' ')                                  // any other markup
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, ' ')              // links
    .replace(/\b[\w.-]+\.(?:com|net|org|shop|gh|io|xyz|link|site)\b\S*/gi, ' ')  // bare domains
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '').trim() || s.slice(0, max);
  if (blockedReason(s)) return '';
  return s;
}

const pick = (v, list, fallback) => (list.includes(v) ? v : fallback);

/**
 * Returns a complete, safe design. Never throws. `input` may be anything
 * (AI output, a stored document, a tampered request body).
 */
export function sanitizeDesign(input, base = DEFAULT_DESIGN) {
  const d = input && typeof input === 'object' ? input : {};
  const b = { ...DEFAULT_DESIGN, ...(base && typeof base === 'object' ? base : {}) };
  const O = OPTIONS;

  const sectionsIn = Array.isArray(d.sections) ? d.sections : b.sections;
  const seen = new Set();
  const sections = [];
  for (const s of sectionsIn) {
    const id = typeof s === 'string' ? s : s?.id;
    if (!O.sections.includes(id) || seen.has(id)) continue;
    seen.add(id);
    sections.push({ id, on: typeof s === 'string' ? true : s?.on !== false });
  }
  // Sections the input didn't mention keep the base design's on/off state, so
  // "turn on the FAQ" doesn't switch every other section off.
  const baseOn = new Map((Array.isArray(b.sections) ? b.sections : DEFAULT_DESIGN.sections)
    .map((s) => [typeof s === 'string' ? s : s?.id, typeof s === 'string' ? true : s?.on !== false]));
  for (const id of O.sections) if (!seen.has(id)) sections.push({ id, on: baseOn.has(id) ? baseOn.get(id) : false });

  const promisesIn = Array.isArray(d.promises) ? d.promises : b.promises;
  const promises = promisesIn
    .map((p) => ({ title: cleanText(p?.title, LIMITS.promiseTitle), body: cleanText(p?.body, LIMITS.promiseBody) }))
    .filter((p) => p.title && p.body)
    .slice(0, LIMITS.promises);

  const faqIn = Array.isArray(d.faq) ? d.faq : b.faq;
  const faq = faqIn
    .map((f) => ({ q: cleanText(f?.q, LIMITS.faqQ), a: cleanText(f?.a, LIMITS.faqA) }))
    .filter((f) => f.q && f.a)
    .slice(0, LIMITS.faqs);

  const has = (k) => Object.prototype.hasOwnProperty.call(d, k);

  return {
    v: DESIGN_VERSION,
    brand: cleanHex(d.brand) || cleanHex(b.brand) || DEFAULT_DESIGN.brand,
    accent: has('accent') ? (d.accent === null ? null : cleanHex(d.accent)) : cleanHex(b.accent),
    mode: pick(d.mode, O.mode, pick(b.mode, O.mode, 'light')),
    font: pick(d.font, O.font, pick(b.font, O.font, 'inter')),
    radius: pick(d.radius, O.radius, pick(b.radius, O.radius, 'soft')),
    heroStyle: pick(d.heroStyle, O.heroStyle, pick(b.heroStyle, O.heroStyle, 'default')),
    heroPattern: pick(d.heroPattern, O.heroPattern, pick(b.heroPattern, O.heroPattern, 'dots')),
    heroAlign: pick(d.heroAlign, O.heroAlign, pick(b.heroAlign, O.heroAlign, 'left')),
    headline: has('headline') ? cleanText(d.headline, LIMITS.headline) : cleanText(b.headline, LIMITS.headline),
    subheadline: has('subheadline') ? cleanText(d.subheadline, LIMITS.subheadline) : cleanText(b.subheadline, LIMITS.subheadline),
    ctaLabel: has('ctaLabel') ? cleanText(d.ctaLabel, LIMITS.ctaLabel) : cleanText(b.ctaLabel, LIMITS.ctaLabel),
    navStyle: pick(d.navStyle, O.navStyle, pick(b.navStyle, O.navStyle, 'default')),
    productLayout: pick(d.productLayout, O.productLayout, pick(b.productLayout, O.productLayout, 'cards')),
    buttonStyle: pick(d.buttonStyle, O.buttonStyle, pick(b.buttonStyle, O.buttonStyle, 'solid')),
    density: pick(d.density, O.density, pick(b.density, O.density, 'comfortable')),
    whatsappFloat: has('whatsappFloat') ? d.whatsappFloat === true : b.whatsappFloat === true,
    sections,
    promises,
    faq,
  };
}

/**
 * The existing flat customization fields the current storefront already reads.
 * Saving writes these too, so a store looks right even on a storefront build
 * that predates `customization.design`.
 */
export function legacyFields(design) {
  const d = sanitizeDesign(design);
  const layoutMap = { cards: 'cards', grid: 'grid', compact: 'compact', list: 'list' };
  return {
    primaryColor: d.brand,
    ...(d.accent ? { secondaryColor: d.accent } : {}),
    heroStyle: d.heroStyle,
    navStyle: d.navStyle,
    packageDisplayStyle: layoutMap[d.productLayout] || 'default',
    heroHeadline: d.headline || undefined,
    heroSubheadline: d.subheadline || undefined,
  };
}

/** Build a design from a store that has only the legacy flat fields. */
export function designFromStore(store) {
  const c = store?.customization || {};
  if (c.design && typeof c.design === 'object') return sanitizeDesign(c.design);
  return sanitizeDesign({
    brand: c.primaryColor,
    accent: c.secondaryColor && c.secondaryColor !== '#dc004e' ? c.secondaryColor : null,
    heroStyle: c.heroStyle,
    navStyle: c.navStyle,
    productLayout: ['cards', 'grid', 'compact', 'list'].includes(c.packageDisplayStyle) ? c.packageDisplayStyle : 'cards',
    headline: c.heroHeadline || '',
    subheadline: c.heroSubheadline || '',
    whatsappFloat: true,        // legacy shops always show the floating button
  });
}
