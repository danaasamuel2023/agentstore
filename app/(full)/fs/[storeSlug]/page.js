/**
 * Store home — the storefront's landing page for a specific store slug.
 *
 * Server-renders the catalog so the page is meaningful on first paint, then
 * hydrates with client interactivity (auth-aware quick-buy, live ticker).
 *
 * Hero photo slots:
 *   /public/hero/cash.jpg     — stack of cedis / MoMo cash-out vibe
 *   /public/hero/reseller.jpg — a smiling Ghanaian customer / reseller
 *   /public/hero/payout.jpg   — phone screen showing a MoMo notification
 *   /public/hero/avatar-1..3.jpg — small face avatars for testimonials
 *
 * If any of those files don't exist yet, the HeroPhoto component falls back
 * to a polished branded placeholder, so the page still looks finished.
 * Drop in real photos and they slot straight in — no other code changes.
 */

import { StoreBundleGrid } from '@/components/fullstore/StoreBundleGrid';
import { DeliveryEtaBanner } from '@/components/fullstore/DeliveryEta';
import { isPlatformSlug } from '@/lib/fullstore/links';
import { StoreHeader } from '@/components/fullstore/StoreHeader';
import { savedDesign } from '@/lib/fullstore/storeDesign';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop';

const PLATFORM_FALLBACK = {
  storeName: 'DataBundle',
  storeDescription: 'The fastest way to buy data in Ghana.',
  storeType: 'fullstore',
  status: 'active',
  isOpen: true,
  isPlatformStore: true,
  allowGuestCheckout: false,
  contactInfo: null
};

async function fetchStore(slug) {
  try {
    const res = await fetch(`${API_BASE}/api/store-portal/store/context`, {
      headers: { 'X-Store-Slug': slug },
      next: { revalidate: 60 }
    });
    if (!res.ok) {
      return isPlatformSlug(slug) ? PLATFORM_FALLBACK : null;
    }
    const d = await res.json();
    return d?.data || (isPlatformSlug(slug) ? PLATFORM_FALLBACK : null);
  } catch {
    return isPlatformSlug(slug) ? PLATFORM_FALLBACK : null;
  }
}

async function fetchProducts(slug) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/agent-stores/stores/${encodeURIComponent(slug)}/products`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) return [];
    const d = await res.json();
    return d?.data?.products || [];
  } catch { return []; }
}

export default async function StoreHome({ params }) {
  const { storeSlug } = await params;
  const [store, products] = await Promise.all([fetchStore(storeSlug), fetchProducts(storeSlug)]);
  if (!store) return null;

  // When guest checkout is on, the client grid opens an in-page modal.
  // Otherwise it falls back to /checkout which bounces guests to login.
  const allowGuest = !!store.allowGuestCheckout;
  // Owner's setting: keep the live delivery-time widget off this store.
  const hideEta = !!store.customization?.hideDeliveryEta;

  return (
    <>
      {/* ====================================================================
       *  Slim header — store name + a single "Buy without account" hint.
       *  Mirrors the DataMart buy-page format (mtnup2u, TELECEL, at-ishare-f):
       *  no marketing copy, no testimonials. Customers scrolled here to buy,
       *  not to read. Bundles are immediately below.
       * =================================================================== */}
      <StoreHeader
        storeName={store.storeName}
        whatsapp={store.contactInfo?.whatsappNumber ? String(store.contactInfo.whatsappNumber).replace(/\D/g, '') : null}
        design={isPlatformSlug(storeSlug) ? null : savedDesign(store)}
      />

      {/* ====================================================================
       *  ALL BUNDLES — the only section. Grouped by network with themed
       *  cards (yellow / red / purple).
       * =================================================================== */}
      <section id="bundles" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {!hideEta && <DeliveryEtaBanner />}
        <StoreBundleGrid
          products={products}
          storeSlug={storeSlug}
          allowGuest={allowGuest}
          hideEta={hideEta}
        />
      </section>
    </>
  );
}
