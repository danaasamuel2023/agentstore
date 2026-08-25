'use client';

/**
 * Live preview.
 *
 * Renders the REAL StoreHeader and PackageDisplay, not a mock-up of them. That
 * works because the brand colour reaches components as CSS custom properties
 * rather than as a prop threaded through every file: wrap the preview in the
 * draft's variables and the actual storefront components paint themselves in
 * the un-saved colour.
 *
 * If this ever stops matching what a customer sees, the fix belongs in the
 * component — there is deliberately no second copy of the design in here to
 * drift out of step.
 */

import { useMemo } from 'react';
import { brandVars, networkOf } from '@/lib/storeTheme';
import { useIsDark } from '@/lib/useIsDark';
import SiteNav, { NAV_LINKS } from '../../components/SiteNav';
import SiteHero from '../../components/SiteHero';
import PackageDisplay from '../../components/PackageDisplay';

const cedis = (n) => `₵${Number(n || 0).toFixed(2)}`;
const priceOf = (p) => (p.isOnSale && p.salePrice ? p.salePrice : p.sellingPrice);

/* Stand-in prices for a shop with no catalogue yet, so the owner can still see
   what their colour and layout do. Labelled as samples underneath. */
const SAMPLE = [
  { _id: 's1', network: 'YELLO', capacity: 1, sellingPrice: 5.2 },
  { _id: 's2', network: 'TELECEL', capacity: 5, sellingPrice: 23 },
  { _id: 's3', network: 'AT_PREMIUM', capacity: 10, sellingPrice: 38.5 },
  { _id: 's4', network: 'YELLO', capacity: 2, sellingPrice: 9.8 },
];

export default function DesignPreview({ draft, store, products }) {
  const dark = useIsDark();

  const previewStore = useMemo(
    () => ({
      ...store,
      storeName: draft.storeName || store?.storeName,
      storeLogo: draft.storeLogo ?? store?.storeLogo,
      storeDescription: draft.storeDescription ?? store?.storeDescription,
      customization: {
        ...(store?.customization || {}),
        primaryColor: draft.primaryColor,
        heroStyle: draft.heroStyle,
        heroHeadline: draft.heroHeadline,
      },
    }),
    [draft, store]
  );

  const items = products?.length ? products : SAMPLE;
  const usingSample = !products?.length;

  const networks = useMemo(() => {
    const acc = {};
    for (const p of items) {
      const price = priceOf(p);
      if (!acc[p.network]) acc[p.network] = { count: 0, from: price };
      acc[p.network].count += 1;
      if (price < acc[p.network].from) acc[p.network].from = price;
    }
    return Object.entries(acc);
  }, [items]);

  const popular = useMemo(() => items.slice(0, 4), [items]);

  return (
    <div
      style={brandVars(draft.primaryColor, dark)}
      className="overflow-hidden rounded-lg border border-hairline bg-canvas"
    >
      {/* The preview is a narrow column, so the header's own sticky nav would
          pin itself to the top of the EDITOR rather than to this box. Scoped
          scrolling below keeps it behaving. */}
      <div className="max-h-[600px] overflow-y-auto">
        {/* SiteNav is position:fixed on the real site, which inside this narrow
            preview box would pin it to the top of the EDITOR instead. The
            wrapper below is a containing block (transform + relative), so the
            fixed bar resolves against this box and stays where it belongs. */}
        <div className="relative" style={{ transform: 'translateZ(0)' }}>
          <SiteNav
            store={previewStore}
            storeSlug={store?.storeSlug || 'preview'}
            navLinks={NAV_LINKS}
            isActive={(path) => path === ''}
            overHero
            darkMode={dark}
            onToggleTheme={() => {}}
            onCheckNumber={null}
            subAgentEnabled={false}
          />

          <div className="pt-16">
            <SiteHero
              store={previewStore}
              storeSlug={store?.storeSlug || 'preview'}
              style={draft.heroStyle}
            />
          </div>
        </div>

        <div className="space-y-7 px-3 py-5">
          <PackageDisplay
            products={popular}
            storeSlug={store?.storeSlug || 'preview'}
            title="Popular bundles"
            showAllLink={false}
          />

          {networks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[15px]">Browse by network</h2>
              <div className="grid gap-2">
                {networks.map(([key, stats]) => {
                  const net = networkOf(key);
                  return (
                    <div key={key} className="card flex items-center gap-2.5 p-3">
                      <span
                        className="h-7 w-1.5 flex-none rounded-full"
                        style={{ background: net.hex }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold text-ink">
                          {net.name}
                        </span>
                        <span className="num block text-[11px] text-ink-3">
                          {stats.count} bundles · from {cedis(stats.from)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {usingSample && (
            <p className="rounded-sm border border-dashed border-hairline-strong px-3 py-2 text-[11px] text-ink-3">
              Sample prices — your own bundles appear here once you add them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
