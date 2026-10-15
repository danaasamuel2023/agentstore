/**
 * Slug-aware link builder.
 *
 * The platform tier (databundle.shop owned by DataMart) lives under a
 * reserved slug like `cheapdata`, but visitors should see clean URLs:
 *   /login, /register, /account — not /cheapdata/login etc.
 *
 * Agent stores keep the slug prefix: /kwame-data/login, /kwame-data/account.
 *
 * Use storeHref(slug, path) anywhere we'd previously inline-template
 * `/${slug}${path}` — it picks the right shape automatically.
 *
 *   storeHref('cheapdata', '/login')   → '/login'    (platform)
 *   storeHref('cheapdata', '')         → '/'
 *   storeHref('kwame-data', '/login')  → '/kwame-data/login'
 *   storeHref('kwame-data', '')        → '/kwame-data'
 */

const PLATFORM_SLUG =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_STORE_SLUG) ||
  'databundle';

export function isPlatformSlug(slug) {
  return slug === PLATFORM_SLUG;
}

export function storeHref(slug, path = '') {
  if (!slug) return path || '/';
  if (slug === PLATFORM_SLUG) {
    return path || '/';
  }
  return `/${slug}${path}`;
}

export function getPlatformSlug() {
  return PLATFORM_SLUG;
}
