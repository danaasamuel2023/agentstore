'use client';

/**
 * The body of a full store's home page, under the header.
 *
 * No design → exactly what every store has always shown: the delivery banner
 * (unless the owner hid it) and every bundle, grouped by network.
 *
 * With a design, the owner's sections are drawn in the owner's order:
 *   delivery  live delivery progress (not repeated when the header's
 *             "Full + delivery" style already shows it, never when hidden)
 *   popular   the cheapest bundle of each network + what is on sale
 *   networks  jump straight to a network's bundles
 *   promises  the owner's three promises, or our built-in three
 *   faq       the owner's questions and answers
 *   contact   WhatsApp / call
 * All bundles are always shown — where "popular" sits in the order, even when
 * popular itself is switched off, so a store can never hide its own prices.
 */

import { useMemo } from 'react';
import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { StoreBundleGrid } from '@/components/fullstore/StoreBundleGrid';
import { DeliveryEtaBanner } from '@/components/fullstore/DeliveryEta';
import { NetworkIcon } from '@/components/fullstore/NetworkIcon';
import { NETWORK_LABEL } from '@/lib/fullstore/format';
import { useLiveDesign, sectionsOn } from '@/lib/fullstore/liveDesign';

const NETWORK_ORDER = ['YELLO', 'TELECEL', 'AT_PREMIUM'];

const PROMISES = [
  ['Pay with Mobile Money', 'MTN, Telecel and AirtelTigo money are all accepted. With an account you can also pay from your wallet.'],
  ['Any number on the network', 'Buy for yourself, for family or for a customer. You enter the number before you pay.'],
  ['If it fails, you get it back', 'A bundle that does not deliver is refunded. Keep your tracking ID and we can find it.'],
];

const priceOf = (p) => Number(p.sellingPrice) || 0;

export function StoreHomeSections({ products, storeSlug, storeName, allowGuest, hideEta, whatsapp, phone, design: saved }) {
  const design = useLiveDesign(saved);

  const popular = useMemo(() => {
    const live = (products || []).filter((p) => !(p.outOfStock || p.inStock === false));
    const picked = [];
    for (const net of NETWORK_ORDER) {
      const cheapest = live.filter((p) => p.network === net).sort((a, b) => priceOf(a) - priceOf(b))[0];
      if (cheapest) picked.push(cheapest);
    }
    const ids = new Set(picked.map((p) => p._id));
    const onSale = live.filter((p) => p.isOnSale && !ids.has(p._id)).slice(0, 3);
    return [...picked, ...onSale].slice(0, 6);
  }, [products]);

  const grid = (
    <StoreBundleGrid
      products={products}
      storeSlug={storeSlug}
      allowGuest={allowGuest}
      hideEta={hideEta}
      design={design}
    />
  );

  if (!design) {
    return (
      <section id="bundles" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {!hideEta && <DeliveryEtaBanner />}
        {grid}
      </section>
    );
  }

  const networks = NETWORK_ORDER.filter((n) => (products || []).some((p) => p.network === n));
  const promises = design.promises?.length ? design.promises.map((p) => [p.title, p.body]) : PROMISES;

  const SECTIONS = {
    delivery: () => (!hideEta && design.heroStyle !== 'split' ? <DeliveryEtaBanner key="delivery" /> : null),

    popular: () => (
      <StoreBundleGrid
        key="popular"
        products={popular}
        storeSlug={storeSlug}
        allowGuest={allowGuest}
        hideEta={hideEta}
        design={design}
        flat
        title="Popular bundles"
      />
    ),

    networks: () => (networks.length > 1 ? (
      <section key="networks">
        <h2 className="text-[15px] font-bold text-[color:var(--ink)] mb-3">Browse by network</h2>
        <div className="flex flex-wrap gap-2">
          {networks.map((n) => (
            <a
              key={n}
              href={`#bundles-${n}`}
              className="card inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold text-[color:var(--ink)] hover:bg-[color:var(--surface-2)] transition-colors"
            >
              <NetworkIcon network={n} size={26} />
              {NETWORK_LABEL[n] || n}
            </a>
          ))}
        </div>
      </section>
    ) : null),

    promises: () => (
      <section key="promises" className="card divide-y divide-[color:var(--border)]">
        {promises.map(([title, body]) => (
          <div key={title} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
            <h3 className="text-[14px] font-bold text-[color:var(--ink)] sm:w-56 sm:flex-none">{title}</h3>
            <p className="text-[13.5px] leading-relaxed text-[color:var(--ink-mute)]">{body}</p>
          </div>
        ))}
      </section>
    ),

    faq: () => (design.faq?.length ? (
      <section key="faq">
        <h2 className="text-xl font-black tracking-tight text-[color:var(--ink)] mb-3">Questions</h2>
        <div className="card divide-y divide-[color:var(--border)]">
          {design.faq.map((f, i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-[color:var(--ink)]">
                {f.q}
                <ChevronDown className="h-4 w-4 flex-none text-[color:var(--brand-text)] transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--ink-mute)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    ) : null),

    contact: () => (whatsapp || phone ? (
      <section key="contact" className="flex flex-col items-start gap-3 border-t border-[color:var(--border)] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-[color:var(--ink)]">Stuck on an order?</h2>
          <p className="mt-1 text-[13.5px] text-[color:var(--ink-mute)]">
            Message {storeName} with your tracking ID and we will check it.
          </p>
        </div>
        {whatsapp ? (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <MessageCircle className="w-4 h-4 text-[color:var(--success)]" /> WhatsApp us
          </a>
        ) : (
          <a href={`tel:${phone}`} className="btn btn-ghost">
            <Phone className="w-4 h-4" /> Call {phone}
          </a>
        )}
      </section>
    ) : null),
  };

  // "popular"'s place in the full order (on or off) is where all bundles go.
  const order = (design.sections || []).map((s) => s.id);
  const on = new Set(sectionsOn(design));
  const body = [];
  for (const id of order) {
    if (on.has(id)) body.push(SECTIONS[id]?.());
    if (id === 'popular') body.push(<section key="all" id="bundles">{grid}</section>);
  }
  if (!order.includes('popular')) body.push(<section key="all" id="bundles">{grid}</section>);

  const compact = design.density === 'compact';
  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${compact ? 'py-6 space-y-7' : 'py-8 space-y-10'}`}>
      {body}
    </div>
  );
}
