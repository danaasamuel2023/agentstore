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

const ALL_NETWORKS = ['YELLO', 'TELECEL', 'AT_PREMIUM'];

export function StoreBundleGrid({ products, storeSlug, allowGuest, hideEta = false }) {
  const [activeProduct, setActiveProduct] = useState(null);

  const checkoutHref = (p) =>
    storeHref(storeSlug, `/checkout?network=${encodeURIComponent(p.network)}&capacity=${p.capacity}`);

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {netProducts.map((p) => (
                  allowGuest ? (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setActiveProduct(p)}
                      className="text-left contents"
                    >
                      <BundleCard product={p} />
                    </button>
                  ) : (
                    <Link key={p._id} href={checkoutHref(p)} className="contents">
                      <BundleCard product={p} />
                    </Link>
                  )
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeProduct && (
        <BundleBuyModal
          storeSlug={storeSlug}
          product={activeProduct}
          hideEta={hideEta}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </>
  );
}
