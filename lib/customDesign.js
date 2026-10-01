/**
 * Shared custom design (from the website builder) — the PURE half.
 * No React, no fs: imported by server pages AND by StoreLayoutClient.
 *
 * The builder API serves a store's published design (or, with a signed
 * preview token, its draft). Everything it sends is validated here before the
 * storefront uses it, and anything unexpected degrades to "no custom design"
 * — the classic look — never to a broken shop.
 *
 *   validateCustomDesign(raw, slug) → design | null
 *   customThemeDesign(design)       → a design object for lib/storeDesign's
 *                                     resolveDesign() (theme the WHOLE store)
 *   customNavLinks(design, slug)    → SiteNav-shaped links [{ path, label, Icon }]
 */
import { House, ShoppingBag, Package, FileText, GraduationCap, Info, Link as LinkIcon } from 'lucide-react';
import { sanitizeDesign } from './designSpec';

export const BUILDER_PUBLIC = 'https://api.quickdatashop.com';
export const SITE_PREVIEW_PARAM = 'sitePreview';

const VAR_KEYS = ['--brand', '--brand-ink', '--accent', '--accent-ink', '--font', '--r-sm', '--r-md', '--r-lg'];
const SAFE_VAR_VALUE = /^[#a-zA-Z0-9 .,'"()%_-]{1,160}$/;
const PAGE_KEY = /^\/[a-z0-9-]{0,40}$/;
const MAX_HTML = 600 * 1024;

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

/** https URL on one of the allowed hosts, else null. */
function safeUrl(v, hosts) {
  if (typeof v !== 'string') return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && hosts.includes(u.hostname) ? u.toString() : null;
  } catch { return null; }
}

/** A nav/cta href the storefront will follow: this shop's own pages, WhatsApp or phone. */
function safeHref(v, slug) {
  if (typeof v !== 'string') return null;
  const base = `/shop/${slug}`;
  if (v === base || v.startsWith(`${base}/`) || v.startsWith(`${base}?`) || v.startsWith(`${base}#`)) {
    return /^[/a-zA-Z0-9._~?&=#%-]+$/.test(v) ? v : null;
  }
  if (/^https:\/\/wa\.me\/\d{6,15}(\?[a-zA-Z0-9=&%+._-]*)?$/.test(v)) return v;
  if (/^tel:\+?\d{6,15}$/.test(v)) return v;
  return null;
}

/** Validates the API's design. Returns a clean object or null (→ classic look). */
export function validateCustomDesign(raw, slug) {
  if (!raw || typeof raw !== 'object' || !/^[a-z0-9-]{1,100}$/i.test(String(slug || ''))) return null;
  const t = raw.theme && typeof raw.theme === 'object' ? raw.theme : {};

  const vars = {};
  if (raw.vars && typeof raw.vars === 'object') {
    for (const k of VAR_KEYS) {
      const v = raw.vars[k];
      if (typeof v === 'string' && SAFE_VAR_VALUE.test(v) && !/url\s*\(|expression|javascript/i.test(v)) vars[k] = v;
    }
  }

  const pages = {};
  if (raw.pages && typeof raw.pages === 'object') {
    for (const [key, p] of Object.entries(raw.pages).slice(0, 20)) {
      if (!PAGE_KEY.test(key) || !p || typeof p.html !== 'string' || p.html.length > MAX_HTML) continue;
      pages[key] = { title: str(p.title, 80), description: str(p.description, 200), html: p.html };
    }
  }

  // data-* hooks for the scoped block CSS (.dm-site[data-buttons=…] etc.) —
  // exactly these keys, exactly these values.
  const ATTR_VALUES = { 'data-mode': ['light', 'dark'], 'data-radius': ['sharp', 'soft', 'round'], 'data-buttons': ['solid', 'outline', 'pill'] };
  const attrs = {};
  if (raw.attrs && typeof raw.attrs === 'object') {
    for (const [k, allowed] of Object.entries(ATTR_VALUES)) if (allowed.includes(raw.attrs[k])) attrs[k] = raw.attrs[k];
  }

  const link = (l) => {
    const href = safeHref(l?.href, slug);
    const label = str(l?.label, 40).trim();
    return href && label ? { label, href } : null;
  };

  return {
    version: Number.isFinite(Number(raw.version)) ? Number(raw.version) : 0,
    publishedAt: str(raw.publishedAt, 40) || null,
    theme: {
      brand: str(t.brand, 9), accent: t.accent == null ? null : str(t.accent, 9),
      mode: t.mode === 'dark' ? 'dark' : 'light',
      font: str(t.font, 20), radius: str(t.radius, 10), buttonStyle: str(t.buttonStyle, 10),
    },
    vars,
    attrs,
    fontHref: safeUrl(raw.fontHref, ['fonts.googleapis.com']),
    cssUrl: safeUrl(raw.cssUrl, ['api.quickdatashop.com']),
    logoUrl: safeUrl(raw.logoUrl, ['api.quickdatashop.com']),
    nav: (Array.isArray(raw.nav) ? raw.nav : []).map(link).filter(Boolean).slice(0, 8),
    cta: raw.cta ? link(raw.cta) : null,
    pages,
  };
}

/**
 * The custom theme as a lib/designSpec design, so it flows through the SAME
 * code path a saved customization.design uses (designVars / designAttrs /
 * fontHref) and every system page — products, checkout, checkers, spin, join,
 * orders — picks up the colours, font, corners, buttons and light/dark mode.
 */
export function customThemeDesign(custom) {
  if (!custom) return null;
  const t = custom.theme;
  return sanitizeDesign({
    brand: t.brand,
    accent: t.accent,
    mode: t.mode,
    font: t.font,
    radius: t.radius,
    buttonStyle: t.buttonStyle,
    whatsappFloat: true,       // the store's WhatsApp button stays as it is today
  });
}

function iconFor(path) {
  if (path === '') return House;
  if (path.startsWith('/products')) return ShoppingBag;
  if (path.startsWith('/orders')) return Package;
  if (path.startsWith('/checkers')) return GraduationCap;
  if (path.startsWith('/about')) return Info;
  if (path.startsWith('/p/')) return FileText;
  return LinkIcon;
}

/** SiteNav/footer links ({ path, label, Icon }) from the design's own menu. Only
 *  this shop's pages — WhatsApp/phone entries stay in the store's own contact UI. */
export function customNavLinks(custom, slug) {
  if (!custom?.nav?.length) return null;
  const base = `/shop/${slug}`;
  const out = [];
  for (const l of custom.nav) {
    if (!l.href.startsWith(base)) continue;
    const path = l.href.slice(base.length).replace(/\/$/, '');
    if (out.some((x) => x.path === path)) continue;
    out.push({ path, label: l.label, Icon: iconFor(path.split('?')[0]) });
  }
  return out.length ? out : null;
}

/**
 * What the store SHELL (layout: nav, footer, theme) needs — everything except
 * the pages' HTML. The layout is serialized into every page's payload, so
 * passing whole pages there would ship the home page's markup with every
 * products/checkout page.
 */
export function customShell(design) {
  if (!design) return null;
  const pages = {};
  for (const [k, p] of Object.entries(design.pages || {})) pages[k] = { title: p.title };
  return { ...design, pages };
}

/** Token from the page URL (?sitePreview=…), validated, or null. */
export function cleanPreviewToken(v) {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && /^[A-Za-z0-9._-]{10,600}$/.test(s) ? s : null;
}
