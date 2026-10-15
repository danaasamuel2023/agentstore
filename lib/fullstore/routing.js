/**
 * Full-store routing — databundle.shop and the owners' own domains.
 *
 * This is databundle's middleware.js, moved here unchanged in what it decides
 * (platform rewrite, 30-day referral cookie, ?platform=1, own-domain → slug,
 * platform-only /start-selling + /reseller). One difference: the full store's
 * pages now live under app/(full)/fs/, so every place that used to let a
 * request continue or rewrite it now rewrites to /fs<path>. Redirects still go
 * to the PUBLIC address (no /fs) — the visitor never sees /fs.
 */
import { NextResponse } from 'next/server';

const PLATFORM_SLUG = process.env.NEXT_PUBLIC_PLATFORM_STORE_SLUG || 'databundle';
const COOKIE_NAME = 'db_referring_store';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop';

/** Where the full store's pages live inside this app. */
export const FS_PREFIX = '/fs';

// host → { slug | null, expiresAt }
const HOST_CACHE = new Map();
const HOST_CACHE_TTL_OK_MS = 5 * 60 * 1000;
const HOST_CACHE_TTL_MISS_MS = 60 * 1000;
const HOST_LOOKUP_TIMEOUT_MS = 1500;

/** databundle.shop and its subdomains (anything else on the full side is an own domain). */
export function isDatabundleHost(host) {
  return host === 'databundle.shop' || host === 'www.databundle.shop' || host.endsWith('.databundle.shop');
}

async function resolveCustomHost(host) {
  const now = Date.now();
  const cached = HOST_CACHE.get(host);
  if (cached && cached.expiresAt > now) return cached.slug;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), HOST_LOOKUP_TIMEOUT_MS);
  try {
    const r = await fetch(`${API_BASE}/api/store-portal/public/resolve-host?host=${encodeURIComponent(host)}`, { signal: controller.signal });
    if (r.status === 200) {
      const data = await r.json().catch(() => null);
      const slug = data?.data?.slug || null;
      HOST_CACHE.set(host, { slug, expiresAt: now + HOST_CACHE_TTL_OK_MS });
      return slug;
    }
    if (r.status === 404) {
      HOST_CACHE.set(host, { slug: null, expiresAt: now + HOST_CACHE_TTL_MISS_MS });
      return null;
    }
  } catch (_) {
    // Network/timeout — don't cache, fall through to the default behaviour.
  } finally {
    clearTimeout(t);
  }
  return null;
}

// First path segments the platform tier owns (see databundle's notes: any
// app/[storeSlug]/<foo> the platform reaches without a slug MUST be listed).
const RESERVED_FIRST_SEGMENTS = new Set([
  '', 'login', 'register', 'verify', 'forgot-password', 'reset-password', 'account',
  'wallet', 'become-agent', 'checkout', 'guest', 'start-selling', 'reseller',
]);

// Root-only routes with no per-store version; never rewrite them under a slug.
const PLATFORM_ONLY_PATHS = new Set(['/start-selling', '/reseller']);
function isPlatformOnlyPath(pathname) {
  return PLATFORM_ONLY_PATHS.has(pathname) || pathname.startsWith('/reseller/');
}

/** Serve `path` from the full store's pages (internal rewrite, address bar unchanged). */
function serve(request, path, url = request.nextUrl.clone()) {
  url.pathname = path === '/' ? FS_PREFIX : `${FS_PREFIX}${path}`;
  return NextResponse.rewrite(url);
}

/**
 * @param {Request} request
 * @param {{ host: string, ownDomain: boolean }} where  ownDomain = not databundle.shop
 */
export async function fullStoreRouting(request, { host, ownDomain }) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const firstSeg = pathname.split('/')[1] || '';
  const isReserved = RESERVED_FIRST_SEGMENTS.has(firstSeg);

  // ── Own domain (johnsdata.com …) → that store's pages ───────────────────
  if (ownDomain) {
    if (isPlatformOnlyPath(pathname)) return serve(request, pathname);
    const slug = await resolveCustomHost(host);
    if (slug) {
      if (firstSeg !== slug) return serve(request, pathname === '/' ? `/${slug}` : `/${slug}${pathname}`);
      return serve(request, pathname);
    }
    // Unknown host: fall through to the default routing below.
  }

  // ── ?platform=1 forces the platform tier for this request ───────────────
  if (url.searchParams.has('platform')) {
    url.searchParams.delete('platform');
    if (isReserved) return serve(request, pathname === '/' ? `/${PLATFORM_SLUG}` : `/${PLATFORM_SLUG}${pathname}`, url);
    return NextResponse.redirect(url);
  }

  // ── Case A: reserved platform path (no store slug in the address) ────────
  if (isReserved) {
    const referring = request.cookies.get(COOKIE_NAME)?.value;

    // Recovery from the old poisoned "/login → /become-agent/login" chain.
    if (referring && referring === firstSeg && pathname !== `/${firstSeg}`) {
      url.pathname = pathname.slice(firstSeg.length + 1) || '/';
      const response = NextResponse.redirect(url);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const cookieValid = referring && referring !== PLATFORM_SLUG
      && !RESERVED_FIRST_SEGMENTS.has(referring) && SLUG_PATTERN.test(referring);
    const isPlatformOnly = isPlatformOnlyPath(pathname);

    if (cookieValid && !isPlatformOnly) {
      url.pathname = pathname === '/' ? `/${referring}` : `/${referring}${pathname}`;
      return NextResponse.redirect(url);
    }
    if (isPlatformOnly) {
      const response = serve(request, pathname);
      if (referring && !cookieValid) response.cookies.delete(COOKIE_NAME);
      return response;
    }
    const response = serve(request, pathname === '/' ? `/${PLATFORM_SLUG}` : `/${PLATFORM_SLUG}${pathname}`);
    if (referring && !cookieValid) response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // ── Case B: a store-slug path. Remember the store for 30 days. ───────────
  if (firstSeg && firstSeg !== PLATFORM_SLUG && !RESERVED_FIRST_SEGMENTS.has(firstSeg) && SLUG_PATTERN.test(firstSeg)) {
    const remainder = pathname.slice(firstSeg.length + 1) || '/';
    if (remainder === '/start-selling' || remainder === '/reseller' || remainder.startsWith('/reseller/')) {
      url.pathname = remainder;
      return NextResponse.redirect(url);
    }
    const current = request.cookies.get(COOKIE_NAME)?.value;
    const response = serve(request, pathname);
    if (current !== firstSeg) {
      response.cookies.set({ name: COOKIE_NAME, value: firstSeg, maxAge: COOKIE_MAX_AGE, sameSite: 'lax', path: '/', httpOnly: false });
    }
    return response;
  }

  return serve(request, pathname);
}
