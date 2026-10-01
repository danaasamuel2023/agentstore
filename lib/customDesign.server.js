/**
 * Shared custom design — the SERVER half: fetch from the builder API.
 *
 * Published designs are cached for 60s (ISR, matching the API's max-age).
 * Draft designs (editor preview, signed token) are never cached.
 * ANY failure — timeout (3s), non-200, bad JSON, bad shape — returns null and
 * the store renders its classic look. A builder outage must never break a shop.
 *
 * Dev escape: DEV_CUSTOM_DESIGN_FIXTURE=<path to JSON> (non-production only)
 * returns that file's `design` instead of calling the API, so the custom render
 * path can be tested locally.
 */
import { BUILDER_PUBLIC, validateCustomDesign } from './customDesign';

const TIMEOUT_MS = 3000;

export async function fetchCustomDesign(slug, previewToken = null) {
  if (!/^[a-z0-9-]{1,100}$/i.test(String(slug || ''))) return null;

  if (process.env.NODE_ENV !== 'production' && process.env.DEV_CUSTOM_DESIGN_FIXTURE) {
    try {
      const { readFile } = await import('node:fs/promises');
      const j = JSON.parse(await readFile(process.env.DEV_CUSTOM_DESIGN_FIXTURE, 'utf8'));
      return validateCustomDesign(j?.design ?? j, slug);
    } catch {
      return null;
    }
  }

  const url = `${BUILDER_PUBLIC}/v1/public/stores/${encodeURIComponent(slug)}/design${previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ''}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
      ...(previewToken ? { cache: 'no-store' } : { next: { revalidate: 60 } }),
    });
    if (res.status !== 200) return null;
    const data = await res.json();
    if (!data?.ok || !data.design) return null;
    return validateCustomDesign(data.design, slug);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
