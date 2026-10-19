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

import { StoreHomeSections } from '@/components/fullstore/StoreHomeSections';
import Link from 'next/link';
import { isPlatformSlug, storeHref } from '@/lib/fullstore/links';
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

// MashUp packs share the simple shop's catalogue; `available` is the
// platform-wide switch. Any failure just hides the card.
async function fetchMashup(slug) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/agent-stores/stores/${encodeURIComponent(slug)}/mashup`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const d = await res.json();
    const products = d?.data?.products || [];
    if (d?.data?.available === false || products.length === 0) return null;
    return { from: Math.min(...products.map((p) => Number(p.sellingPrice) || 0)) };
  } catch { return null; }
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
  // The platform's own store does not advertise packs (the main site sells them).
  const [store, products, mashup] = await Promise.all([
    fetchStore(storeSlug),
    fetchProducts(storeSlug),
    isPlatformSlug(storeSlug) ? null : fetchMashup(storeSlug)
  ]);
  if (!store) return null;

  // When guest checkout is on, the client grid opens an in-page modal.
  // Otherwise it falls back to /checkout which bounces guests to login.
  const allowGuest = !!store.allowGuestCheckout;
  // Owner's setting: keep the live delivery-time widget off this store.
  const hideEta = !!store.customization?.hideDeliveryEta;

  const design = isPlatformSlug(storeSlug) ? null : savedDesign(store);
  const whatsapp = store.contactInfo?.whatsappNumber ? String(store.contactInfo.whatsappNumber).replace(/\D/g, '') : null;

  return (
    <>
      {/* Header: store name, the owner's headline, WhatsApp. Then the bundles
          (and, for a store with its own design, the owner's sections).
          Mirrors the DataMart buy-page format: customers came here to buy. */}
      <StoreHeader storeName={store.storeName} whatsapp={whatsapp} design={design} hideEta={hideEta} />

      {mashup && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <Link href={storeHref(storeSlug, '/mashup')} className="card flex items-center gap-3 p-4 hover:border-[color:var(--border-strong)]">
            <span className="w-11 h-11 rounded-xl bg-[color:var(--brand-glow)] flex items-center justify-center shrink-0 text-lg font-black text-[color:var(--brand-deep)]">M</span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">MTN MashUp packs</span>
              <span className="block text-[12.5px] text-[color:var(--ink-mute)]">Data + calls + SMS in one pack · from GH₵{mashup.from.toFixed(2)}</span>
            </span>
            <span className="btn btn-yellow shrink-0">View</span>
          </Link>
        </div>
      )}

      <StoreHomeSections
        products={products}
        storeSlug={storeSlug}
        storeName={store.storeName}
        allowGuest={allowGuest}
        hideEta={hideEta}
        whatsapp={whatsapp}
        phone={store.contactInfo?.phoneNumber || null}
        design={design}
      />
    </>
  );
}
