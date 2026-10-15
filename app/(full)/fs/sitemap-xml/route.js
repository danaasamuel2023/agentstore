/**
 * sitemap.xml for the full-store addresses (see robots-txt/route.js).
 * An own domain is one store, so its sitemap is that store's front page;
 * databundle.shop lists its own front page.
 */
export const dynamic = 'force-dynamic';

export function GET(request) {
  const host = (request.headers.get('host') || 'www.databundle.shop').toLowerCase().split(':')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://${host}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
