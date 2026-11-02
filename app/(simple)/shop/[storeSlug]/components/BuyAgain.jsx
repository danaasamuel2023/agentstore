'use client';

/**
 * Buy again in one tap.
 *
 * The phone remembers this shop's last 3 orders (localStorage, per shop). A
 * "Buy again" link opens the products page with the same bundle, number and
 * name already filled in. It never pays by itself: the customer still taps Buy.
 *
 * Before the customer leaves for the payment page we park the order as
 * "pending"; the verify page moves it into the recent list once the payment
 * is confirmed. Storage can be blocked (private mode, full disk), so every
 * read and write is wrapped and the shop works without it.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';

const MAX = 3;
const recentKey = (slug) => `dm_recent_${slug}`;
const pendingKey = (slug) => `dm_pending_${slug}`;

const netName = (n) => (n === 'YELLO' ? 'MTN' : n === 'TELECEL' ? 'Telecel' : n === 'AT_PREMIUM' || n === 'at' ? 'AirtelTigo' : n || '');
export const maskPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)} XXX ${d.slice(6)}` : d;
};

export function readRecent(slug) {
  try {
    const list = JSON.parse(localStorage.getItem(recentKey(slug)) || '[]');
    return Array.isArray(list) ? list.filter((x) => x && x.phoneNumber && (x.productId || (x.network && x.capacity))).slice(0, MAX) : [];
  } catch { return []; }
}

export function pushRecent(slug, item) {
  try {
    if (!slug || !item || !item.phoneNumber) return;
    const same = (a) => String(a.phoneNumber) === String(item.phoneNumber)
      && (item.productId ? a.productId === item.productId : (a.network === item.network && String(a.capacity) === String(item.capacity)));
    const next = [{ ...item, at: Date.now() }, ...readRecent(slug).filter((a) => !same(a))].slice(0, MAX);
    localStorage.setItem(recentKey(slug), JSON.stringify(next));
  } catch { /* storage blocked: nothing to remember */ }
}

export function savePending(slug, item) {
  try { localStorage.setItem(pendingKey(slug), JSON.stringify({ ...item, at: Date.now() })); } catch { /* ignore */ }
}

// The order parked before payment, if it is recent (under 2 hours) — then forgotten.
export function takePending(slug) {
  try {
    const p = JSON.parse(localStorage.getItem(pendingKey(slug)) || 'null');
    localStorage.removeItem(pendingKey(slug));
    return p && Date.now() - (p.at || 0) < 2 * 3600 * 1000 ? p : null;
  } catch { return null; }
}

export function buyAgainHref(slug, item) {
  const q = new URLSearchParams();
  if (item.productId) q.set('buy', item.productId);
  else { q.set('net', item.network); q.set('gb', String(item.capacity)); }
  if (item.phoneNumber) q.set('to', String(item.phoneNumber).replace(/\D/g, ''));
  if (item.customerName) q.set('name', String(item.customerName).slice(0, 60));
  return `/shop/${slug}/products?${q.toString()}`;
}

/** Up to 3 recent orders as one-tap rows. Renders nothing when there are none. */
export default function BuyAgainStrip({ slug, className = '' }) {
  const [items, setItems] = useState([]);
  useEffect(() => { setItems(readRecent(slug)); }, [slug]);
  if (!items.length) return null;
  return (
    <div className={`card p-3 sm:p-4 ${className}`}>
      <p className="eyebrow mb-2 flex items-center gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" /> Buy again
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((it) => (
          <Link
            key={`${it.productId || `${it.network}-${it.capacity}`}-${it.phoneNumber}`}
            href={buyAgainHref(slug, it)}
            className="flex items-center justify-between gap-3 rounded-lg border border-hairline px-3 py-2.5 transition-colors hover:border-hairline-strong"
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-ink">
                {it.capacity ? `${it.capacity}GB` : 'Bundle'} <span className="font-normal text-ink-3">{netName(it.network)}</span>
              </span>
              <span className="num block truncate text-[12.5px] text-ink-3">
                {maskPhone(it.phoneNumber)}{it.customerName ? ` · ${it.customerName}` : ''}
              </span>
            </span>
            <span className="btn btn-brand h-8 flex-none px-3 text-[12.5px]">Buy again</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
