import { NextResponse } from 'next/server';
import { PREVIEW_PARAM, previewFrameAncestors } from './lib/designPreview';
import { fullStoreRouting, isDatabundleHost, FS_PREFIX } from './lib/fullstore/routing';

/**
 * One website, two kinds of store — decided by the address:
 *
 *   cheapdata.shop (+ www)          simple stores, app/(simple)/… — unchanged
 *   databundle.shop, own domains    full stores,   app/(full)/fs/…
 *
 * Simple-store requests are passed through exactly as before; the only thing
 * this file ever added to them is the editor-preview header below.
 *
 * Testing a full store on a preview build (*.vercel.app, localhost): open any
 * page with ?site=full once — a cookie then makes that browser see the preview
 * as databundle.shop (?site=simple switches back). Only on those hosts.
 */

const SIMPLE_HOSTS = new Set(['cheapdata.shop', 'www.cheapdata.shop']);
const SITE_COOKIE = 'dm_site';

function isTestHost(host) {
  return host === 'localhost' || host.startsWith('127.0.0.1') || host.startsWith('192.168.') || host.endsWith('.vercel.app');
}

/** Editor previews (AI designer / website builder) may be framed by the dashboard. */
function withPreviewHeaders(request, res) {
  const sp = request.nextUrl.searchParams;
  if (sp.get(PREVIEW_PARAM) !== '1' && !sp.get('sitePreview')) return res;
  res.headers.set('Content-Security-Policy', previewFrameAncestors());
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  const { pathname, searchParams } = request.nextUrl;

  // Which kind of site is this address?
  let full;
  let setSite = null;
  if (SIMPLE_HOSTS.has(host)) full = false;
  else if (isTestHost(host)) {
    const ask = searchParams.get('site');
    if (ask === 'full' || ask === 'simple') setSite = ask;
    full = (setSite || request.cookies.get(SITE_COOKIE)?.value) === 'full';
  } else full = true; // databundle.shop, *.databundle.shop, or an owner's own domain

  if (!full) {
    // The full store's internal pages are never reachable on the simple site.
    if (pathname === FS_PREFIX || pathname.startsWith(`${FS_PREFIX}/`)) {
      return new NextResponse('Not found', { status: 404 });
    }
    const res = withPreviewHeaders(request, NextResponse.next());
    if (setSite) res.cookies.set({ name: SITE_COOKIE, value: setSite, path: '/', sameSite: 'lax' });
    return res;
  }

  const res = await fullStoreRouting(request, { host, ownDomain: !isDatabundleHost(host) && !isTestHost(host) });
  if (setSite) res.cookies.set({ name: SITE_COOKIE, value: setSite, path: '/', sameSite: 'lax' });
  return withPreviewHeaders(request, res);
}

export const config = {
  // Everything except Next internals, API routes, the /hero folder and files
  // (favicon.svg, robots.txt, images…) — the same as databundle's matcher.
  matcher: ['/((?!_next|api|hero|.*\\.[^/]+$).*)'],
};
