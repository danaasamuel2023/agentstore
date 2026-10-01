/**
 * Live-preview plumbing for the dashboard's AI store designer.
 *
 * No React here: middleware.js (edge) imports this too.
 *
 * Protocol (shop page opened as /shop/:slug?designPreview=1 inside an iframe):
 *   shop   -> parent  { type: 'dm-design-ready' }                 on mount
 *   parent -> shop    { type: 'dm-design-preview', design }        any time
 * Messages are only accepted from PREVIEW_ORIGINS, and the design is always run
 * through sanitizeDesign() before it is drawn. Nothing is ever saved.
 */

export const PREVIEW_PARAM = 'designPreview';
export const MSG_READY = 'dm-design-ready';
export const MSG_PREVIEW = 'dm-design-preview';

const DEFAULT_ORIGINS = 'http://localhost:3000,https://www.datamartgh.shop,https://datamartgh.shop,https://beta.datamartgh.shop,https://datamart-v2.vercel.app';

// A plain scheme://host[:port] — anything else is dropped, so a bad env value
// can never inject extra directives into the CSP header built from this list.
const ORIGIN = /^https?:\/\/[a-z0-9.-]+(?::\d{1,5})?$/i;

export const PREVIEW_ORIGINS = (process.env.NEXT_PUBLIC_DESIGN_EDITOR_ORIGINS || DEFAULT_ORIGINS)
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter((s) => ORIGIN.test(s));

export function isPreviewOrigin(origin) {
  return PREVIEW_ORIGINS.includes(origin);
}

/** CSP value for preview responses: framable by the editor, nobody else. */
export function previewFrameAncestors() {
  return `frame-ancestors 'self' ${PREVIEW_ORIGINS.join(' ')}`.trim();
}
