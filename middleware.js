import { NextResponse } from 'next/server';
import { PREVIEW_PARAM, previewFrameAncestors } from './lib/designPreview';

/**
 * Lets the dashboard's AI store designer / website builder frame a shop page
 * for its live preview — and ONLY when the page is asked for in preview mode. Every other
 * response is passed through untouched (no headers added or removed).
 */
export function middleware(request) {
  const sp = request.nextUrl.searchParams;
  // ?designPreview=1 (AI store designer) or ?sitePreview=<token> (website
  // builder's shared design) — both are editor previews and may be framed.
  if (sp.get(PREVIEW_PARAM) !== '1' && !sp.get('sitePreview')) return NextResponse.next();
  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', previewFrameAncestors());
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: '/shop/:path*',
};
