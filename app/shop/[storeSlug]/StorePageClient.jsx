'use client';

/**
 * Store home page.
 *
 * Opens with SiteHero — a full-bleed brand section that the fixed nav sits
 * transparently on top of — then goes straight to bundles. The hero carries a
 * price card so the shop is priced before a visitor scrolls at all.
 *
 * Removed along the way, and not coming back:
 *  - The four-badge strip ("10-60 Min Delivery / 100% Secure / 24/7 Available").
 *    Unfalsifiable claims rendered as decoration.
 *  - "Why Buy From Us?" — three pastel circles restating those same badges.
 *  - The gradient "Ready to Get Started?" footer CTA. The header already has a
 *    buy button; a second one wrapped in a gradient is the most template-looking
 *    way a storefront can end.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import WhatsAppIcon from './components/WhatsAppIcon';
import { networkOf } from '@/lib/storeTheme';
import PackageDisplay from './components/PackageDisplay';
import SiteHero from './components/SiteHero';
import NetworkLogo from './components/NetworkLogo';
import { DeliveryEtaBanner } from './components/DeliveryEta';

const NETWORK_ORDER = ['YELLO', 'TELECEL', 'AT_PREMIUM'];

const cedis = (n) => `₵${Number(n || 0).toFixed(2)}`;
const priceOf = (p) => (p.isOnSale && p.salePrice ? p.salePrice : p.sellingPrice);


const COMMITMENTS = [
  ['Mobile money only', 'MTN, Telecel and AirtelTigo money are all accepted. No card, no account to create.'],
  ['Any number on the network', 'Buy for yourself, for family, for a customer. You enter the number at checkout.'],
  ['If it fails, you get it back', 'A bundle that does not deliver is refunded. Keep the tracking ID and we can find it.'],
];

export default function StorePageClient({ storeSlug, initialStore, initialProducts }) {
  const store = initialStore;
  const products = useMemo(() => initialProducts || [], [initialProducts]);

  /* One pass over the catalogue rather than six filter() calls. Gives, per
     network, the bundle count and the cheapest price — "from ₵4.20" is what a
     shopper actually wants next to a network name. */
  const byNetwork = useMemo(() => {
    const acc = {};
    for (const product of products) {
      const key = product.network;
      const price = priceOf(product);
      if (!acc[key]) acc[key] = { count: 0, from: price, items: [] };
      acc[key].count += 1;
      acc[key].items.push(product);
      if (price < acc[key].from) acc[key].from = price;
    }
    return acc;
  }, [products]);

  /* Cheapest of each network first, then whatever is on sale. Six tiles fills
     two rows on a phone and two on a desktop without a ragged last row. */
  const popular = useMemo(() => {
    const picked = [];
    for (const key of NETWORK_ORDER) {
      const cheapest = byNetwork[key]?.items?.slice().sort((a, b) => priceOf(a) - priceOf(b))[0];
      if (cheapest) picked.push(cheapest);
    }
    const ids = new Set(picked.map((p) => p._id));
    const onSale = products.filter((p) => p.isOnSale && !ids.has(p._id)).slice(0, 3);
    return [...picked, ...onSale].slice(0, 6);
  }, [byNetwork, products]);


  if (!store) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-ink-3">Store not found.</p>
      </div>
    );
  }

  const availableNetworks = NETWORK_ORDER.filter((key) => byNetwork[key]?.count);
  const whatsapp = store.contactInfo?.whatsappNumber?.replace(/\D/g, '');

  return (
    <>
      <SiteHero
        store={store}
        storeSlug={storeSlug}
        style={store?.customization?.heroStyle || 'default'}
      />

      <div className="mx-auto max-w-5xl space-y-11 px-4 py-10 sm:py-12">
        {/* First thing under the hero. Someone arriving already wondering
            "is it slow today?" gets the answer before they look at a price,
            and if it is slow they find that out before paying rather than
            after. It used to sit three sections down, below the bundles it
            should be qualifying. */}
        <DeliveryEtaBanner />

        <PackageDisplay products={popular} storeSlug={storeSlug} title="Popular bundles" />

        {/* Browse by network — just the marks. People recognise these faster
            than they read the words next to them, and the counts and prices
            they used to carry are already on every tile above. */}
        {availableNetworks.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[18px]">Browse by network</h2>
              <Link
                href={`/shop/${storeSlug}/products`}
                className="flex items-center gap-0.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
              >
                All prices
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {availableNetworks.map((key) => (
                <Link
                  key={key}
                  href={`/shop/${storeSlug}/products?network=${key}`}
                  aria-label={networkOf(key).name}
                  title={networkOf(key).name}
                  className="card flex items-center justify-center p-4 transition-colors hover:border-brand-line hover:bg-sunken"
                >
                  <NetworkLogo network={key} size={52} />
                </Link>
              ))}
            </div>
          </section>
        )}

      {/* The honest version of the badge strip that used to sit here. Every line
          is something a customer could hold the shop to. */}
      <section className="card divide-y divide-hairline">
        {COMMITMENTS.map(([title, body]) => (
          <div key={title} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
            <h3 className="text-[13.5px] sm:w-56 sm:flex-none">{title}</h3>
            <p className="text-[13px] leading-relaxed text-ink-3">{body}</p>
          </div>
        ))}
      </section>

      {(whatsapp || store.contactInfo?.phoneNumber) && (
        <section className="flex flex-col items-start gap-3 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px]">Stuck on an order?</h2>
            <p className="mt-1 text-[13px] text-ink-3">
              Message {store.storeName} with your tracking ID and we will check it.
            </p>
          </div>
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <span style={{ color: '#25D366' }} className="flex">
                <WhatsAppIcon className="h-4 w-4" />
              </span>
              WhatsApp us
            </a>
          ) : (
            <a href={`tel:${store.contactInfo.phoneNumber}`} className="btn btn-ghost">
              Call {store.contactInfo.phoneNumber}
            </a>
          )}
          </section>
        )}
      </div>
    </>
  );
}
