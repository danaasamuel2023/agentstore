'use client';

/**
 * Invite a friend — a one-minute video showing how "Bring a friend" works:
 * share your link from the receipt, a friend's first order, then money off
 * your next order with Pay with MoMo from the same number. Neutral video
 * (no platform name); the page carries this shop's name.
 */

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function InviteFriendClient({ storeSlug, storeName }) {
  const name = storeName || 'our shop';
  const share = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Invite your friends to ${name} and pay less for your data. See how: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  return (
    <div className="mx-auto max-w-md">
      <p className="eyebrow mb-2">Invite a friend</p>
      <h1 className="mb-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink">
        Invite friends, pay less
      </h1>
      <p className="mb-5 text-[14px] leading-relaxed text-ink-3">
        After you buy, your receipt shows your own invite link. When a friend buys from {name} with it for the first
        time, your next order costs less. Pay with MoMo from the same number to use it.
      </p>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-black shadow-sm">
        <video
          className="block aspect-[9/16] w-full"
          src="/videos/bring-a-friend.mp4"
          poster="/videos/bring-a-friend.jpg"
          controls
          playsInline
          preload="metadata"
        />
      </div>
      <div className="mt-5 grid gap-2.5">
        <Link href={`/shop/${storeSlug}/products`} className="btn btn-brand btn-lg">
          <ShoppingBag className="h-4 w-4" /> Buy data
        </Link>
        <button type="button" onClick={share} className="btn btn-ghost h-11 text-[13.5px]">
          <span style={{ color: '#25D366' }} className="flex"><WhatsAppIcon className="h-4 w-4" /></span> Share this video
        </button>
      </div>
    </div>
  );
}
