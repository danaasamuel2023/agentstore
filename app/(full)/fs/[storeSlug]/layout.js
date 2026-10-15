/**
 * Server-side fetch of the store context so every route under /[storeSlug]
 * has the storeName, theme, status etc. available immediately on first paint
 * — no client-side spinner just to render the brand.
 *
 * If the store doesn't exist or isn't fullstore-eligible, surface a clean
 * 404 with a path back to the landing page.
 */

import { TopNav } from '@/components/fullstore/TopNav';
import { Footer } from '@/components/fullstore/Footer';
import { StoreShell } from '@/components/fullstore/StoreShell';
import Link from 'next/link';
import { isPlatformSlug } from '@/lib/fullstore/links';
import { savedDesign, designCss, fontHref, darkBootScript } from '@/lib/fullstore/storeDesign';
import { DesignPreviewListener } from '@/components/fullstore/StoreDesign';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop';

// Synthetic context for the platform tier. The real row is bootstrapped on
// the backend on first /store/context request, but until that round-trip
// completes (cold start, network blip, build-time render) we still want
// the storefront to render with the DataBundle brand — never a 404.
const PLATFORM_FALLBACK = {
  storeName: 'DataBundle',
  storeDescription: 'The fastest way to buy data in Ghana.',
  storeType: 'fullstore',
  status: 'active',
  isPlatformStore: true
};

/** The store's logo when it is an https link (owners paste links from many
 *  image hosts; one that does not load falls back to the store's initial). */
function safeLogo(url) {
  try {
    const u = new URL(String(url || ''));
    return u.protocol === 'https:' && u.toString().length <= 600 ? u.toString() : null;
  } catch { return null; }
}

async function fetchStoreContext(slug) {
  try {
    const res = await fetch(`${API_BASE}/api/store-portal/store/context`, {
      headers: { 'X-Store-Slug': slug },
      next: { revalidate: 60 }
    });
    if (!res.ok) {
      return isPlatformSlug(slug) ? PLATFORM_FALLBACK : null;
    }
    const data = await res.json();
    return data?.data || (isPlatformSlug(slug) ? PLATFORM_FALLBACK : null);
  } catch {
    return isPlatformSlug(slug) ? PLATFORM_FALLBACK : null;
  }
}

export async function generateMetadata({ params }) {
  const { storeSlug } = await params;
  const store = await fetchStoreContext(storeSlug);
  if (!store) return { title: 'Store not found' };
  // A store with its own design is its own brand: no "· DataBundle" in the tab.
  const own = !isPlatformSlug(storeSlug) && !!savedDesign(store);
  return {
    title: own ? { absolute: store.storeName } : store.storeName,
    description: store.storeDescription || `Buy MTN, Telecel and AirtelTigo bundles on ${store.storeName}.`
  };
}

export default async function StoreLayout({ children, params }) {
  const { storeSlug } = await params;
  const store = await fetchStoreContext(storeSlug);

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-4">🤔</div>
            <h1 className="text-3xl font-black mb-2">We couldn't find that store</h1>
            <p className="text-[color:var(--ink-mute)] mb-6 text-[14px]">
              Nothing lives at <code className="bg-[color:var(--surface-2)] px-1.5 py-0.5 rounded text-[12px]">/{storeSlug}</code> — the link may be wrong or the store may have closed.
              You can still shop directly with us.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {/* ?platform=1 tells middleware to bypass any sticky agent
                 referral cookie for this one request, so visitors with a
                 stale slug can actually reach the platform tier. */}
              <Link href="/?platform=1" className="btn btn-yellow">Shop on DataBundle</Link>
              <Link href="/?platform=1" className="btn btn-ghost">Find a different store</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // The owner's own design (saved from the DataMart dashboard). None saved →
  // nothing added, and the store looks exactly as it always has.
  const design = isPlatformSlug(storeSlug) ? null : savedDesign(store);
  const font = design ? fontHref(design.font) : null;
  const dark = design ? darkBootScript(design) : null;

  return (
    <>
      {design && <style id="dm-design" dangerouslySetInnerHTML={{ __html: designCss(design) }} />}
      {font && <link rel="stylesheet" href={font} />}
      {dark && <script dangerouslySetInnerHTML={{ __html: dark }} />}
      <DesignPreviewListener />
      <StoreShell
        storeSlug={storeSlug}
        storeName={store.storeName}
        ownBrand={design ? { name: store.storeName, logo: safeLogo(store.storeLogo) } : null}
      >
        {children}
      </StoreShell>
    </>
  );
}
