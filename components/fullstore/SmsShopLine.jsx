'use client';

/**
 * "No internet? Buy by SMS" for full stores. Shown only when the shop's
 * ShopLine phone is linked, open and was seen lately (the API decides).
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { isPlatformSlug } from '@/lib/fullstore/links';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop';
const pretty = (p) => String(p).replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');

export function SmsShopLine({ storeSlug }) {
  const pathname = usePathname() || '';
  const [line, setLine] = useState(null);
  const hidden = !storeSlug || isPlatformSlug(storeSlug) || /\/owner(\/|$)/.test(pathname);

  useEffect(() => {
    if (hidden) return;
    let alive = true;
    fetch(`${API_BASE}/api/sms-shop/public/${encodeURIComponent(storeSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && d.active && /^0\d{9}$/.test(d.phone || '')) setLine({ phone: d.phone, keyword: d.keyword || 'HI' }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [storeSlug, hidden]);

  if (hidden || !line) return null;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8">
      <div className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 sm:flex-1">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-white" style={{ background: 'var(--brand)' }}>
            <MessageSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>No internet? Buy by SMS</p>
            <p className="text-[13px] leading-snug" style={{ color: 'var(--ink-mute)' }}>
              Text <b style={{ color: 'var(--ink)' }}>{line.keyword}</b> to{' '}
              <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{pretty(line.phone)}</span> from any phone.
              Pick your bundle from the menu and pay with MoMo.
            </p>
          </div>
        </div>
        <a href={`sms:${line.phone}?&body=${encodeURIComponent(line.keyword)}`}
          className="inline-flex h-10 flex-none items-center justify-center rounded-xl px-4 text-[13.5px] font-semibold text-white"
          style={{ background: 'var(--brand)' }}>
          Text {line.keyword} now
        </a>
      </div>
    </div>
  );
}
