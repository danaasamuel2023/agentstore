'use client';

/**
 * Client wrapper for the storefront bundle grid.
 *
 * For stores with guest checkout enabled, clicking a bundle opens an
 * in-page modal instead of navigating to /guest/checkout. The modal
 * collects only the recipient phone (email + name optional, remembered
 * via localStorage between visits).
 *
 * Non-guest stores keep the old behaviour: each card is a <Link> to the
 * auth-aware /checkout page, which bounces guests to login.
 */

import { useState } from 'react';
import Link from 'next/link';
import { BundleCard } from './BundleCard';
import { NetworkIcon } from './NetworkIcon';
import { BundleBuyModal } from './BundleBuyModal';
import { storeHref } from '@/lib/fullstore/links';
import { useLiveDesign } from '@/lib/fullstore/liveDesign';

const ALL_NETWORKS = ['YELLO', 'TELECEL', 'AT_PREMIUM'];

/* The owner's package layout (design.productLayout) → how the bundles sit.
   No design = 'cards', exactly as before. */
const LAYOUT_GRID = {
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4',
  grid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3',
  compact: 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2',
  list: 'card overflow-hidden divide-y divide-[color:var(--border)]',
};

/**
 * `design` is the store's saved design (or null). `flat` shows the products as
 * one group under `title` instead of one group per network — the home page's
 * "Popular bundles" row uses it.
 */
export function StoreBundleGrid({ products, storeSlug, allowGuest, hideEta = false, design: saved = null, flat = false, title = '' }) {
  const [activeProduct, setActiveProduct] = useState(null);
  const design = useLiveDesign(saved);
  const layout = LAYOUT_GRID[design?.productLayout] ? design.productLayout : 'cards';
  // Cards keep their original `contents` wrapper; the other layouts need a
  // real box per bundle (grid cell / list row).
  const itemClass = layout === 'cards' ? 'text-left contents' : 'block w-full text-left';

  const items = (list) => list.map((p) => (
    allowGuest ? (
      <button key={p._id} type="button" onClick={() => setActiveProduct(p)} className={itemClass}>
        <BundleCard product={p} variant={layout} />
      </button>
    ) : (
      <Link key={p._id} href={checkoutHref(p)} className={layout === 'cards' ? 'contents' : 'block'}>
        <BundleCard product={p} variant={layout} />
      </Link>
    )
  ));

  const checkoutHref = (p) =>
    storeHref(storeSlug, `/checkout?network=${encodeURIComponent(p.network)}&capacity=${p.capacity}`);

  if ((!products || products.length === 0) && flat) return null;

  if (!products || products.length === 0) {
    return (
      <div className="card p-10 sm:p-14 text-center">
        <h3 className="text-xl font-black tracking-tight mb-1">Catalog launching soon</h3>
        <p className="text-[14px] text-[color:var(--ink-mute)] max-w-md mx-auto">
          Bundles will appear here as the owner stocks the store.
        </p>
      </div>
    );
  }

  const modal = activeProduct && (
    <BundleBuyModal
      storeSlug={storeSlug}
      product={activeProduct}
      hideEta={hideEta}
      onClose={() => setActiveProduct(null)}
    />
  );

  if (flat) {
    return (
      <>
        <div>
          {title && <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-4">{title}</h2>}
          <div className={LAYOUT_GRID[layout]}>{items(products)}</div>
        </div>
        {modal}
      </>
    );
  }

  return (
    <>
      <div className="space-y-12">
        {ALL_NETWORKS.map((net) => {
          const netProducts = products
            .filter((p) => p.network === net)
            .sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
          if (netProducts.length === 0) return null;
          const label = net === 'YELLO' ? 'MTN' : net === 'TELECEL' ? 'Telecel' : 'AirtelTigo';
          const accent = net === 'YELLO' ? '#FFCC00' : net === 'TELECEL' ? '#E30613' : '#9333EA';
          return (
            <div key={net} id={`bundles-${net}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block w-1.5 h-7 rounded-full" style={{ background: accent }} />
                <NetworkIcon network={net} size={32} />
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {label} <span className="text-[color:var(--ink-faint)] font-bold">· {netProducts.length} bundles</span>
                </h3>
              </div>
              <div className={LAYOUT_GRID[layout]}>
                {items(netProducts)}
              </div>
            </div>
          );
        })}
      </div>

      {modal}
    </>
  );
}
