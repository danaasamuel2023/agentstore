'use client';

/**
 * MashUp packs — data, calls and SMS together, on MTN.
 *
 * Same look as the MashUp page on the main sites: a black banner, then one
 * all-yellow MTN card per pack with the price on top, every part of the pack
 * listed, and a black Buy button. Buy opens a pop-up with the number and email.
 *
 *   A pack is not a size. Each one carries data AND minutes AND SMS, and the
 *   list is not ordered by any single one of them, so every part is on every
 *   card.
 *
 *   Availability is platform-wide. The page asks the server every time it
 *   loads and the server asks again before it takes money.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft, X, Wifi, Phone, MessageSquare, Calendar, Smartphone } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1/agent-stores';

const dataLabel = (mb) => (mb >= 1024
  ? `${(mb / 1024).toFixed(2).replace(/\.?0+$/, '')}GB`
  : `${mb}MB`);
const cedis = (n) => `GH₵${Number(n || 0).toFixed(2)}`;

function PackCard({ p, onPick }) {
  return (
    <div className="flex flex-col rounded-2xl bg-[#FFCC00] p-5 text-black shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest">MTN MashUp</p>
      <p className="mt-1 text-3xl font-black">{cedis(p.sellingPrice)}</p>
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

function BuyModal({ pack, slug, onClose }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Lock the page behind the pop-up; Escape closes it.
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
      const r = await fetch(`${API_BASE}/stores/${slug}/mashup/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comboCost: pack.comboCost,
          phoneNumber: phone,
          customerEmail: email.trim().toLowerCase(),
          // Back to the shop's normal payment screen: once paid, a MashUp
          // order is an ordinary store order and that page knows how to show it.
          callbackUrl: `${window.location.origin}/shop/${slug}/payment/verify`,
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
        aria-label={`Buy MTN MashUp ${cedis(pack.sellingPrice)}`}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 text-gray-900 shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-lg font-black">MTN MashUp {cedis(pack.sellingPrice)}</p>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-700 hover:bg-gray-100"
          >
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
            Pay {cedis(pack.sellingPrice)} with MoMo
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">Packs usually arrive instantly.</p>
        </form>
      </div>
    </div>
  );
}

export default function MashupPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.storeSlug;

  const [products, setProducts] = useState(null);   // null = still loading
  const [available, setAvailable] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [picked, setPicked] = useState(null);       // the pack in the pop-up

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/stores/${slug}/mashup`);
        const j = await r.json();
        if (dead) return;
        if (j.status === 'success') {
          setAvailable(j.data.available !== false);
          setProducts(j.data.products || []);
        } else {
          setProducts([]);
        }
      } catch {
        if (!dead) {
          setProducts([]);
          setLoadError('We could not load the packs. Check your connection and try again.');
        }
      }
    })();
    return () => { dead = true; };
  }, [slug]);

  if (products === null) {
    return (
      <main className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-24 text-ink-3">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </main>
    );
  }

  if (!available || products.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">MashUp packs are restocking</h1>
        <p className="mt-2 text-[14px] text-ink-3">
          {loadError || (available
            ? 'This shop sells data bundles. Have a look at those instead.'
            : 'Please check back soon. Data bundles are still on sale.')}
        </p>
        <button onClick={() => router.push(`/shop/${slug}/products`)} className="btn-brand mt-6">
          Browse bundles
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="rounded-3xl bg-black p-6 text-white sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#FFCC00]">New</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">MTN MashUp packs</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-300">
          Data, call minutes and SMS in one pack, valid for 30 days. Pay with MoMo. Packs usually arrive instantly.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <PackCard key={p.comboCost} p={p} onPick={setPicked} />
        ))}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink-4">
        A cheaper pack can carry more call minutes and less data than a dearer one. Pick by what you need. Each card shows exactly what you get.
      </p>

      <button
        onClick={() => router.push(`/shop/${slug}`)}
        className="mt-6 inline-flex items-center gap-2 text-[14px] text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to the shop
      </button>

      {picked && <BuyModal pack={picked} slug={slug} onClose={() => setPicked(null)} />}
    </main>
  );
}
