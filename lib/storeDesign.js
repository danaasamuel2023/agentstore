'use client';

/**
 * Store design → what the shop actually renders. The ONE place that turns a
 * design (lib/designSpec.js) into CSS variables, data-attributes and props.
 *
 * LEGACY vs DESIGNED
 * A store whose document has no `customization.design` object is "legacy" and
 * renders exactly as it did before the AI designer existed:
 *   - brand colour through storeVars() (unchanged code path)
 *   - Inter (the next/font already loaded by app/layout.js), today's radii
 *   - Popular bundles as the colour tiles, standard nav, solid buttons
 *   - the WhatsApp float shown whenever the shop has a number
 *   - legacy flat fields that the storefront deliberately ignores today
 *     (packageDisplayStyle, navStyle, heroSubheadline) stay ignored
 * Only a store that has saved a design — or the editor's live preview — gets
 * the new keys. That is what keeps every existing shop pixel-identical.
 */

import { createContext, useContext } from 'react';
import { sanitizeDesign, designFromStore, FONTS } from './designSpec';
import { brandVars, storeVars } from './storeTheme';

const DesignContext = createContext({ design: designFromStore(null), legacy: true, preview: false });

export const StoreDesignProvider = DesignContext.Provider;
export const useStoreDesign = () => useContext(DesignContext);

/** Which design to draw, and whether the store is legacy. */
export function resolveDesign(store, previewDesign) {
  if (previewDesign) return { design: sanitizeDesign(previewDesign), legacy: false };
  const saved = store?.customization?.design;
  if (saved && typeof saved === 'object') return { design: sanitizeDesign(saved), legacy: false };
  const d = designFromStore(store);
  return {
    legacy: true,
    design: {
      ...d,
      font: 'inter',            // today's face
      navStyle: 'default',      // stored navStyle was never wired
      productLayout: 'cards',   // stored packageDisplayStyle is ignored on purpose
      subheadline: '',          // never rendered before
      buttonStyle: 'solid',
      radius: 'soft',
      density: 'comfortable',
      heroPattern: 'dots',
      heroAlign: 'left',
      mode: 'light',            // = visitor's own preference, as today
      whatsappFloat: true,      // the float was unconditional
    },
  };
}

/* Radius presets. 'soft' is today's globals.css and sets nothing. */
const RADII = {
  sharp: { '--r-xs': '2px', '--r-sm': '3px', '--r-md': '4px', '--r-lg': '5px', '--radius-xl': '6px', '--radius-2xl': '8px' },
  round: { '--r-xs': '8px', '--r-sm': '12px', '--r-md': '16px', '--r-lg': '20px', '--radius-xl': '22px', '--radius-2xl': '26px' },
};

/** Stack for a whitelisted font. Inter is already loaded by next/font. */
export function fontStack(fontId) {
  const fallback = 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  if (!fontId || fontId === 'inter' || !FONTS[fontId]) return fallback;
  return `"${FONTS[fontId].family}", ${fallback}`;
}

/** Google Fonts stylesheet for a whitelisted font, or null (Inter / unknown). */
export function fontHref(fontId) {
  const f = FONTS[fontId];
  if (!f || fontId === 'inter') return null;
  const family = f.family.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${f.weights}&display=swap`;
}

/** Inline style for the shop wrapper. */
export function designVars(store, { design, legacy }, dark) {
  if (legacy) return storeVars(store, dark);           // byte-for-byte the old path
  const vars = { ...brandVars(design.brand, dark) };
  vars['--accent'] = design.accent || 'color-mix(in srgb, var(--brand) 78%, var(--ink))';
  Object.assign(vars, RADII[design.radius] || {});
  vars['--shop-font'] = fontStack(design.font);
  vars.fontFamily = 'var(--shop-font)';
  return vars;
}

/** data-* hooks read by the rules in globals.css (none for legacy stores). */
export function designAttrs({ design, legacy }) {
  if (legacy) return {};
  return {
    'data-buttons': design.buttonStyle,
    'data-density': design.density,
    'data-radius': design.radius,
  };
}

/** Is a section switched on? (legacy → today's fixed set) */
export function sectionOrder(design) {
  return (design.sections || []).filter((s) => s.on).map((s) => s.id);
}
