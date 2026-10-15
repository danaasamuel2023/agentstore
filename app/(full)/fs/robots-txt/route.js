/**
 * robots.txt for the full-store addresses — databundle.shop and the owners'
 * own domains. middleware.js sends /robots.txt here for those hosts; the
 * simple site (cheapdata.shop) keeps app/robots.js.
 *
 * Store pages are open to search engines. A customer's own pages (account,
 * wallet, checkout, payment returns, owner login) and the API are not.
 */
export const dynamic = 'force-dynamic';

const PRIVATE = ['/api/', '/fs/', '/account', '/wallet', '/checkout', '/guest', '/verify', '/reset-password', '/forgot-password', '/owner'];

export function GET(request) {
  const host = (request.headers.get('host') || 'www.databundle.shop').toLowerCase().split(':')[0];
  const lines = ['User-Agent: *', 'Allow: /'];
  for (const p of PRIVATE) {
    lines.push(`Disallow: ${p}`);
    // The same pages under a store's address: /<store>/account …
    if (p !== '/api/' && p !== '/fs/') lines.push(`Disallow: /*${p}`);
  }
  lines.push('', `Sitemap: https://${host}/sitemap.xml`, '');
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
