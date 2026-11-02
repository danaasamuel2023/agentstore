'use client';

/**
 * How to buy — a one-minute video the shop owner can send to customers.
 * The video is neutral (no platform name), so every shop can use it; the page
 * around it carries this shop's own name and buttons.
 */

import Link from 'next/link';
import { ShoppingBag, Package } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function HowToBuyClient({ storeSlug, storeName }) {
  const name = storeName || 'our shop';
  const share = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `See how to buy data from ${name} in one minute: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  return (
    <div className="mx-auto max-w-md">
      <p className="eyebrow mb-2">How to buy</p>
      <h1 className="mb-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink">
        Buying data from {name} is quick and easy
      </h1>
      <p className="mb-5 text-[14px] leading-relaxed text-ink-3">
        Watch this one-minute video. Pick your network and bundle, pay with Mobile Money, and your data arrives.
      </p>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-black shadow-sm">
        <video
          className="block aspect-[7/15] w-full"
          src="/videos/how-to-buy.mp4"
          poster="/videos/how-to-buy.jpg"
          controls
          playsInline
          preload="metadata"
        />
      </div>
      <div className="mt-5 grid gap-2.5">
        <Link href={`/shop/${storeSlug}/products`} className="btn btn-brand btn-lg">
          <ShoppingBag className="h-4 w-4" /> Start buying
        </Link>
        <div className="grid grid-cols-2 gap-2.5">
          <Link href={`/shop/${storeSlug}/orders/search`} className="btn btn-ghost h-11 text-[13.5px]">
            <Package className="h-4 w-4" /> Track order
          </Link>
          <button type="button" onClick={share} className="btn btn-ghost h-11 text-[13.5px]">
            <span style={{ color: '#25D366' }} className="flex"><WhatsAppIcon className="h-4 w-4" /></span> Share
          </button>
        </div>
      </div>
    </div>
  );
}
