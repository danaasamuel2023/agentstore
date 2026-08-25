'use client';

/**
 * PackageDisplay — the bold colour tiles, always.
 *
 * This used to switch layout on the store's `packageDisplayStyle`, which meant
 * a shop carrying the legacy value 'list' showed its Popular bundles as thin
 * grey rows while every other shop got tiles. That setting was seeded, not
 * chosen, and the rows made the home page look like a settings screen next to
 * the page it was sending people to.
 *
 * Popular bundles is a six-item SHOWCASE. A showcase has one right answer, so
 * the switch is gone along with the two layouts nobody was choosing.
 *
 * The network colour carries the tile. Everything on it is near-black or white
 * depending on which is actually readable on that colour (MTN yellow needs
 * black; Telecel red and AirtelTigo blue need white) — decided by `networkOf`,
 * not guessed per component.
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { networkOf } from '@/lib/storeTheme';
import NetworkLogo from './NetworkLogo';

const priceOf = (p) => (p.isOnSale && p.salePrice ? p.salePrice : p.sellingPrice);
const cedis = (n) => `₵${Number(n || 0).toFixed(2)}`;

const shortName = (name) => (name === 'AirtelTigo' ? 'AT' : name === 'Telecel' ? 'TC' : 'MTN');

/* -------------------------------------------------------------------------- */

/** The bold tile. This is the shape people already tap on the products page. */
function Blocks({ products, storeSlug }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {products.map((product) => {
        const net = networkOf(product.network);
        const price = priceOf(product);
        const wasDiscounted =
          product.isOnSale && product.salePrice && product.sellingPrice > product.salePrice;

        return (
          <Link
            key={product._id}
            href={`/shop/${storeSlug}/products?network=${product.network}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl p-4 transition-transform active:scale-[.985] sm:p-5"
            style={{ background: net.hex, color: net.ink, minHeight: 148 }}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="rounded-md px-2 py-1 text-[10.5px] font-bold tracking-wide"
                style={{ background: 'rgba(255,255,255,.22)', color: net.ink }}
              >
                {shortName(net.name)}
              </span>

              {product.isOnSale && (
                <span
                  className="rounded-md px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ background: net.ink, color: net.hex }}
                >
                  Sale
                </span>
              )}
            </div>

            <div className="mt-4">
              <p className="num text-[30px] font-bold leading-none sm:text-[34px]">
                {product.capacity}GB
              </p>
              <p className="mt-1 text-[12.5px] font-medium" style={{ opacity: 0.72 }}>
                {net.name} bundle
              </p>
            </div>

            <div className="mt-4 flex items-end justify-between gap-2">
              <span className="flex items-baseline gap-1.5">
                <span className="num text-[21px] font-bold leading-none">{cedis(price)}</span>
                {wasDiscounted && (
                  <span className="num text-[12px] line-through" style={{ opacity: 0.6 }}>
                    {cedis(product.sellingPrice)}
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ opacity: 0.65 }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function PackageDisplay({
  products,
  storeSlug,
  title = 'Popular bundles',
  showAllLink = true,
}) {

  if (!products || products.length === 0) return null;


  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-[18px]">{title}</h2>

        <div className="flex items-center gap-4">
          {showAllLink && (
            <Link
              href={`/shop/${storeSlug}/products`}
              className="flex items-center gap-0.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
            >
              All prices
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <Blocks products={products} storeSlug={storeSlug} />
    </section>
  );
}
