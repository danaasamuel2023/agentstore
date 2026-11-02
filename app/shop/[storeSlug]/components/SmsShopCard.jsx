'use client';

/**
 * "No internet? Buy by SMS" — shown only when the shop's ShopLine phone is
 * linked, open and was seen lately (the API decides). Customers text HI to the
 * shop's own number and buy from a numbered menu, paying with MoMo.
 */

import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop';

const pretty = (p) => String(p).replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');

export default function SmsShopCard({ slug }) {
  const [line, setLine] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    fetch(`${API_BASE}/api/sms-shop/public/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && d.active && /^0\d{9}$/.test(d.phone || '')) setLine({ phone: d.phone, keyword: d.keyword || 'HI' }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  if (!line) return null;
  return (
    <div className="mx-auto max-w-5xl px-4 pb-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-paper p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 sm:flex-1">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl" style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}>
            <MessageSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">No internet? Buy by SMS</p>
            <p className="text-[13px] leading-snug text-ink-3">
              Text <b className="text-ink">{line.keyword}</b> to{' '}
              <span className="num font-semibold text-ink">{pretty(line.phone)}</span> from any phone.
              Pick your bundle from the menu and pay with MoMo.
            </p>
          </div>
        </div>
        <a href={`sms:${line.phone}?&body=${encodeURIComponent(line.keyword)}`} className="btn btn-brand h-10 flex-none text-[13.5px]">
          Text {line.keyword} now
        </a>
      </div>
    </div>
  );
}
