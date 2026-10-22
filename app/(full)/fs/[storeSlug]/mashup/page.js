'use client';

/**
 * MTN MashUp packs on a full store — data, calls and SMS in one pack.
 *
 * Same server path as the simple shop (cheapdata.shop/shop/<slug>/mashup):
 *   GET  /api/v1/agent-stores/stores/:slug/mashup             → { available, products }
 *   POST /api/v1/agent-stores/stores/:slug/mashup/initialize  → { authorizationUrl }
 * so prices, floors and the platform on/off switch are exactly the simple
 * shop's. Payment is MoMo/card only — there is no wallet path for packs yet.
 *
 * Same look as the MashUp page on the main sites: a black banner, all-yellow
 * MTN cards with a black Buy button, and a pop-up for the number and email.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, X, Wifi, Phone, MessageSquare, Calendar, Smartphone } from 'lucide-react';
import { storeHref } from '@/lib/fullstore/links';
import { useAuth } from '@/lib/fullstore/auth';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop'}/api/v1/agent-stores`;
const dataLabel = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(2).replace(/\.?0+$/, '')}GB` : `${mb}MB`);
const ghs = (n) => `GH₵${Number(n || 0).toFixed(2)}`;

function PackCard({ p, onPick }) {
  return (
    <div className="flex flex-col rounded-2xl bg-[#FFCC00] p-5 text-black shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest">MTN MashUp</p>
      <p className="mt-1 text-3xl font-black">{ghs(p.sellingPrice)}</p>
      <ul className="mt-4 space-y-2 text-sm font-semibold">
        <li className="flex items-center gap-2"><Wifi className="h-4 w-4" />{dataLabel(p.mb)} data</li>
        <li className="flex items-center gap-2"><Phone className="h-4 w-4" />{p.onnetMins} mins to MTN</li>
        <li className="flex items-center gap-2"><Phone className="h-4 w-4" />{p.offnetMins} mins to other networks</li>
        <li className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />{p.sms} SMS</li>
        <li className="flex items-center gap-2"><Calendar className="h-4 w-4" />Valid {p.validityDays || 30} days</li>
      </ul>
      <button
        type="button"
        onClick={() => onPick(p)}
        className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-bold text-[#FFCC00] hover:bg-zinc-800"
      >
        Buy
      </button>
    </div>
  );
}

function BuyModal({ pack, storeSlug, customer, onClose }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(customer?.email || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [busy, onClose]);

  const validPhone = /^0\d{9}$/.test(phone);
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const pay = async (e) => {
    e.preventDefault();
    setError('');
    if (!validPhone) return setError('Enter a valid MTN number, e.g. 0241234567.');
    if (!validEmail) return setError('Enter a valid email address.');
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/stores/${encodeURIComponent(storeSlug)}/mashup/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comboCost: pack.comboCost,
          phoneNumber: phone,
          customerEmail: email.trim().toLowerCase(),
          customerName: customer?.name || undefined,
          // Back to THIS store (works on databundle.shop and on a custom
          // domain — the middleware accepts an already-prefixed path).
          callbackUrl: `${window.location.origin}${storeHref(storeSlug, '/mashup/return')}`,
        }),
      });
      const j = await r.json();
      if (j.status === 'success' && j.data?.authorizationUrl) {
        window.location.href = j.data.authorizationUrl;
        return;
      }
      setError(j.message || 'We could not start the payment. Please try again.');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    }
    setBusy(false);
  };

  const inputCls = 'mt-2 w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-bold text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={() => { if (!busy) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Buy MTN MashUp ${ghs(pack.sellingPrice)}`}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 text-gray-900 shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-lg font-black">MTN MashUp {ghs(pack.sellingPrice)}</p>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-full p-1.5 text-gray-700 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {dataLabel(pack.mb)} data · {pack.onnetMins} MTN mins · {pack.offnetMins} other mins · {pack.sms} SMS · {pack.validityDays || 30} days
        </p>

        <form onSubmit={pay}>
          <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-gray-500">MTN number to receive the pack</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="024 123 4567"
            className={`${inputCls} text-lg tracking-wider`}
          />
          {validPhone && <p className="mt-2 text-xs text-gray-500">Check the number carefully. A pack sent to a wrong number cannot be taken back.</p>}

          <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-gray-500">Email for your receipt</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${inputCls} text-[15px] font-semibold`}
          />

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !validPhone || !validEmail}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-bold text-[#FFCC00] hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            Pay {ghs(pack.sellingPrice)} with MoMo
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">Packs usually arrive instantly.</p>
        </form>
      </div>
    </div>
  );
}

export default function MashupPage() {
  const { storeSlug } = useParams();
  const { customer } = useAuth() || {};

  const [products, setProducts] = useState(null); // null = loading
  const [available, setAvailable] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/stores/${encodeURIComponent(storeSlug)}/mashup`);
        const j = await r.json();
        if (dead) return;
        setAvailable(j?.data?.available !== false);
        setProducts(j?.status === 'success' ? j.data.products || [] : []);
      } catch {
        if (!dead) {
          setProducts([]);
          setLoadError('We could not load the packs. Check your connection and try again.');
        }
      }
    })();
    return () => { dead = true; };
  }, [storeSlug]);

  if (products === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[color:var(--ink-mute)]">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading…
      </div>
    );
  }

  if (!available || products.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <h1 className="text-xl font-extrabold">MashUp packs are restocking</h1>
        <p className="text-[14px] text-[color:var(--ink-mute)] mt-2">
          {loadError || (available ? 'This store sells data bundles. Have a look at those instead.' : 'Please check back soon. Data bundles are still on sale.')}
        </p>
        <Link href={storeHref(storeSlug, '')} className="btn btn-primary mt-6 inline-flex">Browse bundles</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl bg-black p-6 text-white sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#FFCC00]">New</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">MTN MashUp packs</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-300">
          Data, call minutes and SMS in one pack, valid for 30 days. Pay with MoMo. Packs usually arrive instantly.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <PackCard key={p.comboCost} p={p} onPick={setPicked} />
        ))}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-[color:var(--ink-faint)]">
        A cheaper pack can carry more call minutes and less data than a dearer one. Pick by what you need. Each card shows exactly what you get.
      </p>

      <Link href={storeHref(storeSlug, '')} className="mt-6 inline-flex items-center gap-2 text-[14px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">
        <ArrowLeft className="w-4 h-4" /> Back to the store
      </Link>

      {picked && <BuyModal pack={picked} storeSlug={storeSlug} customer={customer} onClose={() => setPicked(null)} />}
    </div>
  );
}
